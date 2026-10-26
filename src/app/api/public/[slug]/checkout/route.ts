import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await request.json()

  // Use admin client to bypass RLS for public order creation
  const admin = createAdminClient()

  // Verify restaurant is active
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, status')
    .eq('slug', slug)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 })

  // Get next order number
  const { data: nextNum } = await admin.rpc('next_order_number', { p_restaurant_id: restaurant.id })

  const {
    customer_name, customer_phone, customer_email,
    order_type, payment_method, payment_intent_id, payment_status,
    notes, delivery_address,
    subtotal, tax_amount, delivery_fee, discount_amount, total,
    coupon_code, items,
  } = body

  // Never trust a client-sent "paid": only mark paid after Stripe confirms this
  // exact intent succeeded for this order's total and it isn't reused.
  let verifiedPaymentStatus = 'pending'
  if (payment_status === 'paid') {
    if (!payment_intent_id) {
      return NextResponse.json({ error: 'Pago no verificado' }, { status: 402 })
    }
    const { data: stripeCfg } = await admin
      .from('restaurants')
      .select('stripe_secret_key, stripe_connected')
      .eq('id', restaurant.id)
      .single()
    if (!stripeCfg?.stripe_connected || !stripeCfg.stripe_secret_key) {
      return NextResponse.json({ error: 'Pago no verificado' }, { status: 402 })
    }
    const stripe = new Stripe(stripeCfg.stripe_secret_key, { apiVersion: '2026-03-25.dahlia' })
    let intent: Stripe.PaymentIntent
    try {
      intent = await stripe.paymentIntents.retrieve(String(payment_intent_id))
    } catch {
      return NextResponse.json({ error: 'Pago no verificado' }, { status: 402 })
    }
    if (intent.status !== 'succeeded' || intent.amount !== Math.round(Number(total) * 100)) {
      return NextResponse.json({ error: 'Pago no verificado' }, { status: 402 })
    }
    const { count: reused } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_intent_id', intent.id)
    if (reused) {
      return NextResponse.json({ error: 'Pago ya utilizado' }, { status: 409 })
    }
    verifiedPaymentStatus = 'paid'
  }

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      restaurant_id: restaurant.id,
      order_number: nextNum ?? 1,
      status: 'new',
      order_type,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      subtotal,
      tax_amount,
      delivery_fee,
      discount_amount,
      total,
      payment_method,
      payment_status: verifiedPaymentStatus,
      payment_intent_id: payment_intent_id ?? null,
      notes,
    })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 400 })

  // Increment coupon usage counter
  if (coupon_code) {
    await admin.rpc('increment_coupon_uses', { p_restaurant_id: restaurant.id, p_code: coupon_code.toUpperCase() }).maybeSingle()
  }

  // Upsert customer record (fire and forget — don't block on failure)
  if (customer_email) {
    void admin.rpc('upsert_customer_from_order', {
      p_restaurant_id: restaurant.id,
      p_order_id: order.id,
      p_email: customer_email,
      p_name: customer_name ?? null,
      p_phone: customer_phone ?? null,
      p_total: total ?? 0,
    })
  }

  if (items?.length > 0) {
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.item_name,
      item_price: item.item_price,
      quantity: item.quantity,
      modifications: item.modifications ?? [],
      selected_options: item.selected_options ?? [],
      notes: item.notes,
      subtotal: item.subtotal,
    }))
    await admin.from('order_items').insert(orderItems)
  }

  return NextResponse.json({ order_id: order.id, order_number: order.order_number })
}

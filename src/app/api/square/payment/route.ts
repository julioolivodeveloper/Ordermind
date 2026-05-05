import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getSquareClient } from '@/lib/square'
import crypto from 'crypto'

export async function POST(req: Request) {
  const { sourceId, restaurantId, orderData } = await req.json()

  if (!sourceId || !restaurantId || !orderData) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: conn } = await admin
    .from('square_connections')
    .select('location_id')
    .eq('restaurant_id', restaurantId)
    .single()

  if (!conn?.location_id) {
    return NextResponse.json({ error: 'Square no configurado para este restaurante' }, { status: 404 })
  }

  // 1. Charge the card via Square
  const square = await getSquareClient(restaurantId)
  const amountCents = Math.round(orderData.total * 100)

  const paymentRes = await square.post<any>('/payments', {
    source_id: sourceId,
    idempotency_key: crypto.randomUUID(),
    amount_money: { amount: amountCents, currency: 'USD' },
    location_id: conn.location_id,
    note: `Ordermind — ${orderData.customer_name}`,
  })

  const squarePaymentId = paymentRes.payment?.id
  if (!squarePaymentId) {
    return NextResponse.json({ error: 'Square no devolvió un ID de pago' }, { status: 500 })
  }

  // 2. Create order directly in DB (same logic as /api/public/[slug]/checkout)
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, status')
    .eq('id', restaurantId)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 })
  }

  const { data: nextNum } = await admin.rpc('next_order_number', { p_restaurant_id: restaurantId })

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      restaurant_id: restaurantId,
      order_number: nextNum ?? 1,
      status: 'new',
      order_type: orderData.order_type,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_email: orderData.customer_email ?? null,
      delivery_address: orderData.delivery_address ?? null,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      delivery_fee: orderData.delivery_fee,
      discount_amount: orderData.discount_amount,
      total: orderData.total,
      payment_method: 'square',
      payment_status: 'paid',
      payment_intent_id: squarePaymentId,
      notes: orderData.notes ?? null,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  if (orderData.coupon_code) {
    await admin.rpc('increment_coupon_uses', {
      p_restaurant_id: restaurantId,
      p_code: orderData.coupon_code.toUpperCase(),
    }).maybeSingle()
  }

  if (orderData.customer_email) {
    void admin.rpc('upsert_customer_from_order', {
      p_restaurant_id: restaurantId,
      p_order_id: order.id,
      p_email: orderData.customer_email,
      p_name: orderData.customer_name ?? null,
      p_phone: orderData.customer_phone ?? null,
      p_total: orderData.total ?? 0,
    })
  }

  if (orderData.items?.length > 0) {
    await admin.from('order_items').insert(
      orderData.items.map((item: any) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        item_price: item.item_price,
        quantity: item.quantity,
        modifications: item.modifications ?? [],
        notes: item.notes ?? null,
        subtotal: item.subtotal,
      }))
    )
  }

  return NextResponse.json({ ok: true, order_id: order.id, order_number: order.order_number, square_payment_id: squarePaymentId })
}

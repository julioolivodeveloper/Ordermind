import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

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
    order_type, payment_method, notes, delivery_address,
    subtotal, tax_amount, delivery_fee, discount_amount, total,
    items,
  } = body

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
      payment_status: 'pending',
      notes,
    })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 400 })

  if (items?.length > 0) {
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.item_name,
      item_price: item.item_price,
      quantity: item.quantity,
      modifications: item.modifications ?? [],
      notes: item.notes,
      subtotal: item.subtotal,
    }))
    await admin.from('order_items').insert(orderItems)
  }

  return NextResponse.json({ order_id: order.id, order_number: order.order_number })
}

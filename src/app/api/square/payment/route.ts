import { createClient } from '@/lib/supabase/server'
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

  try {
    const square = await getSquareClient(restaurantId)

    // Amount in cents (Square uses smallest currency unit)
    const amountCents = Math.round(orderData.total * 100)

    const payment = await square.post<any>('/payments', {
      source_id: sourceId,
      idempotency_key: crypto.randomUUID(),
      amount_money: {
        amount: amountCents,
        currency: 'USD',
      },
      location_id: conn.location_id,
      note: `Ordermind — ${orderData.customer_name}`,
    })

    const squarePaymentId = payment.payment?.id
    if (!squarePaymentId) throw new Error('No se recibió ID de pago de Square')

    // Create the order in our DB
    const supabase = await createClient()
    const { data: restaurant } = await admin
      .from('restaurants').select('slug').eq('id', restaurantId).single()

    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/public/${restaurant?.slug}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        restaurant_id: restaurantId,
        payment_method: 'square',
        square_payment_id: squarePaymentId,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error al crear el pedido')

    return NextResponse.json({ ok: true, order_id: data.order_id, square_payment_id: squarePaymentId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const { paymentIntentId, restaurantId, orderId } = await req.json()

  if (!paymentIntentId || !restaurantId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('stripe_secret_key, stripe_connected')
    .eq('id', restaurantId)
    .single()

  if (!restaurant?.stripe_connected || !restaurant.stripe_secret_key) {
    return NextResponse.json({ error: 'Stripe no configurado' }, { status: 400 })
  }

  const stripe = new Stripe(restaurant.stripe_secret_key, { apiVersion: '2026-03-25.dahlia' })

  let paymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch {
    return NextResponse.json({ error: 'PaymentIntent no encontrado' }, { status: 404 })
  }

  if (paymentIntent.status !== 'succeeded') {
    return NextResponse.json({ error: `Pago no completado (estado: ${paymentIntent.status})` }, { status: 400 })
  }

  // Si se provee orderId, actualizar el pedido como pagado
  if (orderId) {
    const { data: order } = await admin
      .from('orders')
      .select('total')
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
      .single()
    if (!order || paymentIntent.amount !== Math.round(Number(order.total) * 100)) {
      return NextResponse.json({ error: 'El monto del pago no coincide con el pedido' }, { status: 400 })
    }
    const { count: reused } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_intent_id', paymentIntentId)
      .neq('id', orderId)
    if (reused) {
      return NextResponse.json({ error: 'Pago ya utilizado' }, { status: 409 })
    }
    await admin
      .from('orders')
      .update({ payment_status: 'paid', payment_intent_id: paymentIntentId })
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
  }

  return NextResponse.json({
    ok: true,
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
  })
}

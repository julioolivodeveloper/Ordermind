import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

async function getRestaurantWithStripe() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return null

  const admin = createAdminClient()
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, stripe_secret_key, stripe_connected, stripe_terminal_reader_id')
    .eq('id', profile.restaurant_id)
    .single()

  if (!restaurant?.stripe_connected || !restaurant.stripe_secret_key) return null
  return restaurant
}

// GET — list paired readers + saved reader ID
export async function GET() {
  const restaurant = await getRestaurantWithStripe()
  if (!restaurant) return NextResponse.json({ error: 'Stripe no configurado' }, { status: 400 })

  try {
    const stripe = new Stripe(restaurant.stripe_secret_key, { apiVersion: '2026-03-25.dahlia' })
    const { data: readers } = await stripe.terminal.readers.list({ limit: 20 })
    return NextResponse.json({
      readers,
      terminal_reader_id: restaurant.stripe_terminal_reader_id ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — save selected reader
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Sin restaurante' }, { status: 403 })

  const { terminal_reader_id } = await req.json()
  const admin = createAdminClient()
  await admin.from('restaurants').update({ stripe_terminal_reader_id: terminal_reader_id }).eq('id', profile.restaurant_id)
  return NextResponse.json({ ok: true })
}

// POST — create PaymentIntent + send to reader
export async function POST(req: Request) {
  const restaurant = await getRestaurantWithStripe()
  if (!restaurant) return NextResponse.json({ error: 'Stripe no configurado' }, { status: 400 })

  const { orderId, orderNumber, amountCents, readerId, currency } = await req.json()
  if (!orderId || !amountCents || !readerId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  try {
    const stripe = new Stripe(restaurant.stripe_secret_key, { apiVersion: '2026-03-25.dahlia' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: (currency ?? 'usd').toLowerCase(),
      payment_method_types: ['card_present'],
      capture_method: 'manual',
      metadata: { order_id: orderId, order_number: String(orderNumber) },
    })

    const reader = await stripe.terminal.readers.processPaymentIntent(readerId, {
      payment_intent: paymentIntent.id,
    })

    return NextResponse.json({
      ok: true,
      payment_intent_id: paymentIntent.id,
      reader_id: readerId,
      reader_status: (reader as any).action?.status ?? 'in_progress',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

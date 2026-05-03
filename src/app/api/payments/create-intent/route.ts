import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const { restaurantId, amount, currency } = await req.json()

  if (!restaurantId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, stripe_secret_key, stripe_publishable_key, stripe_connected, currency')
    .eq('id', restaurantId)
    .single()

  if (!restaurant?.stripe_connected || !restaurant.stripe_secret_key) {
    return NextResponse.json({ error: 'El restaurante no tiene Stripe configurado' }, { status: 400 })
  }

  const stripe = new Stripe(restaurant.stripe_secret_key, { apiVersion: '2026-03-25.dahlia' })

  // Stripe maneja montos en centavos/unidad mínima
  const amountInCents = Math.round(amount * 100)
  const curr = (currency ?? restaurant.currency ?? 'mxn').toLowerCase()

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: curr,
    automatic_payment_methods: { enabled: true },
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    publishableKey: restaurant.stripe_publishable_key,
    paymentIntentId: paymentIntent.id,
  })
}

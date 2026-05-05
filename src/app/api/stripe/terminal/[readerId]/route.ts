import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ readerId: string }> }
) {
  const { readerId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Sin restaurante' }, { status: 403 })

  const admin = createAdminClient()
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('stripe_secret_key, stripe_connected')
    .eq('id', profile.restaurant_id)
    .single()

  if (!restaurant?.stripe_connected || !restaurant.stripe_secret_key) {
    return NextResponse.json({ error: 'Stripe no configurado' }, { status: 400 })
  }

  try {
    const stripe = new Stripe(restaurant.stripe_secret_key, { apiVersion: '2026-03-25.dahlia' })
    const reader = await stripe.terminal.readers.retrieve(readerId)
    const action = (reader as any).action

    // If payment succeeded, capture it
    if (action?.status === 'succeeded' && action?.process_payment_intent?.payment_intent) {
      await stripe.paymentIntents.capture(action.process_payment_intent.payment_intent)
    }

    return NextResponse.json({
      status: action?.status ?? 'unknown',
      payment_intent_id: action?.process_payment_intent?.payment_intent ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

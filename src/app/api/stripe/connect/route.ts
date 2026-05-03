import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

async function getAuthedRestaurantId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()
  return profile?.restaurant_id ?? null
}

export async function POST(req: Request) {
  const restaurantId = await getAuthedRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { publishableKey, secretKey } = await req.json()

  if (!publishableKey?.startsWith('pk_') || !secretKey?.startsWith('sk_')) {
    return NextResponse.json({ error: 'Las keys tienen un formato inválido. Deben empezar con pk_ y sk_' }, { status: 400 })
  }

  // Misma modalidad (ambas test o ambas live)
  const pubMode = publishableKey.startsWith('pk_test') ? 'test' : 'live'
  const secMode = secretKey.startsWith('sk_test') ? 'test' : 'live'
  if (pubMode !== secMode) {
    return NextResponse.json({ error: 'Las keys deben ser del mismo entorno (ambas test o ambas live)' }, { status: 400 })
  }

  // Validar la secret key llamando a Stripe
  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' })
    await stripe.balance.retrieve()
  } catch {
    return NextResponse.json({ error: 'La Secret Key no es válida o no tiene permisos suficientes' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('restaurants')
    .update({
      stripe_publishable_key: publishableKey,
      stripe_secret_key: secretKey,
      stripe_connected: true,
    })
    .eq('id', restaurantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, mode: pubMode })
}

export async function DELETE() {
  const restaurantId = await getAuthedRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  await admin
    .from('restaurants')
    .update({ stripe_publishable_key: null, stripe_secret_key: null, stripe_connected: false })
    .eq('id', restaurantId)

  return NextResponse.json({ ok: true })
}

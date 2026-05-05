import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const SQUARE_BASE = 'https://connect.squareupsandbox.com'

export async function POST(req: Request) {
  if (process.env.SQUARE_ENVIRONMENT === 'production') {
    return NextResponse.json({ error: 'Solo disponible en sandbox' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Sin restaurante asignado' }, { status: 403 })
  }

  const { access_token } = await req.json()
  if (!access_token?.trim()) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }

  // Verify token and get merchant_id from Square
  const res = await fetch(`${SQUARE_BASE}/v2/merchants/me`, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Square-Version': '2024-01-18',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
  }

  const { merchant } = await res.json()
  const merchant_id = merchant?.id

  if (!merchant_id) {
    return NextResponse.json({ error: 'No se pudo obtener el Merchant ID' }, { status: 400 })
  }

  // Fetch first location
  const locRes = await fetch(`${SQUARE_BASE}/v2/locations`, {
    headers: { 'Authorization': `Bearer ${access_token}`, 'Square-Version': '2024-01-18' },
  })
  const locData = await locRes.json()
  const location_id = locData.locations?.[0]?.id ?? null

  const admin = createAdminClient()
  const { error: dbError } = await admin
    .from('square_connections')
    .upsert(
      {
        restaurant_id: profile.restaurant_id,
        user_id: user.id,
        merchant_id,
        location_id,
        access_token,
        refresh_token: null,
        expires_at: null,
      },
      { onConflict: 'restaurant_id' }
    )

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, merchant_id })
}

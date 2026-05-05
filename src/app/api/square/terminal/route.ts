import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getSquareClient } from '@/lib/square'
import crypto from 'crypto'

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  return profile?.restaurant_id ?? null
}

// GET — list paired terminal devices + current saved device
export async function GET() {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const square = await getSquareClient(restaurantId)
    const data = await square.get<any>('/terminals/devices')
    const devices = data.devices ?? []

    const admin = createAdminClient()
    const { data: conn } = await admin
      .from('square_connections')
      .select('terminal_device_id')
      .eq('restaurant_id', restaurantId)
      .single()

    return NextResponse.json({ devices, terminal_device_id: conn?.terminal_device_id ?? null })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — save selected terminal device
export async function PATCH(req: Request) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { terminal_device_id } = await req.json()
  const admin = createAdminClient()
  await admin
    .from('square_connections')
    .update({ terminal_device_id })
    .eq('restaurant_id', restaurantId)

  return NextResponse.json({ ok: true })
}

// POST — create terminal checkout (charge on physical device)
export async function POST(req: Request) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { orderId, orderNumber, amountCents, deviceId, note } = await req.json()
  if (!orderId || !amountCents || !deviceId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  try {
    const square = await getSquareClient(restaurantId)
    const data = await square.post<any>('/terminals/checkouts', {
      idempotency_key: crypto.randomUUID(),
      checkout: {
        amount_money: { amount: amountCents, currency: 'USD' },
        reference_id: orderId,
        note: note ?? `Orden #${orderNumber}`,
        device_options: {
          device_id: deviceId,
          skip_receipt_screen: false,
          tip_settings: { allow_tipping: false },
        },
        payment_type: 'CARD_PRESENT',
      },
    })

    const checkout = data.checkout
    return NextResponse.json({ ok: true, checkout_id: checkout.id, status: checkout.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

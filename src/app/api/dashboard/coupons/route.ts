import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  return profile?.restaurant_id ?? null
}

export async function GET() {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const admin = createAdminClient()
  const { data } = await admin.from('coupons').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('coupons').insert({ ...body, restaurant_id: restaurantId, code: body.code.toUpperCase().trim() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id, restaurant_id: _restaurantId, ...body } = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('coupons').update(body).eq('id', id).eq('restaurant_id', restaurantId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id } = await req.json()
  const admin = createAdminClient()
  await admin.from('coupons').delete().eq('id', id).eq('restaurant_id', restaurantId)
  return NextResponse.json({ ok: true })
}

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

export async function PATCH(req: Request) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id, ...body } = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('reviews').update(body).eq('id', id).eq('restaurant_id', restaurantId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id } = await req.json()
  const admin = createAdminClient()
  await admin.from('reviews').delete().eq('id', id).eq('restaurant_id', restaurantId)
  return NextResponse.json({ ok: true })
}

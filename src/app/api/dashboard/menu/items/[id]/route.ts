import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function getRestaurantId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()
  if (!profile || !['super_admin', 'restaurant_owner', 'staff'].includes(profile.role)) return null
  return profile.restaurant_id ?? null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  // Solo actualizar campos que vienen en el body
  const allowed = ['name','description','price','image_url','is_available','is_popular',
    'is_spicy','category_id','sort_order','discount_percent','name_en','description_en']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key] === '' ? null : body[key]
  }
  if ('price' in update) update.price = parseFloat(update.price as string) || 0
  if ('discount_percent' in update) update.discount_percent = parseFloat(update.discount_percent as string) || 0

  const { data, error } = await admin
    .from('menu_items')
    .update(update)
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin
    .from('menu_items')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

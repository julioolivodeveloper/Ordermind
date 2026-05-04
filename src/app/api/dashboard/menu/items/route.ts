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

export async function POST(request: Request) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const admin = createAdminClient()

  // Columnas permitidas — evita errores si alguna migración no se corrió
  const row: Record<string, unknown> = {
    restaurant_id: restaurantId,
    name: body.name,
    description: body.description || null,
    price: parseFloat(body.price) || 0,
    image_url: body.image_url || null,
    is_available: body.is_available ?? true,
    is_popular: body.is_popular ?? false,
    is_spicy: body.is_spicy ?? false,
    category_id: body.category_id || null,
    sort_order: body.sort_order ?? 0,
  }

  // Columnas opcionales (de migración 003)
  if (body.discount_percent !== undefined) row.discount_percent = parseFloat(body.discount_percent) || 0
  if (body.name_en !== undefined) row.name_en = body.name_en || null
  if (body.description_en !== undefined) row.description_en = body.description_en || null
  // Columnas opcionales (de migración 007 y 009/010)
  if (body.model_url !== undefined) row.model_url = body.model_url || null
  if (body.model_usdz_url !== undefined) row.model_usdz_url = body.model_usdz_url || null
  if (body.model_scale_cm !== undefined) row.model_scale_cm = parseInt(body.model_scale_cm) || 18
  if (body.model_width_cm !== undefined) row.model_width_cm = parseInt(body.model_width_cm) || 18
  if (body.model_height_cm !== undefined) row.model_height_cm = parseInt(body.model_height_cm) || 18

  const { data, error } = await admin
    .from('menu_items')
    .insert(row)
    .select('*, ingredients:item_ingredients(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

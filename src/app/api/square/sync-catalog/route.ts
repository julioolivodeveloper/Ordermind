import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getSquareClient } from '@/lib/square'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Sin restaurante' }, { status: 403 })

  const admin = createAdminClient()
  const { data: conn } = await admin
    .from('square_connections').select('location_id').eq('restaurant_id', profile.restaurant_id).single()
  if (!conn) return NextResponse.json({ error: 'Square no conectado' }, { status: 404 })

  try {
    const square = await getSquareClient(profile.restaurant_id)

    // Fetch catalog items and images
    const catalogData = await square.get<any>('/catalog/list?types=ITEM,IMAGE')
    const objects: any[] = catalogData.objects ?? []

    const images: Record<string, string> = {}
    objects.filter(o => o.type === 'IMAGE').forEach(img => {
      images[img.id] = img.image_data?.url ?? ''
    })

    const items = objects.filter(o => o.type === 'ITEM')

    // Get or create a default category for synced items
    const { data: existingCat } = await admin
      .from('menu_categories')
      .select('id')
      .eq('restaurant_id', profile.restaurant_id)
      .limit(1)
      .single()

    let categoryId = existingCat?.id
    if (!categoryId) {
      const { data: newCat } = await admin
        .from('menu_categories')
        .insert({ restaurant_id: profile.restaurant_id, name: 'Square Catalog', sort_order: 0 })
        .select('id').single()
      categoryId = newCat?.id
    }

    let created = 0
    let updated = 0

    for (const obj of items) {
      const itemData = obj.item_data
      if (!itemData) continue

      const name = itemData.name ?? 'Sin nombre'
      const description = itemData.description ?? ''
      const variation = itemData.variations?.[0]?.item_variation_data
      const priceAmount = variation?.price_money?.amount ?? 0
      const price = priceAmount / 100 // cents to dollars/pesos

      const imageId = itemData.image_ids?.[0]
      const image_url = imageId ? images[imageId] : null

      const { data: existing } = await admin
        .from('menu_items')
        .select('id')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('square_item_id', obj.id)
        .single()

      if (existing) {
        await admin.from('menu_items').update({
          name, description, price, image_url: image_url ?? undefined,
        }).eq('id', existing.id)
        updated++
      } else {
        await admin.from('menu_items').insert({
          restaurant_id: profile.restaurant_id,
          category_id: categoryId,
          square_item_id: obj.id,
          name, description, price,
          image_url: image_url ?? null,
          is_available: true,
          sort_order: 0,
        })
        created++
      }
    }

    return NextResponse.json({ ok: true, created, updated, total: items.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

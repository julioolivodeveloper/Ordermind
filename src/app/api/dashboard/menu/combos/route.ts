import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: create combo (menu_item with is_combo=true) + combo_items
export async function POST(req: Request) {
  const supabase = await createClient()
  const { name, description, price, category_id, image_url, restaurant_id, component_ids } = await req.json()

  const { data: item, error } = await supabase
    .from('menu_items')
    .insert({ name, description, price, category_id: category_id || null, image_url, restaurant_id, is_combo: true, is_available: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (component_ids?.length) {
    const rows = component_ids.map((id: string, i: number) => ({
      combo_id: item.id,
      component_id: id,
      sort_order: i,
    }))
    await supabase.from('combo_items').insert(rows)
  }

  return NextResponse.json(item)
}

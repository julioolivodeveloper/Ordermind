import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH: update combo + replace component_ids
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { component_ids, ...fields } = await req.json()

  const { error } = await supabase.from('menu_items').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (component_ids) {
    await supabase.from('combo_items').delete().eq('combo_id', id)
    if (component_ids.length) {
      await supabase.from('combo_items').insert(
        component_ids.map((cid: string, i: number) => ({ combo_id: id, component_id: cid, sort_order: i }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}

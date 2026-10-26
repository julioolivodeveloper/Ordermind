import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAcaTortasAdmin } from '@/lib/acatortas-auth'

// GET /api/acatortas/menu — overrides de disponibilidad
export async function GET() {
  const db = createAdminClient()
  const { data, error } = await db.from('acatortas_menu_overrides').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/acatortas/menu — upsert override de un item
export async function POST(req: NextRequest) {
  const deny = requireAcaTortasAdmin(req)
  if (deny) return deny
  const { item_id, available, price } = await req.json()
  if (!item_id) return NextResponse.json({ error: 'item_id requerido' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('acatortas_menu_overrides')
    .upsert({ item_id, available, price: price ?? null, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

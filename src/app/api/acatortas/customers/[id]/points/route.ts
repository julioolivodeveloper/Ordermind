import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/acatortas/customers/[id]/points — ajuste manual de puntos (canjeo en caja)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { delta } = await req.json()

  if (typeof delta !== 'number') {
    return NextResponse.json({ error: 'delta requerido' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data: customer } = await db
    .from('acatortas_customers')
    .select('points')
    .eq('id', id)
    .single()

  if (!customer) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const newPoints = Math.max(0, customer.points + delta)
  const { data, error } = await db
    .from('acatortas_customers')
    .update({ points: newPoints })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

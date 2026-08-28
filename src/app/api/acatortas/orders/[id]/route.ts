import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_STATUSES = ['nuevo', 'preparando', 'listo', 'entregado', 'cancelado']

// PATCH /api/acatortas/orders/[id] — actualizar estatus desde el dashboard
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await req.json()

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Estatus inválido' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('acatortas_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

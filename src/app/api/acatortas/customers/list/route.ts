import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/acatortas/customers/list — todos los clientes para el dashboard
export async function GET() {
  const db = createAdminClient()
  const { data, error } = await db
    .from('acatortas_customers')
    .select('*')
    .order('order_count', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

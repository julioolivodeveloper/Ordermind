import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/acatortas/customers?phone=9155551234
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'phone requerido' }, { status: 400 })

  const db = createAdminClient()
  const { data: customer } = await db
    .from('acatortas_customers')
    .select('*')
    .eq('phone', phone)
    .single()

  if (!customer) return NextResponse.json({ customer: null, orders: [] })

  const { data: orders } = await db
    .from('acatortas_orders')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ customer, orders: orders ?? [] })
}

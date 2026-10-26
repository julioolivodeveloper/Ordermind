import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAcaTortasAdmin } from '@/lib/acatortas-auth'

// GET /api/acatortas/orders — para el dashboard
export async function GET(req: NextRequest) {
  const deny = requireAcaTortasAdmin(req)
  if (deny) return deny
  const db = createAdminClient()
  const { data, error } = await db
    .from('acatortas_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/acatortas/orders — cliente hace un pedido
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customerName, customerPhone, notes, items, total } = body

  if (!customerName || !customerPhone || !items?.length) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const db = createAdminClient()

  // Upsert cliente
  const { data: customer, error: custErr } = await db
    .from('acatortas_customers')
    .upsert({ name: customerName, phone: customerPhone }, { onConflict: 'phone' })
    .select()
    .single()

  if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 })

  // Número de orden atómico
  const { data: numData, error: numErr } = await db.rpc('acatortas_next_order_number')
  if (numErr) return NextResponse.json({ error: numErr.message }, { status: 500 })

  const orderNumber = numData as number
  const pointsEarned = Math.floor(total)

  // Crear orden
  const { data: order, error: orderErr } = await db
    .from('acatortas_orders')
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: notes ?? '',
      items,
      total,
      points_earned: pointsEarned,
      status: 'nuevo',
    })
    .select()
    .single()

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })

  // Sumar puntos y orden al cliente
  await db
    .from('acatortas_customers')
    .update({
      points: customer.points + pointsEarned,
      order_count: customer.order_count + 1,
    })
    .eq('id', customer.id)

  return NextResponse.json({ order, customer }, { status: 201 })
}

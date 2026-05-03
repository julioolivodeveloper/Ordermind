import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { code, orderTotal } = await req.json()

  if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const admin = createAdminClient()

  const { data: restaurant } = await admin.from('restaurants').select('id').eq('slug', slug).single()
  if (!restaurant) return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 })

  const { data: coupon } = await admin
    .from('coupons')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (!coupon) return NextResponse.json({ error: 'Cupón inválido o inactivo' }, { status: 404 })

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este cupón ya expiró' }, { status: 400 })
  }

  if (coupon.max_uses !== null && coupon.times_used >= coupon.max_uses) {
    return NextResponse.json({ error: 'Este cupón ya alcanzó el límite de usos' }, { status: 400 })
  }

  if (coupon.min_order > 0 && orderTotal < coupon.min_order) {
    return NextResponse.json({ error: `Mínimo de orden: $${coupon.min_order}` }, { status: 400 })
  }

  const discount = coupon.type === 'percent'
    ? Math.min(orderTotal * (coupon.amount / 100), orderTotal)
    : Math.min(coupon.amount, orderTotal)

  return NextResponse.json({
    valid: true,
    coupon_id: coupon.id,
    type: coupon.type,
    amount: coupon.amount,
    discount: Math.round(discount * 100) / 100,
  })
}

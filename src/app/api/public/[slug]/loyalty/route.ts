import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const phone = new URL(req.url).searchParams.get('phone')
  if (!phone) return NextResponse.json({ points: 0 })
  const admin = createAdminClient()
  const { data: restaurant } = await admin.from('restaurants').select('id').eq('slug', slug).single()
  if (!restaurant) return NextResponse.json({ points: 0 })
  const { data } = await admin.from('loyalty_points').select('points, total_spent').eq('restaurant_id', restaurant.id).eq('customer_phone', phone).single()
  return NextResponse.json(data ?? { points: 0, total_spent: 0 })
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: restaurant } = await admin.from('restaurants').select('id, loyalty_points_per_dollar, loyalty_enabled').eq('slug', slug).single()
  if (!restaurant || !restaurant.loyalty_enabled) return NextResponse.json({ ok: true })
  const { customer_phone, customer_name, amount_spent, redeem } = await req.json()
  if (!customer_phone) return NextResponse.json({ ok: true })

  const { data: existing } = await admin.from('loyalty_points').select('*').eq('restaurant_id', restaurant.id).eq('customer_phone', customer_phone).single()

  const pointsEarned = Math.floor((amount_spent ?? 0) * (restaurant.loyalty_points_per_dollar ?? 10))
  const pointsToRedeem = redeem ? (existing?.points ?? 0) : 0

  if (existing) {
    await admin.from('loyalty_points').update({
      points: Math.max(0, (existing.points + pointsEarned) - pointsToRedeem),
      total_spent: (existing.total_spent ?? 0) + (amount_spent ?? 0),
      customer_name: customer_name ?? existing.customer_name,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)
  } else {
    await admin.from('loyalty_points').insert({
      restaurant_id: restaurant.id,
      customer_phone,
      customer_name,
      points: pointsEarned,
      total_spent: amount_spent ?? 0,
    })
  }
  return NextResponse.json({ points_earned: pointsEarned, points_redeemed: pointsToRedeem })
}

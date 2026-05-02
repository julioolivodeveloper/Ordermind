import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: restaurant } = await admin.from('restaurants').select('id').eq('slug', slug).single()
  if (!restaurant) return NextResponse.json([])
  const { data } = await admin.from('reviews').select('*').eq('restaurant_id', restaurant.id).eq('is_visible', true).order('created_at', { ascending: false }).limit(20)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: restaurant } = await admin.from('restaurants').select('id').eq('slug', slug).single()
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  if (!body.customer_name || !body.rating) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  const { data, error } = await admin.from('reviews').insert({ ...body, restaurant_id: restaurant.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

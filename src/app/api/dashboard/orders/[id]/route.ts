import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getRestaurantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role, restaurant_id').eq('id', user.id).single()
  return data?.role === 'super_admin' ? 'any' : data?.restaurant_id ?? null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const { status } = await request.json()

  const validStatuses = ['new', 'confirmed', 'preparing', 'ready', 'on_the_way', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const query = supabase.from('orders').update({ status }).eq('id', id)
  if (restaurantId !== 'any') query.eq('restaurant_id', restaurantId)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

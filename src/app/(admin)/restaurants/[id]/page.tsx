import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RestaurantEditForm } from '@/components/admin/RestaurantEditForm'

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (!restaurant) notFound()

  const { data: plans } = await supabase.from('plans').select('*').eq('is_active', true)
  const { data: owner } = restaurant.owner_id
    ? await supabase.from('profiles').select('id, full_name, is_active').eq('id', restaurant.owner_id).single()
    : { data: null }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [{ count: totalOrders }, { data: todayRevData }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', id),
    supabase.from('orders').select('total').eq('restaurant_id', id).gte('created_at', today.toISOString()),
  ])
  const todayRevenue = todayRevData?.reduce((s, o) => s + (o.total || 0), 0) ?? 0

  return (
    <RestaurantEditForm
      restaurant={restaurant}
      plans={plans ?? []}
      owner={owner}
      stats={{ totalOrders: totalOrders ?? 0, todayRevenue }}
    />
  )
}

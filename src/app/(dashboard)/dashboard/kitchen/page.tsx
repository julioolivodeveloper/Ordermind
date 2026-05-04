import { requireRestaurantAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { KitchenBoard } from '@/components/dashboard/KitchenBoard'

export default async function KitchenPage() {
  const profile = await requireRestaurantAccess()
  const supabase = await createClient()
  const admin = createAdminClient()

  const [ordersResult, restaurantResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', profile.restaurant_id!)
      .in('status', ['new', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true }),
    admin
      .from('restaurants')
      .select('name')
      .eq('id', profile.restaurant_id!)
      .single(),
  ])

  return (
    <KitchenBoard
      initialOrders={ordersResult.data ?? []}
      restaurantId={profile.restaurant_id!}
      restaurantName={restaurantResult.data?.name}
    />
  )
}

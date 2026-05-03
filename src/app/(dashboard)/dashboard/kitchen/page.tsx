import { requireRestaurantAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { KitchenBoard } from '@/components/dashboard/KitchenBoard'

export default async function KitchenPage() {
  const profile = await requireRestaurantAccess()
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', profile.restaurant_id!)
    .in('status', ['new', 'confirmed', 'preparing', 'ready'])
    .order('created_at', { ascending: true })

  return <KitchenBoard initialOrders={orders ?? []} restaurantId={profile.restaurant_id!} />
}

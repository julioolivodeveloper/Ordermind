import { requireRestaurantAccess, formatCurrency, timeAgo } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { OrdersBoard } from '@/components/dashboard/OrdersBoard'

export default async function OrdersPage() {
  const profile = await requireRestaurantAccess()
  const supabase = await createClient()

  const restaurantId = profile.restaurant_id

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(100)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) ?? []
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0)
  const pending = orders?.filter(o => ['new', 'confirmed', 'preparing'].includes(o.status)).length ?? 0

  return (
    <div className="p-6 bg-[#111111] min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-white/40 text-sm mt-1">Gestiona los pedidos en tiempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-2xl border border-white/8 p-4">
          <p className="text-xs text-white/40">Ventas hoy</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(todayRevenue)}</p>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/8 p-4">
          <p className="text-xs text-white/40">Pedidos hoy</p>
          <p className="text-xl font-bold text-white mt-1">{todayOrders.length}</p>
        </div>
        <div className="bg-[#a3e635]/10 rounded-2xl border border-[#a3e635]/20 p-4">
          <p className="text-xs text-white/40">En proceso</p>
          <p className="text-xl font-bold text-[#a3e635] mt-1">{pending}</p>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/8 p-4">
          <p className="text-xs text-white/40">Ticket promedio</p>
          <p className="text-xl font-bold text-white mt-1">
            {todayOrders.length ? formatCurrency(todayRevenue / todayOrders.length) : formatCurrency(0)}
          </p>
        </div>
      </div>

      <OrdersBoard initialOrders={orders ?? []} restaurantId={restaurantId!} />
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { OrdersBoard } from '@/components/dashboard/OrdersBoard'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminRestaurantOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin()
  const { id } = await params
  const admin = createAdminClient()

  const { data: restaurant } = await admin.from('restaurants').select('id, name, slug').eq('id', id).single()
  if (!restaurant) notFound()

  const { data: orders } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) ?? []
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0)
  const pending = orders?.filter(o => ['new', 'confirmed', 'preparing'].includes(o.status)).length ?? 0

  return (
    <div className="p-6 bg-[#111111] min-h-full">
      <div className="mb-6">
        <Link href={`/admin/restaurants/${id}`} className="text-white/40 hover:text-white text-sm flex items-center gap-1 mb-3 transition-colors">
          ← {restaurant.name}
        </Link>
        <h1 className="text-2xl font-bold text-white">Pedidos — {restaurant.name}</h1>
        <p className="text-white/40 text-sm mt-1">/{restaurant.slug}</p>
      </div>

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

      <OrdersBoard initialOrders={orders ?? []} restaurantId={id} />
    </div>
  )
}

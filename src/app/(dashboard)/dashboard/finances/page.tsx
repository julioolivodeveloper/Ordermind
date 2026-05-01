import { requireRestaurantAccess, formatCurrency } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function FinancesPage() {
  const profile = await requireRestaurantAccess()
  const supabase = await createClient()
  const restaurantId = profile.restaurant_id!

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0,0,0,0)

  const [todayRes, weekRes, monthRes] = await Promise.all([
    supabase.from('orders').select('total, payment_method, order_type, status').eq('restaurant_id', restaurantId).gte('created_at', todayStart.toISOString()),
    supabase.from('orders').select('total, payment_method, order_type, status').eq('restaurant_id', restaurantId).gte('created_at', weekStart.toISOString()),
    supabase.from('orders').select('total, payment_method, order_type, status').eq('restaurant_id', restaurantId).gte('created_at', monthStart.toISOString()),
  ])

  function summarize(orders: any[]) {
    const paid = orders.filter(o => o.status !== 'cancelled')
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0)
    const byPay: Record<string, number> = {}
    const byType: Record<string, number> = {}
    paid.forEach(o => {
      byPay[o.payment_method] = (byPay[o.payment_method] || 0) + (o.total || 0)
      byType[o.order_type] = (byType[o.order_type] || 0) + (o.total || 0)
    })
    return { count: paid.length, revenue, avg: paid.length ? revenue / paid.length : 0, byPay, byType }
  }

  const today = summarize(todayRes.data ?? [])
  const week = summarize(weekRes.data ?? [])
  const month = summarize(monthRes.data ?? [])

  const { data: topItems } = await supabase
    .from('order_items')
    .select('item_name, subtotal')
    .in('order_id',
      (await supabase.from('orders').select('id').eq('restaurant_id', restaurantId).neq('status', 'cancelled')).data?.map(o => o.id) ?? []
    )
    .limit(200)

  const itemMap: Record<string, { count: number; revenue: number }> = {}
  topItems?.forEach(i => {
    if (!itemMap[i.item_name]) itemMap[i.item_name] = { count: 0, revenue: 0 }
    itemMap[i.item_name].count++
    itemMap[i.item_name].revenue += i.subtotal || 0
  })
  const topList = Object.entries(itemMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const payLabel: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', stripe: 'Online', paypal: 'PayPal' }
  const typeLabel: Record<string, string> = { pickup: 'Para llevar', delivery: 'Delivery', dine_in: 'En mesa' }

  return (
    <div className="p-6 bg-[#111111] min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        <p className="text-white/40 text-sm mt-1">Resumen de ingresos y ventas</p>
      </div>

      {/* Period cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Hoy', data: today },
          { label: 'Esta semana', data: week },
          { label: 'Este mes', data: month },
        ].map(({ label, data }, i) => (
          <div key={label} className={`rounded-2xl border p-5 ${i === 0 ? 'bg-[#a3e635]/10 border-[#a3e635]/20' : 'bg-white/5 border-white/8'}`}>
            <p className="text-sm font-medium text-white/50 mb-3">{label}</p>
            <p className={`text-3xl font-bold ${i === 0 ? 'text-[#a3e635]' : 'text-white'}`}>{formatCurrency(data.revenue)}</p>
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-xs text-white/30">Pedidos</p>
                <p className="font-semibold text-white/70">{data.count}</p>
              </div>
              <div>
                <p className="text-xs text-white/30">Ticket prom.</p>
                <p className="font-semibold text-white/70">{formatCurrency(data.avg)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* By payment method */}
        <div className="bg-white/5 rounded-2xl border border-white/8 p-5">
          <h3 className="font-semibold text-white mb-4">Por método de pago (mes)</h3>
          {Object.entries(month.byPay).length ? (
            <div className="space-y-3">
              {Object.entries(month.byPay).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm text-white/50">{payLabel[method] ?? method}</span>
                  <span className="font-semibold text-white text-sm">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-white/30">Sin datos</p>}
        </div>

        {/* By order type */}
        <div className="bg-white/5 rounded-2xl border border-white/8 p-5">
          <h3 className="font-semibold text-white mb-4">Por tipo de pedido (mes)</h3>
          {Object.entries(month.byType).length ? (
            <div className="space-y-3">
              {Object.entries(month.byType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-white/50">{typeLabel[type] ?? type}</span>
                  <span className="font-semibold text-white text-sm">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-white/30">Sin datos</p>}
        </div>

        {/* Top items */}
        <div className="bg-white/5 rounded-2xl border border-white/8 p-5">
          <h3 className="font-semibold text-white mb-4">Más vendidos</h3>
          {topList.length ? (
            <div className="space-y-3">
              {topList.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#a3e635] w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-white/30">{item.count} vendidos</p>
                  </div>
                  <span className="text-sm font-semibold text-white">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-white/30">Sin datos</p>}
        </div>
      </div>
    </div>
  )
}

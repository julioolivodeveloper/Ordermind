import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: total },
    { count: active },
    { count: demo },
    { count: suspended },
  ] = await Promise.all([
    supabase.from('restaurants').select('*', { count: 'exact', head: true }),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'demo'),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', today.toISOString())

  const todayRevenue = todayOrders?.reduce((s, o) => s + (o.total || 0), 0) ?? 0
  const todayCount = todayOrders?.length ?? 0

  const { data: recentRestaurants } = await supabase
    .from('restaurants')
    .select('id, name, slug, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total Restaurantes', value: total ?? 0, color: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-600' },
    { label: 'Activos', value: active ?? 0, color: 'bg-green-50 border-green-100', text: 'text-green-600' },
    { label: 'En Demo', value: demo ?? 0, color: 'bg-blue-50 border-blue-100', text: 'text-blue-600' },
    { label: 'Suspendidos', value: suspended ?? 0, color: 'bg-red-50 border-red-100', text: 'text-red-600' },
    { label: 'Pedidos Hoy', value: todayCount, color: 'bg-purple-50 border-purple-100', text: 'text-purple-600' },
    { label: 'Ingresos Hoy', value: formatCurrency(todayRevenue), color: 'bg-orange-50 border-orange-100', text: 'text-orange-600' },
  ]

  const statusLabel: Record<string, string> = {
    active: 'Activo', demo: 'Demo', suspended: 'Suspendido', pending: 'Pendiente',
  }
  const statusColor: Record<string, string> = {
    active: 'text-green-600 bg-green-50', demo: 'text-blue-600 bg-blue-50',
    suspended: 'text-red-600 bg-red-50', pending: 'text-yellow-600 bg-yellow-50',
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Visión general de todos los restaurantes</p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          + Nuevo Restaurante
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent restaurants */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Restaurantes Recientes</h2>
          <Link href="/admin/restaurants" className="text-indigo-600 text-sm font-medium hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentRestaurants?.map(r => (
            <div key={r.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-slate-800">{r.name}</p>
                <p className="text-slate-400 text-sm">/{r.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[r.status]}`}>
                  {statusLabel[r.status]}
                </span>
                <Link href={`/admin/restaurants/${r.id}`} className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">
                  Editar →
                </Link>
              </div>
            </div>
          ))}
          {!recentRestaurants?.length && (
            <div className="px-6 py-10 text-center text-slate-400">
              <p className="text-4xl mb-2">🍽️</p>
              <p className="font-medium">No hay restaurantes aún</p>
              <Link href="/admin/restaurants/new" className="text-indigo-600 text-sm font-medium hover:underline mt-1 inline-block">
                Crear el primero
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

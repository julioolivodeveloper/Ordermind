import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const statusLabel: Record<string, string> = {
  active: 'Activo', demo: 'Demo', suspended: 'Suspendido', pending: 'Pendiente',
}

export default async function RestaurantsPage() {
  const supabase = await createClient()
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*, plan:plans(name), owner:profiles!restaurants_owner_id_fkey(full_name, id)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Restaurantes</h1>
          <p className="text-slate-500 text-sm mt-1">{restaurants?.length ?? 0} restaurantes registrados</p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          + Nuevo Restaurante
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {restaurants?.length ? (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Restaurante</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dueño</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menú Público</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {restaurants.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{r.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">/{r.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={r.status} label={statusLabel[r.status]} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{(r.plan as any)?.name ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{(r.owner as any)?.full_name ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {r.status !== 'suspended' && (
                      <a
                        href={`/r/${r.slug}`}
                        target="_blank"
                        className="text-indigo-600 text-sm hover:underline"
                      >
                        /r/{r.slug} ↗
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/restaurants/${r.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                    >
                      Gestionar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center text-slate-400">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="text-lg font-medium text-slate-600">No hay restaurantes creados</p>
            <p className="text-sm mt-1">Crea el primero para comenzar a vender</p>
            <Link
              href="/admin/restaurants/new"
              className="mt-4 inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Crear restaurante
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

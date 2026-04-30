import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, restaurant:restaurants(name, slug)')
    .order('created_at', { ascending: false })

  const admin = createAdminClient()
  const { data: { users } } = await admin.auth.admin.listUsers()
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]))

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    restaurant_owner: 'Dueño',
    staff: 'Staff',
    customer: 'Cliente',
  }
  const roleColor: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    restaurant_owner: 'bg-indigo-100 text-indigo-700',
    staff: 'bg-blue-100 text-blue-700',
    customer: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
        <p className="text-slate-500 text-sm mt-1">{profiles?.length ?? 0} usuarios en el sistema</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Restaurante</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {profiles?.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                      {(p.full_name ?? emailMap[p.id] ?? 'U')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{p.full_name ?? '—'}</p>
                      <p className="text-slate-400 text-xs">{emailMap[p.id] ?? ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColor[p.role]}`}>
                    {roleLabel[p.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {(p.restaurant as any)?.name ?? '—'}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.is_active ? 'Activo' : 'Suspendido'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(p.created_at).toLocaleDateString('es-MX')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

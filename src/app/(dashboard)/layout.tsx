import { requireRestaurantAccess } from '@/lib/auth'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { ToastProvider } from '@/components/ui/Toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRestaurantAccess()

  if (!profile.restaurant_id && profile.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-4xl mb-4">🍽️</p>
          <h1 className="text-xl font-bold text-slate-800">Sin restaurante asignado</h1>
          <p className="text-slate-500 text-sm mt-2">Contacta al administrador para que te asigne un restaurante.</p>
          <a href="/api/auth/signout" className="mt-6 inline-block text-sm text-indigo-600 hover:underline">
            Cerrar sesión
          </a>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-slate-50">
        <DashboardSidebar profile={profile} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ToastProvider>
  )
}

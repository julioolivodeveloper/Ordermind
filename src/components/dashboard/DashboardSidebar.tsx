'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const nav = [
  { href: '/dashboard/orders', label: 'Pedidos', icon: '📋' },
  { href: '/dashboard/menu', label: 'Menú', icon: '🍽️' },
  { href: '/dashboard/finances', label: 'Finanzas', icon: '💰' },
  { href: '/dashboard/settings', label: 'Configuración', icon: '⚙️' },
]

export function DashboardSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const restaurant = profile.restaurant as any

  return (
    <aside className="w-60 bg-[#1e1b4b] flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-indigo-800">
        <div className="flex items-center gap-2.5">
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-sm"
              style={{ backgroundColor: restaurant?.primary_color ?? '#f97316' }}
            >
              {(restaurant?.name ?? 'R')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate">
              {restaurant?.name ?? 'Restaurante'}
            </p>
            <p className="text-indigo-400 text-xs mt-0.5 capitalize">{profile.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-300 hover:bg-indigo-800/60 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-indigo-800 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {(profile.full_name ?? 'U')[0]?.toUpperCase()}
          </div>
          <p className="text-indigo-200 text-xs truncate">{profile.full_name ?? 'Usuario'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-indigo-400 hover:bg-indigo-800/60 hover:text-white transition-colors w-full"
        >
          ↩ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col shrink-0 border-r border-white/5">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm shadow-lg"
              style={{ backgroundColor: restaurant?.primary_color ?? '#f97316' }}
            >
              {(restaurant?.name ?? 'R')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none truncate">
              {restaurant?.name ?? 'Restaurante'}
            </p>
            <p className="text-slate-500 text-xs mt-1 capitalize">{profile.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className="block relative">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-indigo-600 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Ver restaurante */}
      {restaurant?.slug && (
        <div className="px-3 pb-2">
          <a
            href={`/r/${restaurant.slug}`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-300 hover:from-orange-500/30 hover:to-pink-500/30 hover:text-orange-200 transition-all border border-orange-500/20 w-full"
          >
            <span className="text-base">👁️</span>
            Ver mi restaurante
          </a>
        </div>
      )}

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
            {(profile.full_name ?? 'U')[0]?.toUpperCase()}
          </div>
          <p className="text-slate-400 text-xs truncate">{profile.full_name ?? 'Usuario'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors w-full"
        >
          ↩ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

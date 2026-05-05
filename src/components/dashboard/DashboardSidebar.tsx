'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ClipboardList, UtensilsCrossed, BarChart3, Settings, Eye, LogOut, Tag, Star, CreditCard, ChefHat, Ticket, Users, Grid2x2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const nav = [
  { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/promotions', label: 'Promotions', icon: Tag },
  { href: '/dashboard/coupons', label: 'Coupons', icon: Ticket },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { href: '/dashboard/stripe', label: 'Stripe Payments', icon: CreditCard },
  { href: '/dashboard/square', label: 'Square Payments', icon: Grid2x2 },
  { href: '/dashboard/finances', label: 'Finances', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
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
    <aside className="w-64 bg-[#0a0a0a] flex flex-col shrink-0 border-r border-white/5">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-black font-black text-sm shadow-lg"
              style={{ backgroundColor: '#a3e635' }}
            >
              {(restaurant?.name ?? 'R')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none truncate">
              {restaurant?.name ?? 'Restaurante'}
            </p>
            <p className="text-white/30 text-xs mt-1 capitalize">{profile.role.replace('_', ' ')}</p>
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
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: '#a3e635' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active ? 'text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}>
                <item.icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 1.8} />
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#a3e635]/10 text-[#a3e635] hover:bg-[#a3e635]/20 transition-all border border-[#a3e635]/20 w-full"
          >
            <Eye className="w-4 h-4 shrink-0" strokeWidth={1.8} />
            Ver mi restaurante
          </a>
        </div>
      )}

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 bg-[#a3e635] rounded-full flex items-center justify-center text-black text-xs font-black shrink-0">
            {(profile.full_name ?? 'U')[0]?.toUpperCase()}
          </div>
          <p className="text-white/40 text-xs truncate">{profile.full_name ?? 'Usuario'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

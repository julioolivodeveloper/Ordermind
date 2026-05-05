'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ClipboardList, UtensilsCrossed, BarChart3, Settings,
  Eye, ChevronLeft, Tag, Star, Users
} from 'lucide-react'

interface Restaurant { id: string; name: string; slug: string; logo_url: string | null; primary_color: string }

export function RestaurantDashboardSidebar({ restaurant }: { restaurant: Restaurant }) {
  const pathname = usePathname()
  const base = `/admin/restaurants/${restaurant.id}`
  const color = restaurant.primary_color || '#a3e635'

  const nav = [
    { href: `${base}/orders`,     label: 'Pedidos',    icon: ClipboardList },
    { href: `${base}/menu`,       label: 'Menú',       icon: UtensilsCrossed },
    { href: `${base}/customers`,  label: 'Clientes',   icon: Users },
    { href: `${base}/promotions`, label: 'Promociones',icon: Tag },
    { href: `${base}/reviews`,    label: 'Reseñas',    icon: Star },
    { href: `${base}/finances`,   label: 'Finanzas',   icon: BarChart3 },
    { href: `${base}`,            label: 'Configuración', icon: Settings, exact: true },
  ]

  return (
    <aside className="w-64 bg-[#0a0a0a] flex flex-col shrink-0 border-r border-white/5">

      {/* Back to admin */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/admin/restaurants"
          className="flex items-center gap-1.5 text-white/30 hover:text-white text-xs font-medium transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Todos los restaurantes
        </Link>
      </div>

      {/* Restaurant brand */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-lg"
              style={{ backgroundColor: color, color: '#000' }}
            >
              {restaurant.name[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none truncate">{restaurant.name}</p>
            <p className="text-white/30 text-xs mt-1">/{restaurant.slug}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className="block relative">
              {active && (
                <motion.div
                  layoutId="admin-restaurant-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: color }}
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

      {/* Ver menú público */}
      <div className="px-3 pb-4">
        <a
          href={`/r/${restaurant.slug}`}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border w-full"
          style={{ backgroundColor: color + '15', color, borderColor: color + '30' }}
        >
          <Eye className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          Ver menú público
        </a>
      </div>
    </aside>
  )
}

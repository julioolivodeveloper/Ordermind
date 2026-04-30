'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: '⊞' },
  { href: '/admin/restaurants', label: 'Restaurantes', icon: '🍽️' },
  { href: '/admin/users', label: 'Usuarios', icon: '👥' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 bg-[#1e1b4b] flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-indigo-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Ordermind</p>
            <p className="text-indigo-400 text-xs mt-0.5">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)
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

      {/* Footer */}
      <div className="px-3 py-4 border-t border-indigo-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-300 hover:bg-indigo-800/60 hover:text-white transition-colors w-full"
        >
          <span>↩</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

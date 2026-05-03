'use client'
import { useState } from 'react'
import { Users, Search, ExternalLink, Phone, Mail, ShoppingBag, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Customer {
  id: string; email: string | null; name: string | null; phone: string | null
  total_orders: number; total_spent: number; last_order_at: string | null; created_at: string
}

export function CustomersManager({ initial, restaurantSlug }: { initial: Customer[]; restaurantSlug: string }) {
  const [query, setQuery] = useState('')

  const filtered = initial.filter(c => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Customers</h2>
          <p className="text-white/40 text-sm mt-0.5">{initial.length} customers who have ordered</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center min-w-[80px]">
            <p className="text-white font-bold text-lg">{initial.length}</p>
            <p className="text-white/40 text-xs">Total</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center min-w-[80px]">
            <p className="text-white font-bold text-lg">
              {formatCurrency(initial.reduce((s, c) => s + (c.total_spent ?? 0), 0))}
            </p>
            <p className="text-white/40 text-xs">Revenue</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#a3e635]/50"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">
            {query ? 'No customers match your search' : 'No customers yet — they appear here after placing an order'}
          </p>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wide px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Contact</th>
                <th className="text-right text-xs font-semibold text-white/40 uppercase tracking-wide px-4 py-3">Orders</th>
                <th className="text-right text-xs font-semibold text-white/40 uppercase tracking-wide px-4 py-3">Spent</th>
                <th className="text-right text-xs font-semibold text-white/40 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Last order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`${i > 0 ? 'border-t border-white/5' : ''} hover:bg-white/3 transition-colors`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-[#a3e635]">
                        {(c.name ?? c.email ?? '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{c.name ?? 'Guest'}</p>
                        <p className="text-white/40 text-xs truncate">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="space-y-0.5">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors">
                          <Mail className="w-3 h-3" /> {c.email}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-white/70 text-sm">
                      <ShoppingBag className="w-3.5 h-3.5 text-white/30" />
                      {c.total_orders}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-[#a3e635] text-sm font-bold">
                      <DollarSign className="w-3.5 h-3.5 text-[#a3e635]/60" />
                      {(c.total_spent ?? 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <p className="text-white/40 text-xs">
                      {c.last_order_at
                        ? new Date(c.last_order_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

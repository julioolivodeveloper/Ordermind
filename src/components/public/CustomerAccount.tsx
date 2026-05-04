'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Clock, CheckCircle2, XCircle, ChefHat, Truck,
  LogOut, ChevronDown, ChevronUp, Star, Gift, ShoppingBag,
  ArrowRight, UtensilsCrossed, MapPin,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Restaurant { id: string; name: string; slug: string; logo_url: string | null; primary_color: string }
interface Customer { id: string; total_orders: number; total_spent: number; last_order_at: string | null }
interface Loyalty { points: number; total_spent: number }
interface LoyaltySettings { loyalty_enabled: boolean; loyalty_points_per_dollar: number; loyalty_redemption_points: number }
interface Order {
  id: string; order_number: number; status: string; order_type: string
  total: number; subtotal: number; created_at: string
  order_items: { id: string; item_name: string; quantity: number; item_price: number }[]
}

const STATUS: Record<string, { label: string; icon: React.ReactNode; tw: string }> = {
  new:       { label: 'Recibido',     icon: <Clock className="w-3.5 h-3.5" />,        tw: 'text-amber-400 bg-amber-400/15 border-amber-400/30' },
  confirmed: { label: 'Confirmado',   icon: <CheckCircle2 className="w-3.5 h-3.5" />, tw: 'text-blue-400 bg-blue-400/15 border-blue-400/30' },
  preparing: { label: 'Preparando',   icon: <ChefHat className="w-3.5 h-3.5" />,      tw: 'text-orange-400 bg-orange-400/15 border-orange-400/30' },
  ready:     { label: 'Listo',        icon: <Package className="w-3.5 h-3.5" />,       tw: 'text-green-400 bg-green-400/15 border-green-400/30' },
  on_the_way:{ label: 'En camino',    icon: <Truck className="w-3.5 h-3.5" />,         tw: 'text-purple-400 bg-purple-400/15 border-purple-400/30' },
  completed: { label: 'Entregado',    icon: <CheckCircle2 className="w-3.5 h-3.5" />, tw: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30' },
  cancelled: { label: 'Cancelado',    icon: <XCircle className="w-3.5 h-3.5" />,       tw: 'text-red-400 bg-red-400/15 border-red-400/30' },
}

const STEPS = ['new', 'confirmed', 'preparing', 'ready', 'on_the_way', 'completed']

function OrderCard({ order, color, slug }: { order: Order; color: string; slug: string }) {
  const [open, setOpen] = useState(false)
  const s = STATUS[order.status] ?? { label: order.status, icon: null, tw: 'text-white/40 bg-white/5 border-white/10' }
  const isActive = !['completed', 'cancelled'].includes(order.status)
  const stepIdx = STEPS.indexOf(order.status)

  return (
    <motion.div layout className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors">
        <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${s.tw}`}>
          {s.icon} {s.label}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Pedido #{order.order_number}</p>
          <p className="text-white/30 text-xs mt-0.5">
            {new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white font-bold text-sm">{formatCurrency(order.total)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 px-4 pb-4 pt-3 space-y-4">

              {/* Progress stepper (active orders) */}
              {isActive && stepIdx >= 0 && (
                <div className="flex items-center gap-1">
                  {STEPS.slice(0, -1).map((step, i) => {
                    const done = i <= stepIdx
                    return (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-all"
                          style={{ backgroundColor: done ? color : 'rgba(255,255,255,0.15)' }}
                        />
                        {i < STEPS.length - 2 && (
                          <div className="flex-1 h-0.5 mx-0.5 rounded-full transition-all" style={{ backgroundColor: i < stepIdx ? color : 'rgba(255,255,255,0.1)' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Items */}
              <div className="space-y-1.5">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">{item.quantity}× {item.item_name}</span>
                    <span className="text-white/40 text-sm">{formatCurrency(item.item_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-white/8">
                  <span className="text-white/40 text-sm">Total</span>
                  <span className="text-white font-bold text-sm">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {isActive && (
                <Link
                  href={`/r/${slug}/order/${order.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ backgroundColor: color + '20', color }}
                >
                  <MapPin className="w-4 h-4" /> Rastrear pedido <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function CustomerAccount({ restaurant, user, orders, customer, loyalty, loyaltySettings }: {
  restaurant: Restaurant
  user: { email: string; id: string }
  orders: Order[]
  customer: Customer | null
  loyalty: Loyalty | null
  loyaltySettings: LoyaltySettings | null
}) {
  const router = useRouter()
  const color = restaurant.primary_color || '#a3e635'
  const redeemAt = loyaltySettings?.loyalty_redemption_points ?? 100
  const points = loyalty?.points ?? 0
  const progress = Math.min((points / redeemAt) * 100, 100)
  const showLoyalty = loyaltySettings?.loyalty_enabled
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status))

  const isDark = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
  }
  const btnTextColor = isDark(color) ? '#000' : '#fff'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/r/${restaurant.slug}`)
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #161616 100%)' }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/r/${restaurant.slug}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0" style={{ backgroundColor: color, color: btnTextColor }}>
                {restaurant.name[0]}
              </div>
            )}
            <span className="text-white font-bold text-sm">{restaurant.name}</span>
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        {/* Hero profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden p-6"
          style={{ background: `linear-gradient(135deg, ${color}25 0%, ${color}08 100%)`, border: `1px solid ${color}30` }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 shadow-lg" style={{ backgroundColor: color, color: btnTextColor }}>
              {user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-base truncate">{user.email}</p>
              <p className="text-white/40 text-xs mt-0.5">Mi cuenta</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: customer?.total_orders ?? 0, label: 'Pedidos' },
              { value: formatCurrency(customer?.total_spent ?? 0), label: 'Gastado' },
              { value: showLoyalty ? points : '—', label: 'Puntos', highlight: true },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-3 text-center">
                <p className="font-black text-lg leading-none mb-1" style={stat.highlight ? { color } : { color: 'white' }}>
                  {stat.value}
                </p>
                <p className="text-white/40 text-[11px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Loyalty card */}
        {showLoyalty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                  <Star className="w-4.5 h-4.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Puntos de recompensa</p>
                  <p className="text-white/30 text-xs">{loyaltySettings?.loyalty_points_per_dollar ?? 1} pto por cada $1</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-3xl leading-none" style={{ color }}>{points}</p>
                <p className="text-white/30 text-[11px] mt-0.5">puntos</p>
              </div>
            </div>

            <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>

            {points >= redeemAt ? (
              <div className="flex items-center gap-2 text-sm font-bold mt-2" style={{ color }}>
                <Gift className="w-4 h-4" /> ¡Tienes una recompensa lista para canjear!
              </div>
            ) : (
              <p className="text-white/30 text-xs">
                {redeemAt - points} puntos más para tu próxima recompensa
              </p>
            )}
          </motion.div>
        )}

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
              <h2 className="text-white font-bold text-sm">Pedidos activos</h2>
            </div>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <OrderCard key={order.id} order={order} color={color} slug={restaurant.slug} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Past orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}>
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-white/30" /> Historial de pedidos
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/5">
              <UtensilsCrossed className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Aún no tienes pedidos</p>
              <Link
                href={`/r/${restaurant.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                style={{ backgroundColor: color, color: btnTextColor }}
              >
                Ver menú <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : pastOrders.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-6">No hay pedidos anteriores aún</p>
          ) : (
            <div className="space-y-3">
              {pastOrders.map(order => (
                <OrderCard key={order.id} order={order} color={color} slug={restaurant.slug} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

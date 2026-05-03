'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Clock, CheckCircle2, XCircle, ChefHat, Truck, LogOut, ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Restaurant { id: string; name: string; slug: string; logo_url: string | null; primary_color: string }
interface Customer { id: string; total_orders: number; total_spent: number; last_order_at: string | null }
interface Order {
  id: string; order_number: number; status: string; order_type: string
  total: number; subtotal: number; created_at: string
  order_items: { id: string; item_name: string; quantity: number; item_price: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Received', confirmed: 'Confirmed', preparing: 'Preparing',
  ready: 'Ready', on_the_way: 'On the way', completed: 'Completed', cancelled: 'Cancelled',
}
const STATUS_ICONS: Record<string, React.ReactNode> = {
  new: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle2 className="w-4 h-4" />,
  preparing: <ChefHat className="w-4 h-4" />,
  ready: <Package className="w-4 h-4" />,
  on_the_way: <Truck className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
}
const STATUS_COLORS: Record<string, string> = {
  new: 'text-amber-400 bg-amber-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  preparing: 'text-orange-400 bg-orange-400/10',
  ready: 'text-green-400 bg-green-400/10',
  on_the_way: 'text-purple-400 bg-purple-400/10',
  completed: 'text-green-500 bg-green-500/10',
  cancelled: 'text-red-400 bg-red-400/10',
}

function OrderCard({ order, color, slug }: { order: Order; color: string; slug: string }) {
  const [open, setOpen] = useState(false)
  const active = !['completed', 'cancelled'].includes(order.status)

  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors">
        <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'text-white/50 bg-white/5'}`}>
          {STATUS_ICONS[order.status]}
          {STATUS_LABELS[order.status] ?? order.status}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Order #{order.order_number}</p>
          <p className="text-white/40 text-xs">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white font-bold text-sm">{formatCurrency(order.total)}</span>
          {open ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3 space-y-3">
          <div className="space-y-1.5">
            {order.order_items.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{item.quantity}× {item.item_name}</span>
                <span className="text-white/50">{formatCurrency(item.item_price * item.quantity)}</span>
              </div>
            ))}
          </div>
          {active && (
            <Link
              href={`/r/${slug}/order/${order.id}`}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: color + '20', color }}
            >
              Track order
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export function CustomerAccount({
  restaurant, user, orders, customer,
}: {
  restaurant: Restaurant
  user: { email: string; id: string }
  orders: Order[]
  customer: Customer | null
}) {
  const router = useRouter()
  const color = restaurant.primary_color || '#a3e635'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/r/${restaurant.slug}`)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur border-b border-white/5">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-xs" style={{ backgroundColor: color }}>
                {restaurant.name[0]}
              </div>
            )}
            <Link href={`/r/${restaurant.slug}`} className="text-white font-bold text-sm hover:opacity-80 transition-opacity">
              {restaurant.name}
            </Link>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-white/30 hover:text-white text-xs transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* Profile card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-black" style={{ backgroundColor: color }}>
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold">{user.email}</p>
              <p className="text-white/40 text-xs mt-0.5">Customer</p>
            </div>
          </div>
          {customer && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-white/8">
              <div>
                <p className="text-white font-bold text-lg">{customer.total_orders}</p>
                <p className="text-white/40 text-xs">Total orders</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">{formatCurrency(customer.total_spent)}</p>
                <p className="text-white/40 text-xs">Total spent</p>
              </div>
              {customer.last_order_at && (
                <div>
                  <p className="text-white font-bold text-sm">{new Date(customer.last_order_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <p className="text-white/40 text-xs">Last order</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders */}
        <div>
          <h2 className="text-white font-bold mb-3">My orders</h2>
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No orders yet</p>
              <Link
                href={`/r/${restaurant.slug}`}
                className="mt-4 inline-block text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                style={{ backgroundColor: color, color: '#000' }}
              >
                Browse menu
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} color={color} slug={restaurant.slug} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2, Clock, ChefHat, Truck, PartyPopper } from 'lucide-react'

const STEPS = [
  { key: 'new',        label: 'Pedido recibido',  icon: CheckCircle2, desc: 'Tu pedido fue recibido' },
  { key: 'confirmed',  label: 'Confirmado',        icon: CheckCircle2, desc: 'El restaurante confirmó tu pedido' },
  { key: 'preparing',  label: 'En preparación',    icon: ChefHat,      desc: 'Están preparando tu pedido' },
  { key: 'ready',      label: 'Listo',             icon: CheckCircle2, desc: 'Tu pedido está listo' },
  { key: 'on_the_way', label: 'En camino',         icon: Truck,        desc: 'Tu pedido va en camino' },
  { key: 'completed',  label: 'Entregado',         icon: PartyPopper,  desc: '¡Pedido entregado!' },
]
const STATUS_ORDER = ['new', 'confirmed', 'preparing', 'ready', 'on_the_way', 'completed']

interface Restaurant { name: string; primary_color: string; slug: string; phone?: string; whatsapp?: string }
interface OrderItem { id: string; item_name: string; quantity: number; subtotal: number; modifications: any[]; notes?: string }
interface Order {
  id: string; order_number: number; status: string; order_type: string
  customer_name: string; total: number; tax_amount: number; delivery_fee: number
  discount_amount: number; subtotal: number; notes?: string
  restaurant: Restaurant; order_items: OrderItem[]
}

export function OrderTracker({ order: initialOrder, isNew }: { order: Order; isNew?: boolean }) {
  const [order, setOrder] = useState(initialOrder)
  const [notifAsked, setNotifAsked] = useState(false)
  const restaurant = order.restaurant
  const primary = restaurant.primary_color ?? '#f97316'
  const currentIdx = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const isCompleted = order.status === 'completed'

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`order-tracker:${order.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload) => {
          const updated = payload.new as any
          setOrder(prev => ({ ...prev, ...updated }))
          // Browser notification
          if (Notification.permission === 'granted') {
            const step = STEPS.find(s => s.key === updated.status)
            if (step) new Notification(`${restaurant.name}`, { body: step.desc, icon: '/favicon.ico' })
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [order.id])

  async function requestNotifications() {
    setNotifAsked(true)
    await Notification.requestPermission()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="text-white px-4 py-5" style={{ backgroundColor: primary }}>
        <div className="max-w-lg mx-auto">
          <p className="text-white/70 text-sm">{restaurant.name}</p>
          <h1 className="font-black text-2xl mt-0.5">Pedido #{order.order_number}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Notification prompt */}
        {!notifAsked && typeof Notification !== 'undefined' && Notification.permission === 'default' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-lg" style={{ backgroundColor: primary }}>🔔</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Recibe notificaciones</p>
              <p className="text-xs text-slate-500">Te avisamos cuando tu pedido esté listo</p>
            </div>
            <button onClick={requestNotifications} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-all hover:brightness-110" style={{ backgroundColor: primary }}>
              Activar
            </button>
          </motion.div>
        )}

        {/* Success animation on new order */}
        <AnimatePresence>
          {isNew && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: primary }}
              >
                ✓
              </motion.div>
              <h2 className="font-black text-slate-800 text-xl">¡Pedido recibido!</h2>
              <p className="text-slate-500 text-sm mt-1">Tu pedido está siendo procesado</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status tracker */}
        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-4xl mb-2">❌</p>
            <p className="font-bold text-red-700 text-lg">Pedido cancelado</p>
            <p className="text-red-600 text-sm mt-1">Contacta al restaurante para más información</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Estado del pedido</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                En vivo
              </div>
            </div>
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const done = i <= currentIdx
                const current = i === currentIdx
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.key}
                    animate={current ? { x: [0, 4, 0] } : {}}
                    transition={{ repeat: current ? Infinity : 0, duration: 2, ease: 'easeInOut' }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? 'text-white' : 'bg-slate-100 text-slate-300'} ${current ? 'ring-4 ring-offset-1' : ''}`}
                      style={done ? { backgroundColor: primary, '--tw-ring-color': primary + '40' } as any : {}}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold transition-colors ${done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                      {current && <p className="text-xs mt-0.5 font-medium" style={{ color: primary }}>{step.desc}</p>}
                    </div>
                    {current && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Ahora</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Tu pedido</h2>
          <div className="space-y-2">
            {order.order_items?.map(item => (
              <div key={item.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">{item.quantity}× {item.item_name}</span>
                  <span className="text-slate-800 font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
                {item.modifications?.map((m: any, i: number) => (
                  <p key={i} className={`text-xs pl-3 ${m.type === 'remove' ? 'text-red-500' : 'text-green-600'}`}>
                    {m.type === 'remove' ? '✗ Sin ' : '+ '}{m.name}
                  </p>
                ))}
                {item.notes && <p className="text-xs text-slate-400 italic pl-3">"{item.notes}"</p>}
              </div>
            ))}
            <div className="border-t border-slate-100 pt-2 mt-2 space-y-1 text-sm">
              {order.tax_amount > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>{formatCurrency(order.tax_amount)}</span></div>}
              {order.delivery_fee > 0 && <div className="flex justify-between text-slate-500"><span>Delivery</span><span>{formatCurrency(order.delivery_fee)}</span></div>}
              {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>-{formatCurrency(order.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-slate-800 text-base pt-1"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>
        </div>

        {/* Contact */}
        {(restaurant.phone || restaurant.whatsapp) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3">¿Necesitas ayuda?</h3>
            <div className="flex gap-3">
              {restaurant.whatsapp && (
                <a href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, '')}`} target="_blank"
                  className="flex-1 border border-green-200 text-green-700 bg-green-50 text-sm font-medium py-2.5 rounded-xl text-center hover:bg-green-100 transition-colors">
                  WhatsApp
                </a>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`}
                  className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl text-center hover:bg-slate-50 transition-colors">
                  Call
                </a>
              )}
            </div>
          </div>
        )}

        <Link href={`/r/${restaurant.slug}`}
          className="block text-center text-sm font-medium hover:underline py-2" style={{ color: primary }}>
          ← Back to menu
        </Link>
      </div>
    </div>
  )
}

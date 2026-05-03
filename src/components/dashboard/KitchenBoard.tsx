'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, CheckCircle2, Volume2, VolumeX } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'on_the_way', on_the_way: 'completed',
}
const nextLabel: Partial<Record<OrderStatus, string>> = {
  new: 'Aceptar', confirmed: 'Iniciar', preparing: '¡Listo!', ready: 'En camino', on_the_way: 'Entregado',
}
const colColor: Partial<Record<OrderStatus, string>> = {
  new: 'border-t-amber-400', confirmed: 'border-t-blue-400', preparing: 'border-t-orange-400', ready: 'border-t-green-400',
}
const colBg: Partial<Record<OrderStatus, string>> = {
  new: 'bg-amber-400', confirmed: 'bg-blue-400', preparing: 'bg-orange-400', ready: 'bg-green-400',
}
const typeLabel: Record<string, string> = { pickup: 'Recoger', delivery: 'Delivery', dine_in: 'Mesa' }
const ACTIVE: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready']

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

function elapsed(created: string) {
  const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000)
  return mins < 1 ? 'Ahora' : `${mins}m`
}

export function KitchenBoard({ initialOrders, restaurantId }: { initialOrders: Order[]; restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [updating, setUpdating] = useState<string | null>(null)
  const [sound, setSound] = useState(true)
  const soundRef = useRef(sound)
  soundRef.current = sound

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`kitchen:${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', payload.new.id).single()
            if (data) {
              setOrders(prev => [data as Order, ...prev])
              if (soundRef.current) beep()
              if (Notification.permission === 'granted') {
                new Notification(`🆕 Nuevo pedido #${data.order_number}`, { body: `${data.customer_name} · ${typeLabel[data.order_type]}`, silent: true })
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
          }
        })
      .subscribe()

    if (Notification.permission === 'default') Notification.requestPermission()
    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  async function advance(order: Order) {
    const next = nextStatus[order.status]
    if (!next) return
    setUpdating(order.id)
    await fetch(`/api/dashboard/orders/${order.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }),
    })
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o))
    setUpdating(null)
  }

  const active = orders.filter(o => ACTIVE.includes(o.status))
  const counts: Partial<Record<OrderStatus, number>> = {}
  ACTIVE.forEach(s => { counts[s] = active.filter(o => o.status === s).length })

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-[#a3e635]" />
          <span className="text-white font-bold text-lg">Cocina</span>
          <span className="bg-[#a3e635]/20 text-[#a3e635] text-xs font-bold px-2 py-0.5 rounded-full">{active.length} activos</span>
        </div>
        <div className="flex items-center gap-4">
          {ACTIVE.map(s => counts[s]! > 0 && (
            <span key={s} className={`text-xs font-bold px-2 py-1 rounded-lg text-white ${colBg[s]}`}>
              {counts[s]} {s === 'new' ? 'nuevos' : s === 'confirmed' ? 'conf.' : s === 'preparing' ? 'prep.' : 'listos'}
            </span>
          ))}
          <button onClick={() => setSound(s => !s)} className={`p-2 rounded-xl transition-colors ${sound ? 'text-[#a3e635]' : 'text-white/20'}`}>
            {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Cards */}
      {active.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/20">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Sin pedidos activos</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {active.map(order => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white/5 border-t-4 border border-white/8 rounded-2xl overflow-hidden flex flex-col ${colColor[order.status]}`}
                >
                  {/* Card header */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                    <div>
                      <p className="text-white font-black text-2xl">#{order.order_number}</p>
                      <p className="text-white/60 text-sm mt-0.5">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${colBg[order.status]}`}>
                        {order.status === 'new' ? 'Nuevo' : order.status === 'confirmed' ? 'Confirmado' : order.status === 'preparing' ? 'Preparando' : 'Listo'}
                      </span>
                      <div className="flex items-center gap-1 mt-1.5 justify-end text-white/40 text-xs">
                        <Clock className="w-3 h-3" />
                        {elapsed(order.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-4 pb-3 flex-1">
                    <div className="space-y-2">
                      {(order.order_items as any)?.map((item: any) => (
                        <div key={item.id}>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[#a3e635] font-black text-lg leading-none w-7 shrink-0">{item.quantity}×</span>
                            <span className="text-white font-semibold text-sm leading-snug">{item.item_name}</span>
                          </div>
                          {item.modifications?.filter((m: any) => m.type === 'remove').map((m: any, i: number) => (
                            <p key={i} className="text-red-400 text-xs pl-9">✗ Sin {m.name}</p>
                          ))}
                          {item.modifications?.filter((m: any) => m.type === 'add').map((m: any, i: number) => (
                            <p key={i} className="text-green-400 text-xs pl-9">+ {m.name}</p>
                          ))}
                          {item.notes && <p className="text-white/40 text-xs pl-9 italic">"{item.notes}"</p>}
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="mt-3 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
                        <p className="text-amber-300 text-xs">📝 {order.notes}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/8 text-xs text-white/40">
                      <span>{typeLabel[order.order_type]}</span>
                      <span className="ml-auto font-bold text-white/60">{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  {nextStatus[order.status] && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => advance(order)}
                        disabled={updating === order.id}
                        className={`w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50 text-white ${colBg[order.status]} hover:brightness-110 active:scale-95`}
                      >
                        {updating === order.id ? '...' : nextLabel[order.status]}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

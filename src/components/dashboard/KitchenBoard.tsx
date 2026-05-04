'use client'
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, CheckCircle2, Volume2, VolumeX, Printer, PrinterCheck, AlertTriangle, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { printTicket } from '@/lib/print'
import { useKitchenOrders } from '@/hooks/useKitchenOrders'
import type { Order, OrderStatus } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

function elapsed(created: string) {
  const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins === 1) return '1 min'
  return `${mins} min`
}

function elapsedColor(created: string): string {
  const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000)
  if (mins >= 15) return 'text-red-400'
  if (mins >= 8) return 'text-amber-400'
  return 'text-white/40'
}

// ── Config ─────────────────────────────────────────────────────────────────────

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  new: 'Accept', confirmed: 'Start prep', preparing: 'Mark ready', ready: 'Complete',
}
const COL_BORDER: Partial<Record<OrderStatus, string>> = {
  new: 'border-t-red-400', confirmed: 'border-t-blue-400',
  preparing: 'border-t-amber-400', ready: 'border-t-green-400',
}
const COL_BG: Partial<Record<OrderStatus, string>> = {
  new: 'bg-red-500', confirmed: 'bg-blue-500',
  preparing: 'bg-amber-500', ready: 'bg-green-500',
}
const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  new: 'NEW', confirmed: 'CONFIRMED', preparing: 'PREPARING', ready: 'READY',
}
const TYPE_LABEL: Record<string, string> = { pickup: 'Pickup', delivery: 'Delivery', dine_in: 'Dine in' }

// ── OrderCard ──────────────────────────────────────────────────────────────────

function OrderCard({
  order, updating, onAdvance, onCancel, onPrint,
}: {
  order: Order
  updating: boolean
  onAdvance: () => void
  onCancel: () => void
  onPrint: () => void
}) {
  const items = (order.order_items as any[]) ?? []

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`bg-[#111] border border-white/8 border-t-4 rounded-2xl flex flex-col overflow-hidden ${COL_BORDER[order.status]}`}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-white font-black text-3xl leading-none">#{order.order_number}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${COL_BG[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="text-white/70 text-sm mt-1 font-medium">{order.customer_name}</p>
          {order.customer_phone && <p className="text-white/30 text-xs">{order.customer_phone}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-bold ${elapsedColor(order.created_at)}`}>
            <Clock className="w-3 h-3" />
            {elapsed(order.created_at)}
          </span>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {TYPE_LABEL[order.order_type]}
          </span>
        </div>
      </div>

      {/* Delivery address */}
      {order.order_type === 'delivery' && order.delivery_address && (
        <div className="px-4 pb-2">
          <p className="text-xs text-white/40 bg-white/5 px-2 py-1.5 rounded-lg">
            📍 {(order.delivery_address as any).street ?? JSON.stringify(order.delivery_address)}
          </p>
        </div>
      )}

      {/* Items */}
      <div className="px-4 pb-3 flex-1 space-y-2">
        {items.map((item: any) => (
          <div key={item.id}>
            <div className="flex items-baseline gap-2">
              <span className="text-[#a3e635] font-black text-xl w-7 shrink-0 leading-none">{item.quantity}×</span>
              <span className="text-white font-semibold text-sm leading-snug">{item.item_name}</span>
            </div>
            {((item.modifications as any[]) ?? []).filter((m: any) => m.type === 'remove').map((m: any, i: number) => (
              <p key={i} className="text-red-400 text-xs pl-9">✗ No {m.name}</p>
            ))}
            {((item.modifications as any[]) ?? []).filter((m: any) => m.type === 'add').map((m: any, i: number) => (
              <p key={i} className="text-green-400 text-xs pl-9">+ {m.name}</p>
            ))}
            {item.notes && <p className="text-amber-300/70 text-xs pl-9 italic">"{item.notes}"</p>}
          </div>
        ))}

        {order.notes && (
          <div className="mt-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
            <p className="text-amber-300 text-xs">📝 {order.notes}</p>
          </div>
        )}

        <div className="flex items-center pt-2 border-t border-white/8 text-xs text-white/40">
          <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
          <span className="ml-auto font-bold text-white/60">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        {NEXT_LABEL[order.status] && (
          <button
            onClick={onAdvance}
            disabled={updating}
            className={`flex-1 py-2.5 rounded-xl font-black text-sm text-white transition-all disabled:opacity-50 hover:brightness-110 active:scale-95 ${COL_BG[order.status]}`}
          >
            {updating ? '…' : NEXT_LABEL[order.status]}
          </button>
        )}
        <button
          onClick={onPrint}
          title="Print ticket"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <Printer className="w-4 h-4" />
        </button>
        <button
          onClick={onCancel}
          disabled={updating}
          title="Cancel order"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ── KitchenBoard ───────────────────────────────────────────────────────────────

export function KitchenBoard({
  initialOrders, restaurantId, restaurantName,
}: {
  initialOrders: Order[]
  restaurantId: string
  restaurantName?: string
}) {
  const [sound, setSound] = useState(true)
  const [autoPrint, setAutoPrint] = useState(false)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const soundRef = useRef(sound)
  const autoPrintRef = useRef(autoPrint)
  soundRef.current = sound
  autoPrintRef.current = autoPrint

  const handleNewOrder = useCallback((order: Order) => {
    if (soundRef.current) beep()

    if (Notification.permission === 'granted') {
      new Notification(`New order #${order.order_number}`, {
        body: `${order.customer_name} · ${TYPE_LABEL[order.order_type]}`,
        silent: true,
      })
    }

    if (autoPrintRef.current) {
      const ok = printTicket(order, restaurantName ?? 'Restaurant')
      if (!ok) setPopupBlocked(true)
    }
  }, [restaurantName])

  const { orders, updating, advanceStatus, cancelOrder, countsByStatus } = useKitchenOrders({
    initialOrders,
    restaurantId,
    onNewOrder: handleNewOrder,
  })

  function handleManualPrint(order: Order) {
    const ok = printTicket(order, restaurantName ?? 'Restaurant')
    if (!ok) setPopupBlocked(true)
  }

  const ACTIVE_STATUSES: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready']

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-[#a3e635]" />
          <span className="text-white font-bold text-lg">Kitchen Display</span>
          <span className="bg-[#a3e635]/20 text-[#a3e635] text-xs font-bold px-2.5 py-0.5 rounded-full">
            {orders.length} active
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status counts */}
          {ACTIVE_STATUSES.map(s => (countsByStatus[s] ?? 0) > 0 && (
            <span key={s} className={`text-xs font-bold px-2.5 py-1 rounded-lg text-white ${COL_BG[s]}`}>
              {countsByStatus[s]} {STATUS_LABEL[s]}
            </span>
          ))}

          {/* Auto-print toggle */}
          <button
            onClick={() => setAutoPrint(v => !v)}
            title={autoPrint ? 'Disable auto-print' : 'Enable auto-print'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              autoPrint
                ? 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#a3e635]'
                : 'bg-white/5 border-white/10 text-white/30 hover:text-white/60'
            }`}
          >
            {autoPrint ? <PrinterCheck className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
            Auto-print {autoPrint ? 'ON' : 'OFF'}
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => setSound(v => !v)}
            title={sound ? 'Mute' : 'Unmute'}
            className={`p-2 rounded-xl transition-colors ${sound ? 'text-[#a3e635]' : 'text-white/20 hover:text-white/40'}`}
          >
            {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Popup blocked warning */}
      <AnimatePresence>
        {popupBlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Popup blocked — allow popups in your browser to enable automatic printing.</span>
              <button onClick={() => setPopupBlocked(false)} className="ml-auto text-amber-300/50 hover:text-amber-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders grid */}
      {orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white/20">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">No active orders</p>
            <p className="text-sm mt-1">New orders will appear here in real time</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  updating={updating === order.id}
                  onAdvance={() => advanceStatus(order)}
                  onCancel={() => { if (confirm(`Cancel order #${order.order_number}?`)) cancelOrder(order.id) }}
                  onPrint={() => handleManualPrint(order)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

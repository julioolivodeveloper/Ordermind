'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { printReceipt } from '@/lib/printReceipt'

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  } catch {}
}
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import type { Order, OrderStatus } from '@/types'

const statusLabel: Record<OrderStatus, string> = {
  new: 'Nuevo', confirmed: 'Confirmado', preparing: 'Preparando',
  ready: 'Listo', on_the_way: 'En camino', completed: 'Completado', cancelled: 'Cancelado',
}
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'confirmed', confirmed: 'preparing', preparing: 'ready',
  ready: 'on_the_way', on_the_way: 'completed',
}
const nextLabel: Partial<Record<OrderStatus, string>> = {
  new: 'Confirmar', confirmed: 'Iniciar prep.', preparing: 'Marcar listo',
  ready: 'En camino', on_the_way: 'Completar',
}
const typeLabel: Record<string, string> = {
  pickup: '🏪 Recoger', delivery: '🚚 Delivery', dine_in: '🍽️ En mesa',
}
const payLabel: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', stripe: 'Online', paypal: 'PayPal',
}

const COLUMNS: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready', 'on_the_way']

interface Props {
  initialOrders: Order[]
  restaurantId: string
  restaurantName?: string
  restaurantAddress?: string | null
  restaurantPhone?: string | null
  squareTerminalDeviceId?: string | null
}

export function OrdersBoard({ initialOrders, restaurantId, restaurantName = '', restaurantAddress, restaurantPhone, squareTerminalDeviceId }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [terminalStatus, setTerminalStatus] = useState<Record<string, 'pending' | 'completed' | 'error'>>({})
  const { toast } = useToast()
  const ordersRef = useRef(orders)
  ordersRef.current = orders

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission()

    const supabase = createClient()
    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('orders').select('*, order_items(*)').eq('id', payload.new.id).single()
          if (data) {
            setOrders(prev => [data as Order, ...prev])
            toast(`New order #${data.order_number}`, 'info')
            beep()
            if (Notification.permission === 'granted') {
              new Notification(`🆕 New order #${data.order_number}`, {
                body: `${data.customer_name} · $${data.total?.toFixed(2)}`,
                icon: '/favicon.ico',
              })
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  async function handleAdvance(order: Order) {
    const next = nextStatus[order.status]
    if (!next) return
    setUpdating(order.id)
    try {
      const res = await fetch(`/api/dashboard/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error()
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o))
    } catch {
      toast('Error al actualizar pedido', 'error')
    } finally {
      setUpdating(null)
    }
  }

  async function handleCancel(order: Order) {
    if (!confirm('¿Cancelar este pedido?')) return
    setUpdating(order.id)
    try {
      await fetch(`/api/dashboard/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o))
    } catch {
      toast('Error al cancelar', 'error')
    } finally {
      setUpdating(null)
    }
  }

  function handlePrint(order: Order) {
    printReceipt(order as any, {
      name: restaurantName,
      address: restaurantAddress,
      phone: restaurantPhone,
    })
  }

  async function handleTerminalCharge(order: Order) {
    if (!squareTerminalDeviceId) return
    setTerminalStatus(s => ({ ...s, [order.id]: 'pending' }))
    try {
      const res = await fetch('/api/square/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          amountCents: Math.round((order.total ?? 0) * 100),
          deviceId: squareTerminalDeviceId,
          note: `Orden #${order.order_number} — ${order.customer_name}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar a terminal')
      toast(`Terminal activa — cobra $${order.total?.toFixed(2)} en el dispositivo`, 'info')

      // Poll status every 3s until completed or failed
      const checkoutId = data.checkout_id
      const poll = setInterval(async () => {
        const r = await fetch(`/api/square/terminal/${checkoutId}`)
        const d = await r.json()
        if (d.status === 'COMPLETED') {
          clearInterval(poll)
          setTerminalStatus(s => ({ ...s, [order.id]: 'completed' }))
          toast(`Pago completado en terminal — Orden #${order.order_number}`, 'success' as any)
        } else if (['CANCELED', 'CANCEL_REQUESTED'].includes(d.status)) {
          clearInterval(poll)
          setTerminalStatus(s => ({ ...s, [order.id]: 'error' }))
          toast('Pago cancelado en terminal', 'error')
        }
      }, 3000)
      // Stop polling after 3 minutes
      setTimeout(() => clearInterval(poll), 180000)
    } catch (e: any) {
      setTerminalStatus(s => ({ ...s, [order.id]: 'error' }))
      toast(e.message, 'error')
    }
  }

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
  const doneOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status))

  return (
    <div className="space-y-6">
      {/* Active - Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col)
          return (
            <div key={col} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">{statusLabel[col]}</span>
                {colOrders.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {colOrders.length}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-3 min-h-[120px]">
                {colOrders.map(order => (
                  <div
                    key={order.id}
                    className={`bg-slate-50 rounded-xl border border-slate-100 p-3 cursor-pointer hover:border-indigo-200 transition-all ${col === 'new' ? 'border-l-4 border-l-indigo-500' : ''}`}
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">#{order.order_number}</span>
                      <span className="text-xs text-slate-400">{timeAgo(order.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium truncate">{order.customer_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">{typeLabel[order.order_type]}</span>
                      <span className="text-xs font-semibold text-slate-700 ml-auto">{formatCurrency(order.total)}</span>
                    </div>

                    {/* Expanded */}
                    {expanded === order.id && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 animate-fade-in">
                        {(order.order_items as any)?.map((item: any) => (
                          <div key={item.id} className="text-xs">
                            <div className="flex justify-between font-medium text-slate-700">
                              <span>{item.quantity}x {item.item_name}</span>
                              <span>{formatCurrency(item.subtotal)}</span>
                            </div>
                            {item.modifications?.length > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {item.modifications.map((m: any, i: number) => (
                                  <li key={i} className={`text-xs pl-2 ${m.type === 'remove' ? 'text-red-600' : 'text-green-700'}`}>
                                    {m.type === 'remove' ? '✗ Sin ' : '+ Extra '}{m.name}
                                    {m.extra_cost > 0 && ` (+${formatCurrency(m.extra_cost)})`}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {item.notes && <p className="text-slate-400 italic pl-2">"{item.notes}"</p>}
                          </div>
                        ))}
                        {order.notes && (
                          <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2">Nota: {order.notes}</p>
                        )}
                        <p className="text-xs text-slate-500">Pago: {payLabel[order.payment_method]}</p>
                        {order.customer_phone && <p className="text-xs text-slate-500">Tel: {order.customer_phone}</p>}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {nextStatus[order.status] && (
                            <button
                              onClick={e => { e.stopPropagation(); handleAdvance(order) }}
                              disabled={updating === order.id}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {updating === order.id ? '...' : nextLabel[order.status]}
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handlePrint(order) }}
                            className="text-slate-600 hover:text-slate-800 text-xs px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Imprimir recibo"
                          >
                            🖨️
                          </button>
                          {!['completed', 'cancelled', 'on_the_way'].includes(order.status) && (
                            <button
                              onClick={e => { e.stopPropagation(); handleCancel(order) }}
                              className="text-red-500 hover:text-red-700 text-xs px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                        {squareTerminalDeviceId && !['completed', 'cancelled'].includes(order.status) && order.payment_status !== 'paid' && (
                          <button
                            onClick={e => { e.stopPropagation(); handleTerminalCharge(order) }}
                            disabled={terminalStatus[order.id] === 'pending'}
                            className="w-full mt-2 bg-black hover:bg-slate-800 text-white text-xs py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {terminalStatus[order.id] === 'pending' ? (
                              <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Esperando terminal...</>
                            ) : terminalStatus[order.id] === 'completed' ? (
                              '✓ Cobrado en terminal'
                            ) : (
                              <>⬛ Cobrar en terminal Square</>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <p className="text-xs text-slate-300 text-center py-4">Sin pedidos</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Completed / Cancelled */}
      {doneOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-600 text-sm">Historial de hoy ({doneOrders.length})</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {doneOrders.slice(0, 20).map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700 text-sm">#{order.order_number}</span>
                  <span className="text-sm text-slate-600">{order.customer_name}</span>
                  <Badge status={order.status} label={statusLabel[order.status]} size="sm" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">{formatCurrency(order.total)}</span>
                  <span className="text-xs text-slate-400">{timeAgo(order.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

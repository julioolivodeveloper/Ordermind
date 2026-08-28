'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Order, type OrderStatus } from '@/store/acatortas-store'

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {}
}

export function useAcaTortasOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const knownIds = useRef<Set<string>>(new Set())

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/acatortas/orders')
    if (!res.ok) return
    const data: Order[] = await res.json()
    setOrders(data)
    setLoading(false)
    data.forEach((o) => knownIds.current.add(o.id))
  }, [])

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/acatortas/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) return
    const updated: Order = await res.json()
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
  }, [])

  useEffect(() => {
    fetchOrders()

    // Supabase Realtime — nuevas órdenes en tiempo real
    const supabase = createClient()
    const channel = supabase
      .channel('acatortas-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'acatortas_orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order
            if (!knownIds.current.has(newOrder.id)) {
              knownIds.current.add(newOrder.id)
              setOrders((prev) => [newOrder, ...prev])
              playBeep()
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  return { orders, loading, updateStatus, refetch: fetchOrders }
}

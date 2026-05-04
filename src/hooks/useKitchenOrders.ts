import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus } from '@/types'

const ACTIVE_STATUSES: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready']

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
}

interface UseKitchenOrdersOptions {
  initialOrders: Order[]
  restaurantId: string
  onNewOrder?: (order: Order) => void
}

export function useKitchenOrders({ initialOrders, restaurantId, onNewOrder }: UseKitchenOrdersOptions) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [updating, setUpdating] = useState<string | null>(null)
  const onNewOrderRef = useRef(onNewOrder)
  onNewOrderRef.current = onNewOrder

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`kitchen-orders:${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              const order = data as Order
              setOrders(prev => [order, ...prev])
              onNewOrderRef.current?.(order)
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(o => o.id === payload.new.id ? { ...o, ...(payload.new as Partial<Order>) } : o)
            )
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  const advanceStatus = useCallback(async (order: Order) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return

    setUpdating(order.id)
    try {
      await fetch(`/api/dashboard/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      setOrders(prev =>
        next === 'completed'
          ? prev.filter(o => o.id !== order.id)
          : prev.map(o => o.id === order.id ? { ...o, status: next } : o)
      )
    } finally {
      setUpdating(null)
    }
  }, [])

  const cancelOrder = useCallback(async (orderId: string) => {
    setUpdating(orderId)
    try {
      await fetch(`/api/dashboard/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } finally {
      setUpdating(null)
    }
  }, [])

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status))

  const countsByStatus = ACTIVE_STATUSES.reduce((acc, s) => {
    acc[s] = activeOrders.filter(o => o.status === s).length
    return acc
  }, {} as Record<OrderStatus, number>)

  return { orders: activeOrders, updating, advanceStatus, cancelOrder, countsByStatus, NEXT_STATUS }
}

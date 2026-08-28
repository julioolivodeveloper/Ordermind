'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MenuItem, DEFAULT_MENU } from '@/data/acatortas-menu'

export type CartItem = {
  item: MenuItem
  quantity: number
}

export type OrderStatus = 'nuevo' | 'preparando' | 'listo' | 'entregado' | 'cancelado'

export type Order = {
  id: string
  order_number: number
  items: CartItem[]
  customer_name: string
  customer_phone: string
  notes: string
  status: OrderStatus
  total: number
  created_at: string
  customer_id?: string
  points_earned: number
}

export type Customer = {
  id: string
  name: string
  phone: string
  points: number
  created_at: string
  order_count: number
}

type Store = {
  // Menu (local + overrides desde Supabase)
  menu: MenuItem[]
  setMenu: (menu: MenuItem[]) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void

  // Cart — persiste en localStorage del cliente, correcto
  cart: CartItem[]
  addToCart: (item: MenuItem) => void
  removeFromCart: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void

  // Última orden confirmada (para la pantalla de confirmación)
  lastOrder: Order | null
  setLastOrder: (order: Order | null) => void
}

export const useAcaTortasStore = create<Store>()(
  persist(
    (set) => ({
      // Menu
      menu: DEFAULT_MENU,
      setMenu: (menu) => set({ menu }),
      updateMenuItem: (id, updates) =>
        set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),

      // Cart
      cart: [],
      addToCart: (item) =>
        set((s) => {
          const existing = s.cart.find((c) => c.item.id === item.id)
          if (existing) {
            return { cart: s.cart.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c) }
          }
          return { cart: [...s.cart, { item, quantity: 1 }] }
        }),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((c) => c.item.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          cart: qty <= 0
            ? s.cart.filter((c) => c.item.id !== id)
            : s.cart.map((c) => c.item.id === id ? { ...c, quantity: qty } : c),
        })),
      clearCart: () => set({ cart: [] }),

      // Última orden
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
    }),
    {
      name: 'acatortas-cart',
      // Solo persiste el carrito y la última orden — no el menú (se carga desde Supabase)
      partialize: (s) => ({ cart: s.cart, lastOrder: s.lastOrder }),
    }
  )
)

// Helpers
export const cartTotal = (cart: CartItem[]) =>
  cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0)

export const cartCount = (cart: CartItem[]) =>
  cart.reduce((sum, c) => sum + c.quantity, 0)

export const STATUS_LABELS: Record<OrderStatus, string> = {
  nuevo: 'Nuevo',
  preparando: 'En Preparación',
  listo: 'Listo para Recoger',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  nuevo: '#F59E0B',
  preparando: '#3B82F6',
  listo: '#16A34A',
  entregado: '#6B7280',
  cancelado: '#EF4444',
}

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  nuevo: 'preparando',
  preparando: 'listo',
  listo: 'entregado',
}

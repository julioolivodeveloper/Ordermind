import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  restaurantSlug: string | null
  items: CartItem[]
  isOpen: boolean

  setRestaurant: (slug: string) => void
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  subtotal: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      restaurantSlug: null,
      items: [],
      isOpen: false,

      setRestaurant: (slug) => {
        if (get().restaurantSlug !== slug) {
          set({ restaurantSlug: slug, items: [] })
        }
      },

      addItem: (item) => {
        const items = get().items
        const existing = items.findIndex(i =>
          i.menu_item_id === item.menu_item_id &&
          JSON.stringify(i.modifications) === JSON.stringify(item.modifications) &&
          JSON.stringify(i.selected_options) === JSON.stringify(item.selected_options)
        )
        if (existing >= 0) {
          const updated = [...items]
          updated[existing] = {
            ...updated[existing],
            quantity: updated[existing].quantity + item.quantity,
            subtotal: (updated[existing].quantity + item.quantity) * updated[existing].item_price,
          }
          set({ items: updated })
        } else {
          set({ items: [...items, item] })
        }
      },

      removeItem: (index) =>
        set({ items: get().items.filter((_, i) => i !== index) }),

      updateQuantity: (index, quantity) => {
        if (quantity <= 0) {
          get().removeItem(index)
        } else {
          set({
            items: get().items.map((item, i) =>
              i === index ? { ...item, quantity, subtotal: quantity * item.item_price } : item
            ),
          })
        }
      },

      clearCart: () => set({ items: [], restaurantSlug: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      subtotal: () => get().items.reduce((s, i) => s + i.subtotal, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'ordermind-cart' }
  )
)

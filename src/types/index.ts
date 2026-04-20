export type MenuCategory = 'tortas' | 'tacos' | 'hamburguesas' | 'burritos'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: MenuCategory
  image: string
  available: boolean
  popular: boolean
  spicy: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export type MenuItemInput = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>

export interface CartItem extends MenuItem {
  quantity: number
  notes?: string
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  customer_name: string
  customer_email: string
  customer_phone: string
  payment_intent_id?: string
  created_at: string
  updated_at: string
  notes?: string
}

export interface Category {
  id: string
  label: string
  emoji: string
  value: MenuCategory | 'all'
}

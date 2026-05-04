export type UserRole = 'super_admin' | 'restaurant_owner' | 'staff' | 'customer'
export type RestaurantStatus = 'active' | 'demo' | 'suspended' | 'pending'
export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'completed' | 'cancelled'
export type OrderType = 'pickup' | 'delivery' | 'dine_in'
export type PaymentMethod = 'cash' | 'card' | 'stripe' | 'paypal'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'
export type Locale = 'es' | 'en'

export interface Plan {
  id: string
  name: string
  slug: string
  price: number
  max_menu_items: number
  max_staff: number
  features: Record<string, unknown>
  is_active: boolean
  created_at: string
}

export interface Restaurant {
  id: string
  slug: string
  name: string
  description?: string
  logo_url?: string
  cover_url?: string
  status: RestaurantStatus
  is_demo: boolean
  plan_id?: string
  owner_id?: string
  primary_color: string
  secondary_color: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country: string
  website?: string
  instagram?: string
  facebook?: string
  whatsapp?: string
  timezone: string
  language: string
  currency: string
  pickup_enabled: boolean
  delivery_enabled: boolean
  dine_in_enabled: boolean
  delivery_fee: number
  min_order_amount: number
  tax_rate: number
  tax_name: string
  business_hours: Record<string, unknown>
  custom_domain?: string
  delivery_zip_codes?: string[]
  loyalty_enabled?: boolean
  loyalty_points_per_dollar?: number
  loyalty_redemption_points?: number
  stripe_publishable_key?: string
  stripe_connected?: boolean
  notes?: string
  created_at: string
  updated_at: string
  plan?: Plan
  owner?: Profile
}

export interface Profile {
  id: string
  role: UserRole
  restaurant_id?: string
  full_name?: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  restaurant?: Restaurant
  email?: string
}

export interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  slug: string
  description?: string
  icon?: string
  sort_order: number
  is_active: boolean
  created_at: string
  menu_items?: MenuItem[]
}

export interface ItemIngredient {
  id: string
  menu_item_id: string
  name: string
  is_default: boolean
  extra_cost: number
  sort_order: number
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id?: string
  name: string
  name_en?: string
  description?: string
  description_en?: string
  price: number
  discount_percent?: number
  image_url?: string
  model_url?: string
  model_usdz_url?: string
  model_scale_cm?: number
  is_available: boolean
  is_popular: boolean
  is_spicy: boolean
  sort_order: number
  created_at: string
  updated_at: string
  category?: MenuCategory
  ingredients?: ItemIngredient[]
}

export interface Modification {
  ingredient_id: string
  name: string
  type: 'remove' | 'add'
  extra_cost: number
}

export interface CartItem {
  menu_item_id: string
  item_name: string
  item_price: number
  image_url?: string
  quantity: number
  modifications: Modification[]
  notes?: string
  subtotal: number
}

export interface DeliveryAddress {
  street: string
  city: string
  state?: string
  zip?: string
  references?: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id?: string
  item_name: string
  item_price: number
  quantity: number
  modifications: Modification[]
  notes?: string
  subtotal: number
}

export interface Order {
  id: string
  restaurant_id: string
  order_number: number
  status: OrderStatus
  order_type: OrderType
  customer_name: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: DeliveryAddress
  subtotal: number
  tax_amount: number
  delivery_fee: number
  discount_amount: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  payment_intent_id?: string
  notes?: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface Promotion {
  id: string
  restaurant_id: string
  title: string
  description?: string
  badge_text?: string
  image_url?: string
  valid_until?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Review {
  id: string
  restaurant_id: string
  order_id?: string
  customer_name: string
  customer_phone?: string
  rating: number
  comment?: string
  is_visible: boolean
  created_at: string
}

export interface LoyaltyPoints {
  id: string
  restaurant_id: string
  customer_phone: string
  customer_name?: string
  points: number
  total_spent: number
  created_at: string
  updated_at: string
}

export interface PaymentConnection {
  id: string
  restaurant_id: string
  provider: 'stripe' | 'paypal'
  account_id?: string
  publishable_key?: string
  is_active: boolean
  settings: Record<string, unknown>
  created_at: string
}

export interface AdminStats {
  total_restaurants: number
  active_restaurants: number
  demo_restaurants: number
  suspended_restaurants: number
  total_orders_today: number
  total_revenue_today: number
}

export interface FinanceSummary {
  total_orders: number
  total_revenue: number
  avg_ticket: number
  by_payment_method: Record<string, number>
  by_order_type: Record<string, number>
  top_items: { name: string; count: number; revenue: number }[]
}

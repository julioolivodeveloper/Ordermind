'use client'
import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingCart, Check, ArrowLeft, MapPin, Clock } from 'lucide-react'

/* ─────────────── Types ─────────────── */
type Choice = { label: string; price?: number }
type OptionGroup = { group: string; type: 'single' | 'multi'; choices: Choice[] }
type MenuItem = {
  id: number
  name: string
  category: string
  description: string
  price: number
  image: string
  badge?: string
  options: OptionGroup[]
}
type CartItem = {
  key: string
  item: MenuItem
  quantity: number
  selections: Record<string, string[]>
  total: number
}

/* ─────────────── Menu data ─────────────── */
const MENU: MenuItem[] = [
  {
    id: 1,
    name: 'Tacos de Carne Asada',
    category: 'Platillos',
    description: 'Tres tacos con carne de res asada a las brasas, cebolla, cilantro y salsa casera en tortilla de maíz.',
    price: 12.99,
    badge: 'Más pedido',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      {
        group: 'Salsa',
        type: 'single',
        choices: [
          { label: 'Salsa verde' },
          { label: 'Salsa roja' },
          { label: 'Ambas salsas' },
          { label: 'Sin salsa' },
        ],
      },
      {
        group: 'Personaliza',
        type: 'multi',
        choices: [
          { label: 'Sin cebolla' },
          { label: 'Sin cilantro' },
          { label: 'Limones extra' },
          { label: 'Queso fresco', price: 1.5 },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Burrito de Pollo',
    category: 'Platillos',
    description: 'Burrito grande relleno de pollo adobado, arroz, frijoles, pico de gallo y crema en tortilla de harina.',
    price: 13.99,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      {
        group: 'Tamaño',
        type: 'single',
        choices: [
          { label: 'Regular' },
          { label: 'Grande', price: 2 },
        ],
      },
      {
        group: 'Extras',
        type: 'multi',
        choices: [
          { label: 'Guacamole', price: 1.5 },
          { label: 'Jalapeños' },
          { label: 'Sin frijoles' },
          { label: 'Doble pollo', price: 3 },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Quesadilla de Queso',
    category: 'Platillos',
    description: 'Quesadilla de tortilla de harina con queso Oaxaca derretido, acompañada de guacamole y pico de gallo.',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      {
        group: 'Tipo de queso',
        type: 'single',
        choices: [
          { label: 'Queso Oaxaca' },
          { label: 'Monterey Jack' },
          { label: 'Mixto (ambos)' },
        ],
      },
      {
        group: 'Agrega',
        type: 'multi',
        choices: [
          { label: 'Jalapeños' },
          { label: 'Champiñones', price: 1.5 },
          { label: 'Pollo', price: 3 },
          { label: 'Asada', price: 3 },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Nachos Supremos',
    category: 'Platillos',
    description: 'Totopos crujientes bañados en queso cheddar derretido, jalapeños, pico de gallo y crema agria.',
    price: 10.99,
    badge: 'Para compartir',
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      {
        group: 'Salsa extra',
        type: 'single',
        choices: [
          { label: 'Pico de gallo' },
          { label: 'Salsa roja' },
          { label: 'Sin salsa extra' },
        ],
      },
      {
        group: 'Agrega carne',
        type: 'single',
        choices: [
          { label: 'Sin carne' },
          { label: 'Pollo', price: 3 },
          { label: 'Carne asada', price: 3.5 },
        ],
      },
    ],
  },
  {
    id: 5,
    name: 'Agua de Horchata',
    category: 'Bebidas',
    description: 'Agua fresca de horchata artesanal con canela, vainilla y leche. Endulzada al gusto.',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1497534446932-1bda8e040d0f?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      {
        group: 'Tamaño',
        type: 'single',
        choices: [
          { label: 'Chico (16oz)' },
          { label: 'Grande (24oz)', price: 1.5 },
        ],
      },
      {
        group: 'Personaliza',
        type: 'multi',
        choices: [
          { label: 'Sin azúcar' },
          { label: 'Extra canela' },
          { label: 'Con leche condensada' },
        ],
      },
    ],
  },
]

const CATEGORIES = ['Todo', ...Array.from(new Set(MENU.map((m) => m.category)))]

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`
}

/* ─────────────── Item Modal ─────────────── */
function ItemModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem
  onClose: () => void
  onAdd: (cartItem: CartItem) => void
}) {
  const [qty, setQty] = useState(1)
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    item.options.forEach((g) => {
      if (g.type === 'single') init[g.group] = [g.choices[0].label]
      else init[g.group] = []
    })
    return init
  })

  function toggle(group: string, type: 'single' | 'multi', label: string) {
    setSelections((prev) => {
      if (type === 'single') return { ...prev, [group]: [label] }
      const cur = prev[group] || []
      return {
        ...prev,
        [group]: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label],
      }
    })
  }

  function extrasTotal() {
    let extra = 0
    item.options.forEach((g) => {
      const sel = selections[g.group] || []
      g.choices.forEach((c) => {
        if (c.price && sel.includes(c.label)) extra += c.price
      })
    })
    return extra
  }

  const unitPrice = item.price + extrasTotal()
  const total = unitPrice * qty

  function handleAdd() {
    const key = `${item.id}-${JSON.stringify(selections)}`
    onAdd({ key, item, quantity: qty, selections, total })
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-[#111] w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Image */}
        <div className="relative h-52 shrink-0">
          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="600px" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
          {item.badge && (
            <span className="absolute top-4 left-4 bg-[#a3e635] text-black text-xs font-black px-3 py-1 rounded-full">
              {item.badge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div>
            <h2 className="text-white text-2xl font-black">{item.name}</h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">{item.description}</p>
            <p className="text-[#a3e635] font-black text-xl mt-2">{formatPrice(item.price)}</p>
          </div>

          {item.options.map((group) => (
            <div key={group.group}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-white font-black text-sm uppercase tracking-widest">{group.group}</p>
                <span className="text-xs text-slate-500 font-medium">
                  {group.type === 'single' ? '(Elige uno)' : '(Opcional)'}
                </span>
              </div>
              <div className="space-y-2">
                {group.choices.map((c) => {
                  const selected = (selections[group.group] || []).includes(c.label)
                  return (
                    <button
                      key={c.label}
                      onClick={() => toggle(group.group, group.type, c.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                        selected
                          ? 'border-[#a3e635] bg-[#a3e635]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/25'
                      }`}
                    >
                      <span className={`text-sm font-medium ${selected ? 'text-[#a3e635]' : 'text-slate-300'}`}>
                        {c.label}
                      </span>
                      <div className="flex items-center gap-3">
                        {c.price && (
                          <span className={`text-sm font-bold ${selected ? 'text-[#a3e635]' : 'text-slate-400'}`}>
                            +{formatPrice(c.price)}
                          </span>
                        )}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            selected ? 'border-[#a3e635] bg-[#a3e635]' : 'border-white/30'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-[#111] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-white font-black w-5 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-7 h-7 rounded-full bg-[#a3e635] flex items-center justify-center text-black hover:bg-lime-400 transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-between bg-[#a3e635] hover:bg-lime-400 text-black px-5 py-3.5 rounded-xl font-black text-sm transition-all"
            >
              <span>Agregar al carrito</span>
              <span>{formatPrice(total)}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────── Cart Drawer ─────────────── */
function CartDrawer({
  cart,
  onClose,
  onPlaceOrder,
  onChangeQty,
}: {
  cart: CartItem[]
  onClose: () => void
  onPlaceOrder: () => void
  onChangeQty: (key: string, delta: number) => void
}) {
  const subtotal = cart.reduce((acc, ci) => acc + ci.total, 0)
  const fee = 0
  const total = subtotal + fee

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-[#111] w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <h2 className="text-white font-black text-xl">Tu orden</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {cart.map((ci) => {
            const selStr = Object.entries(ci.selections)
              .flatMap(([, vals]) => vals)
              .filter(Boolean)
              .join(', ')
            return (
              <div key={ci.key} className="flex gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                  <Image src={ci.item.image} alt={ci.item.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{ci.item.name}</p>
                  {selStr && <p className="text-slate-500 text-xs mt-0.5 truncate">{selStr}</p>}
                  <p className="text-[#a3e635] font-black text-sm mt-1">{formatPrice(ci.total)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onChangeQty(ci.key, -1)}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <Minus className="w-3 h-3 text-white" />
                  </button>
                  <span className="text-white font-black w-4 text-center text-sm">{ci.quantity}</span>
                  <button
                    onClick={() => onChangeQty(ci.key, 1)}
                    className="w-7 h-7 rounded-full bg-[#a3e635] flex items-center justify-center hover:bg-lime-400 transition-all"
                  >
                    <Plus className="w-3 h-3 text-black" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="px-6 py-5 border-t border-white/10 space-y-3 shrink-0">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span className="text-white font-bold">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-400">
            <span>Comisión por pedido</span>
            <span className="text-[#a3e635] font-bold">$0.00 🎉</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-base text-white font-black">
            <span>Total</span>
            <span className="text-[#a3e635]">{formatPrice(total)}</span>
          </div>
          <button
            onClick={onPlaceOrder}
            className="w-full bg-[#a3e635] hover:bg-lime-400 text-black py-4 rounded-2xl font-black text-base transition-all mt-2"
          >
            Confirmar pedido →
          </button>
          <p className="text-center text-slate-600 text-xs">Paga al recoger en caja • Sin cargos extra</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────── Order Success ─────────────── */
function OrderSuccess({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-24 h-24 rounded-full bg-[#a3e635] flex items-center justify-center mb-8 shadow-2xl shadow-lime-500/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1, stiffness: 200, damping: 15 }}
      >
        <Check className="w-12 h-12 text-black" strokeWidth={3} />
      </motion.div>
      <motion.h1
        className="text-white text-4xl font-black mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        ¡Pedido confirmado!
      </motion.h1>
      <motion.p
        className="text-slate-400 text-lg mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Tu orden está siendo preparada.
      </motion.p>
      <motion.p
        className="text-slate-500 text-sm mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        Número de orden: <span className="text-[#a3e635] font-black">#1042</span>
      </motion.p>
      <motion.div
        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mb-10 text-sm text-slate-400 max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Pasa a caja cuando tu pedido esté listo.<br />
        <span className="text-[#a3e635] font-bold">Tiempo estimado: 15-20 min</span>
      </motion.div>
      <motion.button
        onClick={onBack}
        className="border border-white/20 text-slate-300 hover:border-[#a3e635] hover:text-[#a3e635] px-8 py-3.5 rounded-2xl font-bold text-sm transition-all"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Volver al menú
      </motion.button>
    </motion.div>
  )
}

/* ─────────────── Main Page ─────────────── */
export default function MenuDemo() {
  const [activeCategory, setActiveCategory] = useState('Todo')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const filtered = activeCategory === 'Todo' ? MENU : MENU.filter((m) => m.category === activeCategory)
  const cartCount = cart.reduce((acc, ci) => acc + ci.quantity, 0)

  function addToCart(newItem: CartItem) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.key === newItem.key)
      if (existing) {
        return prev.map((ci) =>
          ci.key === newItem.key
            ? { ...ci, quantity: ci.quantity + newItem.quantity, total: ci.total + newItem.total }
            : ci
        )
      }
      return [...prev, newItem]
    })
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.key !== key) return ci
          const newQty = ci.quantity + delta
          const unitPrice = ci.total / ci.quantity
          return { ...ci, quantity: newQty, total: unitPrice * newQty }
        })
        .filter((ci) => ci.quantity > 0)
    )
  }

  function placeOrder() {
    setShowCart(false)
    setOrderPlaced(true)
    setCart([])
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── Restaurant Header ── */}
      <div className="bg-[#0f0f0f] border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center gap-4">
          <a href="/" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div className="w-12 h-12 rounded-2xl bg-[#a3e635] flex items-center justify-center font-black text-black text-lg shrink-0 shadow-lg shadow-lime-500/20">
            T
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-black text-lg leading-none">Tacos El Paso</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3 h-3" /> Fresno, CA
              </span>
              <span className="flex items-center gap-1 text-xs text-[#a3e635] font-bold">
                <Clock className="w-3 h-3" /> Abierto ahora
              </span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center shrink-0">
            <p className="text-[#a3e635] text-xs font-black">Pickup</p>
            <p className="text-slate-500 text-[10px]">15-20 min</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="max-w-lg mx-auto px-4 pb-0 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                activeCategory === cat
                  ? 'text-[#a3e635] border-[#a3e635] bg-[#a3e635]/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu Grid ── */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => (
            <motion.button
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="w-full text-left bg-[#111] border border-white/8 rounded-2xl overflow-hidden hover:border-[#a3e635]/40 hover:bg-[#151515] transition-all group shadow-lg"
            >
              <div className="flex gap-0">
                {/* Text */}
                <div className="flex-1 p-4 pr-3 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {item.badge && (
                        <span className="bg-[#a3e635]/15 text-[#a3e635] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-slate-600 text-[10px] uppercase tracking-widest font-semibold">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-white font-black text-base leading-snug group-hover:text-[#a3e635] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[#a3e635] font-black text-lg">{formatPrice(item.price)}</span>
                    <div className="w-8 h-8 rounded-full bg-[#a3e635] group-hover:bg-lime-400 flex items-center justify-center transition-all shadow-lg shadow-lime-500/20">
                      <Plus className="w-4 h-4 text-black" strokeWidth={3} />
                    </div>
                  </div>
                </div>
                {/* Image */}
                <div className="relative w-32 h-32 shrink-0 m-3 rounded-xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="128px"
                  />
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Demo watermark */}
        <div className="text-center py-4">
          <p className="text-slate-700 text-xs">
            Menú demo — powered by{' '}
            <a href="/" className="text-slate-500 hover:text-[#a3e635] font-bold transition-colors">
              Ordermind
            </a>
          </p>
        </div>
      </div>

      {/* ── Floating Cart Button ── */}
      <AnimatePresence>
        {cartCount > 0 && !showCart && !orderPlaced && (
          <motion.div
            className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <button
              onClick={() => setShowCart(true)}
              className="w-full flex items-center justify-between bg-[#a3e635] hover:bg-lime-400 text-black px-5 py-4 rounded-2xl font-black text-base shadow-2xl shadow-lime-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-sm font-black">
                  {cartCount}
                </div>
                <span>Ver mi orden</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatPrice(cart.reduce((acc, ci) => acc + ci.total, 0))}</span>
                <ShoppingCart className="w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedItem && (
          <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onAdd={addToCart} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCart && (
          <CartDrawer
            cart={cart}
            onClose={() => setShowCart(false)}
            onPlaceOrder={placeOrder}
            onChangeQty={changeQty}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orderPlaced && <OrderSuccess onBack={() => setOrderPlaced(false)} />}
      </AnimatePresence>
    </div>
  )
}

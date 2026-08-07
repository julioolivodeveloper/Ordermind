'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Minus, Check, ArrowLeft, MapPin, Clock,
  Truck, Store, Lock, Tag, CreditCard, Zap, Trophy, Gift, Star,
} from 'lucide-react'

/* ─────────────── Types ─────────────── */
type Choice = { label: string; price?: number }
type OptionGroup = { group: string; type: 'single' | 'multi'; choices: Choice[] }
type MenuItem = {
  id: number; name: string; category: string
  description: string; price: number; image: string
  badge?: string; promo?: string; options: OptionGroup[]
}
type CartItem = {
  key: string; item: MenuItem; quantity: number
  selections: Record<string, string[]>; unitPrice: number
}
type OrderType = 'pickup' | 'delivery'
type Step = 'menu' | 'cart' | 'payment' | 'success'

/* ─────────────── Menu data ─────────────── */
const MENU: MenuItem[] = [
  {
    id: 1,
    name: 'Tacos de Carne Asada',
    category: 'Platillos',
    description: 'Tres tacos con carne de res asada a las brasas, cebolla, cilantro y salsa casera en tortilla de maíz.',
    price: 12.99,
    badge: 'Más pedido',
    promo: '2×1',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      { group: 'Salsa', type: 'single', choices: [{ label: 'Salsa verde' }, { label: 'Salsa roja' }, { label: 'Ambas' }, { label: 'Sin salsa' }] },
      { group: 'Extras', type: 'multi', choices: [{ label: 'Sin cebolla' }, { label: 'Sin cilantro' }, { label: 'Limones extra' }, { label: 'Queso fresco', price: 1.5 }] },
    ],
  },
  {
    id: 2,
    name: 'Burrito de Pollo',
    category: 'Platillos',
    description: 'Burrito relleno de pollo adobado, arroz, frijoles, pico de gallo y crema en tortilla de harina.',
    price: 13.99,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      { group: 'Tamaño', type: 'single', choices: [{ label: 'Regular' }, { label: 'Grande', price: 2 }] },
      { group: 'Extras', type: 'multi', choices: [{ label: 'Guacamole', price: 1.5 }, { label: 'Jalapeños' }, { label: 'Sin frijoles' }, { label: 'Doble pollo', price: 3 }] },
    ],
  },
  {
    id: 3,
    name: 'Quesadilla de Queso',
    category: 'Platillos',
    description: 'Quesadilla de harina con queso Oaxaca derretido, acompañada de guacamole y pico de gallo.',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      { group: 'Queso', type: 'single', choices: [{ label: 'Queso Oaxaca' }, { label: 'Monterey Jack' }, { label: 'Mixto' }] },
      { group: 'Agrega', type: 'multi', choices: [{ label: 'Jalapeños' }, { label: 'Champiñones', price: 1.5 }, { label: 'Pollo', price: 3 }, { label: 'Asada', price: 3 }] },
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
      { group: 'Salsa extra', type: 'single', choices: [{ label: 'Pico de gallo' }, { label: 'Salsa roja' }, { label: 'Sin salsa' }] },
      { group: 'Carne', type: 'single', choices: [{ label: 'Sin carne' }, { label: 'Pollo', price: 3 }, { label: 'Carne asada', price: 3.5 }] },
    ],
  },
  {
    id: 5,
    name: 'Nieve de Vainilla',
    category: 'Postres',
    description: 'Nieve artesanal de vainilla cremosa, servida en cono o vaso con toppings a elegir.',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=700&h=500&fit=crop&auto=format&q=80',
    options: [
      { group: 'Presentación', type: 'single', choices: [{ label: 'En vaso' }, { label: 'En cono' }, { label: 'Doble bola', price: 2 }] },
      { group: 'Toppings', type: 'multi', choices: [{ label: 'Canela extra' }, { label: 'Cajeta', price: 0.75 }, { label: 'Nuez', price: 0.75 }] },
    ],
  },
]

const CATEGORIES = ['Todo', ...Array.from(new Set(MENU.map((m) => m.category)))]

function fmt(n: number) { return `$${n.toFixed(2)}` }

function cardType(num: string) {
  const d = num.replace(/\s/g, '')
  if (d.startsWith('4')) return 'Visa'
  if (d.startsWith('5')) return 'Mastercard'
  if (d.startsWith('3')) return 'Amex'
  return null
}

function promoDiscount(cart: CartItem[]) {
  const tacos = cart.find((ci) => ci.item.id === 1)
  if (!tacos || tacos.quantity < 2) return 0
  return Math.floor(tacos.quantity / 2) * tacos.unitPrice
}

/* ─────────────── Item Modal ─────────────── */
function ItemModal({ item, onClose, onAdd }: { item: MenuItem; onClose: () => void; onAdd: (ci: CartItem) => void }) {
  const [qty, setQty] = useState(1)
  const [sel, setSel] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    item.options.forEach((g) => { init[g.group] = g.type === 'single' ? [g.choices[0].label] : [] })
    return init
  })

  function toggle(group: string, type: 'single' | 'multi', label: string) {
    setSel((prev) =>
      type === 'single'
        ? { ...prev, [group]: [label] }
        : { ...prev, [group]: (prev[group] || []).includes(label) ? prev[group].filter((x) => x !== label) : [...(prev[group] || []), label] }
    )
  }

  const extras = item.options.reduce((acc, g) => {
    g.choices.forEach((c) => { if (c.price && (sel[g.group] || []).includes(c.label)) acc += c.price })
    return acc
  }, 0)
  const unitPrice = item.price + extras
  const total = unitPrice * qty

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-[#111] w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}>

        <div className="relative h-52 shrink-0">
          <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
          {item.promo && (
            <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />{item.promo}
            </span>
          )}
          {item.badge && !item.promo && (
            <span className="absolute top-4 left-4 bg-[#a3e635] text-black text-xs font-black px-3 py-1 rounded-full">{item.badge}</span>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div>
            <h2 className="text-white text-2xl font-black">{item.name}</h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">{item.description}</p>
            <p className="text-[#a3e635] font-black text-xl mt-2">{fmt(item.price)}</p>
            {item.promo && (
              <p className="text-orange-400 text-xs mt-1 font-semibold">🔥 Promo {item.promo} — agrega 2 o más y el segundo es gratis</p>
            )}
          </div>
          {item.options.map((group) => (
            <div key={group.group}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-white font-black text-sm uppercase tracking-widest">{group.group}</p>
                <span className="text-xs text-slate-500">{group.type === 'single' ? '(Elige uno)' : '(Opcional)'}</span>
              </div>
              <div className="space-y-2">
                {group.choices.map((c) => {
                  const selected = (sel[group.group] || []).includes(c.label)
                  return (
                    <button key={c.label} onClick={() => toggle(group.group, group.type, c.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${selected ? 'border-[#a3e635] bg-[#a3e635]/10' : 'border-white/10 bg-white/5 hover:border-white/25'}`}>
                      <span className={`text-sm font-medium ${selected ? 'text-[#a3e635]' : 'text-slate-300'}`}>{c.label}</span>
                      <div className="flex items-center gap-3">
                        {c.price && <span className={`text-sm font-bold ${selected ? 'text-[#a3e635]' : 'text-slate-400'}`}>+{fmt(c.price)}</span>}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-[#a3e635] bg-[#a3e635]' : 'border-white/30'}`}>
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

        <div className="p-5 border-t border-white/10 bg-[#111] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-white font-black w-5 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-7 h-7 rounded-full bg-[#a3e635] flex items-center justify-center text-black hover:bg-lime-400 transition-all">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button onClick={() => { onAdd({ key: `${item.id}-${JSON.stringify(sel)}`, item, quantity: qty, selections: sel, unitPrice }); onClose() }}
              className="flex-1 flex items-center justify-between bg-[#a3e635] hover:bg-lime-400 text-black px-5 py-3.5 rounded-xl font-black text-sm transition-all">
              <span>Agregar al carrito</span>
              <span>{fmt(total)}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────── Cart Drawer ─────────────── */
function CartDrawer({ cart, orderType, setOrderType, onClose, onCheckout, onChangeQty }: {
  cart: CartItem[]; orderType: OrderType; setOrderType: (t: OrderType) => void
  onClose: () => void; onCheckout: () => void; onChangeQty: (key: string, delta: number) => void
}) {
  const subtotal = cart.reduce((acc, ci) => acc + ci.unitPrice * ci.quantity, 0)
  const discount = promoDiscount(cart)
  const deliveryFee = orderType === 'delivery' ? 3.99 : 0
  const total = subtotal - discount + deliveryFee

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-[#111] w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <h2 className="text-white font-black text-xl">Tu orden</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Pickup / Delivery toggle */}
        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex rounded-xl bg-white/5 p-1 gap-1">
            {(['pickup', 'delivery'] as OrderType[]).map((t) => (
              <button key={t} onClick={() => setOrderType(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${orderType === t ? 'bg-[#a3e635] text-black shadow' : 'text-slate-400 hover:text-white'}`}>
                {t === 'pickup' ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                {t === 'pickup' ? 'Pickup' : 'Delivery'}
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-2 text-center">
            {orderType === 'pickup' ? '⏱ Listo en 15-20 min · Recoge en caja' : '🚗 Entrega en 30-45 min · Costo $3.99'}
          </p>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {cart.map((ci) => {
            const selStr = Object.values(ci.selections).flat().filter(Boolean).join(', ')
            return (
              <div key={ci.key} className="flex gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                  <img src={ci.item.image} alt={ci.item.name} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{ci.item.name}</p>
                  {selStr && <p className="text-slate-500 text-xs mt-0.5 truncate">{selStr}</p>}
                  <p className="text-[#a3e635] font-black text-sm mt-1">{fmt(ci.unitPrice * ci.quantity)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onChangeQty(ci.key, -1)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <Minus className="w-3 h-3 text-white" />
                  </button>
                  <span className="text-white font-black w-4 text-center text-sm">{ci.quantity}</span>
                  <button onClick={() => onChangeQty(ci.key, 1)} className="w-7 h-7 rounded-full bg-[#a3e635] flex items-center justify-center hover:bg-lime-400 transition-all">
                    <Plus className="w-3 h-3 text-black" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-6 py-5 border-t border-white/10 space-y-2.5 shrink-0">
          <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span className="text-white font-bold">{fmt(subtotal)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-orange-400 font-semibold flex items-center gap-1"><Tag className="w-3 h-3" /> Promo 2×1 Tacos</span>
              <span className="text-orange-400 font-bold">−{fmt(discount)}</span>
            </div>
          )}
          {orderType === 'delivery' && (
            <div className="flex justify-between text-sm text-slate-400"><span>Costo de envío</span><span className="text-white font-bold">{fmt(deliveryFee)}</span></div>
          )}
          <div className="flex justify-between text-sm text-slate-400"><span>Comisión por pedido</span><span className="text-[#a3e635] font-bold">$0.00 🎉</span></div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-base text-white font-black"><span>Total</span><span className="text-[#a3e635]">{fmt(total)}</span></div>
          <button onClick={onCheckout} className="w-full flex items-center justify-between bg-[#a3e635] hover:bg-lime-400 text-black px-5 py-4 rounded-2xl font-black text-base transition-all mt-1">
            <span className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Proceder al pago</span>
            <span>{fmt(total)}</span>
          </button>
          <p className="text-center text-slate-600 text-xs">Solo demo · No se procesa ningún cobro real</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────── Card Checkout ─────────────── */
function CardCheckout({ total, orderType, onBack, onPay }: {
  total: number; orderType: OrderType; onBack: () => void; onPay: () => void
}) {
  const [cardNum, setCardNum] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  function handleCardNum(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 16)
    setCardNum(digits.replace(/(.{4})/g, '$1 ').trim())
  }
  function handleExpiry(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    setExpiry(digits.length >= 3 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits)
  }

  const ct = cardType(cardNum)
  const isValid = cardNum.replace(/\s/g, '').length === 16 && name.trim().length > 2
    && expiry.length === 5 && cvv.length >= 3
    && (orderType === 'pickup' || address.trim().length > 5)

  function handlePay() {
    if (!isValid) return
    setLoading(true)
    setTimeout(() => { setLoading(false); onPay() }, 1800)
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onBack} />
      <motion.div className="relative bg-[#111] w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[95vh] flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div>
              <h2 className="text-white font-black text-lg leading-none">Pago seguro</h2>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1"><Lock className="w-3 h-3" /> Encriptado SSL · Solo demo</p>
            </div>
          </div>
          {ct && <span className="text-slate-300 text-sm font-bold bg-white/10 px-3 py-1 rounded-lg">{ct}</span>}
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-5">

          {/* Demo notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-amber-400 text-lg shrink-0">⚠️</span>
            <p className="text-amber-400 text-xs leading-relaxed">
              <strong>Solo demo</strong> — Este formulario es de ejemplo. Ingresa cualquier dato, no se realiza ningún cobro ni se almacena ninguna información.
            </p>
          </div>

          {/* Card number */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Número de tarjeta</label>
            <div className="relative">
              <input value={cardNum} onChange={(e) => handleCardNum(e.target.value)} placeholder="1234 5678 9012 3456"
                className="w-full bg-white/5 border border-white/15 focus:border-[#a3e635] rounded-xl px-4 py-3.5 text-white text-base font-mono outline-none transition-all placeholder:text-slate-600"
              />
              <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Nombre en la tarjeta</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez"
              className="w-full bg-white/5 border border-white/15 focus:border-[#a3e635] rounded-xl px-4 py-3.5 text-white text-base outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Vencimiento</label>
              <input value={expiry} onChange={(e) => handleExpiry(e.target.value)} placeholder="MM/YY"
                className="w-full bg-white/5 border border-white/15 focus:border-[#a3e635] rounded-xl px-4 py-3.5 text-white text-base font-mono outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1">
                CVV <Lock className="w-3 h-3 text-slate-500" />
              </label>
              <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123"
                type="password"
                className="w-full bg-white/5 border border-white/15 focus:border-[#a3e635] rounded-xl px-4 py-3.5 text-white text-base font-mono outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Delivery address */}
          {orderType === 'delivery' && (
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Dirección de entrega
              </label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Fresno, CA"
                className="w-full bg-white/5 border border-white/15 focus:border-[#a3e635] rounded-xl px-4 py-3.5 text-white text-base outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          )}

          {/* Order type info */}
          <div className={`rounded-xl p-4 flex items-center gap-3 ${orderType === 'pickup' ? 'bg-[#a3e635]/10 border border-[#a3e635]/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
            {orderType === 'pickup' ? <Store className="w-5 h-5 text-[#a3e635] shrink-0" /> : <Truck className="w-5 h-5 text-blue-400 shrink-0" />}
            <div>
              <p className={`font-bold text-sm ${orderType === 'pickup' ? 'text-[#a3e635]' : 'text-blue-400'}`}>
                {orderType === 'pickup' ? 'Pickup en restaurante' : 'Delivery a domicilio'}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                {orderType === 'pickup' ? 'Listo en 15-20 min · Recoge en caja' : 'Entrega estimada 30-45 min · $3.99'}
              </p>
            </div>
          </div>
        </div>

        {/* Pay button */}
        <div className="px-6 py-5 border-t border-white/10 shrink-0">
          <button onClick={handlePay} disabled={!isValid || loading}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base transition-all ${isValid && !loading ? 'bg-[#a3e635] hover:bg-lime-400 text-black' : 'bg-white/10 text-slate-500 cursor-not-allowed'}`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <motion.div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                Procesando...
              </span>
            ) : (
              <><Lock className="w-4 h-4" /> Pagar {fmt(total)}</>
            )}
          </button>
          <p className="text-center text-slate-600 text-xs mt-3">Solo demo · No se procesa ningún cobro real</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────── Loyalty Modal ─────────────── */
const REWARD_THRESHOLD = 500
const HISTORY = [
  { label: 'Tacos de Asada × 2', pts: 26, date: 'Ayer' },
  { label: 'Burrito de Pollo', pts: 14, date: 'Hace 3 días' },
  { label: 'Nachos Supremos', pts: 11, date: 'Hace 5 días' },
]

function LoyaltyModal({ points, onClose }: { points: number; onClose: () => void }) {
  const progress = Math.min(points / REWARD_THRESHOLD, 1)
  const remaining = Math.max(REWARD_THRESHOLD - points, 0)
  const unlocked = points >= REWARD_THRESHOLD

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-[#111] w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[92vh] flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-black text-xl">Mis Puntos</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Points card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-yellow-600/20 border border-yellow-500/30 p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400" /> Cliente Frecuente
                </p>
                <p className="text-white font-black text-sm">Tacos El Paso</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-400 opacity-60" />
            </div>
            <div className="mb-3">
              <span className="text-yellow-400 font-black text-5xl leading-none">{points}</span>
              <span className="text-yellow-400/60 text-lg font-semibold ml-1">pts</span>
            </div>
            {/* Progress bar */}
            <div className="mb-1.5">
              <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }} />
              </div>
            </div>
            <p className="text-yellow-400/70 text-xs font-semibold">
              {unlocked ? '🎉 ¡Recompensa disponible!' : `${remaining} puntos para tu recompensa`}
            </p>
          </div>

          {/* Reward */}
          <div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Tu próxima recompensa</p>
            <div className={`flex gap-4 items-center rounded-2xl border p-4 ${unlocked ? 'border-[#a3e635]/50 bg-[#a3e635]/10' : 'border-white/10 bg-white/5'}`}>
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <img src="https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=200&h=200&fit=crop&auto=format&q=80"
                  alt="Quesadilla" className="absolute inset-0 w-full h-full object-cover" />
                {unlocked && (
                  <div className="absolute inset-0 bg-[#a3e635]/80 flex items-center justify-center">
                    <Gift className="w-8 h-8 text-black" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className={`w-4 h-4 ${unlocked ? 'text-[#a3e635]' : 'text-slate-400'}`} />
                  <p className={`font-black text-sm ${unlocked ? 'text-[#a3e635]' : 'text-white'}`}>Quesadilla de Queso GRATIS</p>
                </div>
                <p className="text-slate-400 text-xs mb-2">Válida en tu próxima orden</p>
                <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${unlocked ? 'bg-[#a3e635]' : 'bg-yellow-400'}`}
                    initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }} />
                </div>
                <p className={`text-xs mt-1 font-bold ${unlocked ? 'text-[#a3e635]' : 'text-slate-500'}`}>
                  {unlocked ? '¡Lista para canjear! 🎉' : `${points} / ${REWARD_THRESHOLD} pts`}
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Cómo funciona</p>
            <div className="space-y-2">
              {[
                { icon: '💰', text: '1 punto por cada $1 gastado en tu orden' },
                { icon: '🎁', text: 'Acumula 500 puntos = Quesadilla gratis' },
                { icon: '♾️', text: 'Los puntos nunca expiran' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-slate-300 text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Historial reciente</p>
            <div className="space-y-2">
              {HISTORY.map((h) => (
                <div key={h.label} className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white text-sm font-semibold">{h.label}</p>
                    <p className="text-slate-500 text-xs">{h.date}</p>
                  </div>
                  <span className="text-yellow-400 font-black text-sm">+{h.pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-slate-700 text-xs pb-2">Solo demo · Los puntos son simulados</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────── Order Success ─────────────── */
function OrderSuccess({ orderType, earnedPoints, newTotal, onBack }: {
  orderType: OrderType; earnedPoints: number; newTotal: number; onBack: () => void
}) {
  return (
    <motion.div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center"
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-24 h-24 rounded-full bg-[#a3e635] flex items-center justify-center mb-8 shadow-2xl shadow-lime-500/30"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1, stiffness: 200, damping: 15 }}>
        <Check className="w-12 h-12 text-black" strokeWidth={3} />
      </motion.div>
      <motion.h1 className="text-white text-4xl font-black mb-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        ¡Pedido confirmado!
      </motion.h1>
      <motion.p className="text-slate-400 text-lg mb-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {orderType === 'pickup' ? 'Tu orden está siendo preparada.' : 'Tu orden está en camino.'}
      </motion.p>
      <motion.p className="text-slate-500 text-sm mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        Número de orden: <span className="text-[#a3e635] font-black">#1042</span>
      </motion.p>
      <motion.div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mb-10 text-sm text-slate-400 max-w-xs"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        {orderType === 'pickup' ? (
          <><MapPin className="w-4 h-4 inline mr-1 text-[#a3e635]" />Recoge en caja cuando esté listo.<br /></>
        ) : (
          <><Truck className="w-4 h-4 inline mr-1 text-blue-400" />Preparando tu pedido para delivery.<br /></>
        )}
        <span className="text-[#a3e635] font-bold">
          {orderType === 'pickup' ? 'Tiempo estimado: 15-20 min' : 'Tiempo estimado: 30-45 min'}
        </span>
      </motion.div>
      {/* Points earned */}
      <motion.div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-6 py-4 mb-4 max-w-xs w-full"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45, type: 'spring' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-400 font-black text-sm">¡Ganaste puntos!</p>
          </div>
          <span className="text-yellow-400 font-black text-xl">+{earnedPoints} pts</span>
        </div>
        <p className="text-yellow-400/60 text-xs mt-1">Nuevo saldo: <strong className="text-yellow-400">{newTotal} pts</strong>
          {newTotal >= REWARD_THRESHOLD && <span className="ml-1 text-[#a3e635]">· 🎉 ¡Quesadilla gratis disponible!</span>}
        </p>
      </motion.div>

      <motion.div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3 mb-8 max-w-xs"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <p className="text-amber-400 text-xs">Solo demo — ningún pedido fue procesado realmente</p>
      </motion.div>
      <motion.button onClick={onBack} className="border border-white/20 text-slate-300 hover:border-[#a3e635] hover:text-[#a3e635] px-8 py-3.5 rounded-2xl font-bold text-sm transition-all"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
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
  const [step, setStep] = useState<Step>('menu')
  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [points, setPoints] = useState(340)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [showPoints, setShowPoints] = useState(false)

  const filtered = activeCategory === 'Todo' ? MENU : MENU.filter((m) => m.category === activeCategory)
  const cartCount = cart.reduce((acc, ci) => acc + ci.quantity, 0)
  const subtotal = cart.reduce((acc, ci) => acc + ci.unitPrice * ci.quantity, 0)
  const discount = promoDiscount(cart)
  const deliveryFee = orderType === 'delivery' ? 3.99 : 0
  const total = subtotal - discount + deliveryFee

  function addToCart(newItem: CartItem) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.key === newItem.key)
      if (existing) return prev.map((ci) => ci.key === newItem.key ? { ...ci, quantity: ci.quantity + newItem.quantity } : ci)
      return [...prev, newItem]
    })
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) => prev.map((ci) => ci.key === key ? { ...ci, quantity: ci.quantity + delta } : ci).filter((ci) => ci.quantity > 0))
  }

  function placeOrder() {
    const earned = Math.floor(total)
    setEarnedPoints(earned)
    setPoints((prev) => prev + earned)
    setCart([])
    setStep('success')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Solo Demo badge */}
      <div className="fixed top-4 right-4 z-30 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest pointer-events-none">
        Solo Demo
      </div>

      {/* ── Restaurant Header ── */}
      <div className="bg-[#0f0f0f] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-4">
          <a href="/" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div className="w-12 h-12 rounded-2xl bg-[#a3e635] flex items-center justify-center font-black text-black text-lg shrink-0 shadow-lg shadow-lime-500/20">T</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-black text-lg leading-none">Tacos El Paso</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="w-3 h-3" /> Fresno, CA</span>
              <span className="flex items-center gap-1 text-xs text-[#a3e635] font-bold"><Clock className="w-3 h-3" /> Abierto ahora</span>
            </div>
          </div>
          {/* Points button */}
          <button onClick={() => setShowPoints(true)}
            className="shrink-0 rounded-xl px-3 py-1.5 text-center border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-all">
            <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-0.5" />
            <p className="text-[10px] font-black text-yellow-400">{points} pts</p>
          </button>
          {/* Pickup/delivery mini badge */}
          <div className={`shrink-0 rounded-xl px-3 py-1.5 text-center border ${orderType === 'pickup' ? 'border-[#a3e635]/30 bg-[#a3e635]/10' : 'border-blue-500/30 bg-blue-500/10'}`}>
            {orderType === 'pickup' ? <Store className="w-4 h-4 text-[#a3e635] mx-auto mb-0.5" /> : <Truck className="w-4 h-4 text-blue-400 mx-auto mb-0.5" />}
            <p className={`text-[10px] font-black ${orderType === 'pickup' ? 'text-[#a3e635]' : 'text-blue-400'}`}>{orderType === 'pickup' ? 'Pickup' : 'Delivery'}</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${activeCategory === cat ? 'text-[#a3e635] border-[#a3e635] bg-[#a3e635]/5' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu Items ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 pb-32">

        {/* Promo Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-500/20 via-red-500/10 to-orange-500/20 p-4 mb-4"
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,120,0,0.1) 10px, rgba(255,120,0,0.1) 20px)' }} />
          <div className="relative flex items-center gap-3">
            <div className="text-3xl shrink-0">🔥</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Promo activa</span>
                <span className="text-slate-500 text-[10px]">Solo demo</span>
              </div>
              <p className="text-white font-black text-base leading-tight">2×1 en Tacos de Carne Asada</p>
              <p className="text-orange-300 text-xs mt-0.5">Agrega 2 o más tacos y el segundo es gratis · Válido hoy hasta las 8pm</p>
            </div>
            <div className="shrink-0 bg-orange-500 text-white font-black text-xl px-3 py-2 rounded-xl shadow-lg shadow-orange-500/30">
              2×1
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => (
            <motion.button key={item.id} layout
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="w-full text-left bg-[#111] border border-white/8 rounded-2xl overflow-hidden hover:border-[#a3e635]/40 hover:bg-[#151515] transition-all group shadow-lg">
              <div className="flex">
                <div className="flex-1 p-4 pr-3 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {item.promo && (
                        <span className="bg-orange-500/20 text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />{item.promo}
                        </span>
                      )}
                      {item.badge && (
                        <span className="bg-[#a3e635]/15 text-[#a3e635] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{item.badge}</span>
                      )}
                      <span className="text-slate-600 text-[10px] uppercase tracking-widest font-semibold">{item.category}</span>
                    </div>
                    <h3 className="text-white font-black text-base leading-snug group-hover:text-[#a3e635] transition-colors">{item.name}</h3>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[#a3e635] font-black text-lg">{fmt(item.price)}</span>
                    <div className="w-8 h-8 rounded-full bg-[#a3e635] group-hover:bg-lime-400 flex items-center justify-center transition-all shadow-lg shadow-lime-500/20">
                      <Plus className="w-4 h-4 text-black" strokeWidth={3} />
                    </div>
                  </div>
                </div>
                <div className="relative w-32 h-32 shrink-0 m-3 rounded-xl overflow-hidden">
                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
        </div>

        <div className="text-center py-4">
          <p className="text-slate-700 text-xs">
            Menú demo · <a href="/" className="text-slate-500 hover:text-[#a3e635] font-bold transition-colors">Ordermind</a>
          </p>
        </div>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && step === 'menu' && (
          <motion.div className="fixed bottom-6 inset-x-4 max-w-sm mx-auto z-40"
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
            <button onClick={() => setStep('cart')}
              className="w-full flex items-center justify-between bg-[#a3e635] hover:bg-lime-400 text-black px-5 py-4 rounded-2xl font-black text-base shadow-2xl shadow-lime-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-sm font-black">{cartCount}</div>
                <span>Ver mi orden</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{fmt(total)}</span>
                {discount > 0 && <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black">2×1</span>}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {selectedItem && <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onAdd={addToCart} />}
      </AnimatePresence>

      <AnimatePresence>
        {step === 'cart' && (
          <CartDrawer cart={cart} orderType={orderType} setOrderType={setOrderType}
            onClose={() => setStep('menu')} onCheckout={() => setStep('payment')} onChangeQty={changeQty} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === 'payment' && (
          <CardCheckout total={total} orderType={orderType}
            onBack={() => setStep('cart')} onPay={placeOrder} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === 'success' && <OrderSuccess orderType={orderType} earnedPoints={earnedPoints} newTotal={points} onBack={() => setStep('menu')} />}
      </AnimatePresence>

      <AnimatePresence>
        {showPoints && <LoyaltyModal points={points} onClose={() => setShowPoints(false)} />}
      </AnimatePresence>
    </div>
  )
}

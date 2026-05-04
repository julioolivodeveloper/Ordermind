'use client'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { StripePaymentForm } from './StripePaymentForm'
import { createClient } from '@/lib/supabase/client'
import { User, CheckCircle2, LogIn } from 'lucide-react'
import Link from 'next/link'
import type { Restaurant } from '@/types'

export function CheckoutForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const [sessionUser, setSessionUser] = useState<{ email: string } | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    order_type: restaurant.pickup_enabled ? 'pickup' : restaurant.delivery_enabled ? 'delivery' : 'dine_in',
    payment_method: 'cash',
    street: '', city: restaurant.city ?? '', zip: '', references: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user?.email) { setProfileLoaded(true); return }
      setSessionUser({ email: user.email })
      try {
        const res = await fetch(`/api/public/${restaurant.slug}/me`)
        const data = await res.json()
        if (data.customer || data.userEmail) {
          setForm(prev => ({
            ...prev,
            customer_name: data.customer?.name || prev.customer_name,
            customer_phone: data.customer?.phone || prev.customer_phone,
            customer_email: data.userEmail || prev.customer_email,
            ...(data.lastAddress ? {
              street: data.lastAddress.street || prev.street,
              city: data.lastAddress.city || prev.city,
              zip: data.lastAddress.zip || prev.zip,
              references: data.lastAddress.references || prev.references,
            } : {}),
          }))
        }
      } catch { /* use empty form */ }
      setProfileLoaded(true)
    })
  }, [restaurant.slug])

  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; discount: number; type: string; amount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const sub = subtotal()
  const tax = sub * (restaurant.tax_rate || 0)
  const deliveryFee = form.order_type === 'delivery' ? restaurant.delivery_fee : 0
  const discountAmt = coupon?.discount ?? 0
  const total = Math.max(0, sub + tax + deliveryFee - discountAmt)

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponError('')
    const res = await fetch(`/api/public/${restaurant.slug}/validate-coupon`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, orderTotal: sub }),
    })
    const data = await res.json()
    if (!res.ok) { setCouponError(data.error); setCoupon(null) }
    else { setCoupon({ code: couponCode.toUpperCase(), discount: data.discount, type: data.type, amount: data.amount }) }
    setCouponLoading(false)
  }

  if (items.length === 0) {
    router.push(`/r/${restaurant.slug}`)
    return null
  }

  function f(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_name || !form.customer_phone) return
    if (
      form.order_type === 'delivery' &&
      (restaurant.delivery_zip_codes?.length ?? 0) > 0 &&
      !restaurant.delivery_zip_codes?.includes(form.zip)
    ) {
      setError('El código postal ingresado no está en nuestra zona de entrega.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const body = {
        restaurant_id: restaurant.id,
        coupon_code: coupon?.code ?? null,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
        order_type: form.order_type,
        payment_method: form.payment_method,
        notes: form.notes || null,
        delivery_address: form.order_type === 'delivery'
          ? { street: form.street, city: form.city, zip: form.zip, references: form.references }
          : null,
        subtotal: sub,
        tax_amount: tax,
        delivery_fee: deliveryFee,
        discount_amount: discountAmt,
        total,
        items: items.map(i => ({
          menu_item_id: i.menu_item_id,
          item_name: i.item_name,
          item_price: i.item_price,
          quantity: i.quantity,
          modifications: i.modifications,
          notes: i.notes,
          subtotal: i.subtotal,
        })),
      }
      const res = await fetch(`/api/public/${restaurant.slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar pedido')
      clearCart()
      router.push(`/r/${restaurant.slug}/order/${data.order_id}?new=1`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fieldClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 text-slate-800"

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="text-white px-4 py-5" style={{ backgroundColor: restaurant.primary_color }}>
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white">←</button>
          <h1 className="font-bold text-lg">Finalizar Pedido</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* Session banner */}
        {profileLoaded && (
          sessionUser ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-green-800">Sesión iniciada</p>
                <p className="text-xs text-green-600 truncate">{sessionUser.email} · Datos autocompletados</p>
              </div>
              <Link href={`/r/${restaurant.slug}/account`} className="text-green-600 hover:text-green-800 transition-colors">
                <User className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <Link
              href={`/r/${restaurant.slug}/login?next=/r/${restaurant.slug}/checkout`}
              className="flex items-center gap-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl px-4 py-3 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: restaurant.primary_color + '15' }}>
                <LogIn className="w-4 h-4" style={{ color: restaurant.primary_color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">Inicia sesión para agilizar tu pedido</p>
                <p className="text-xs text-slate-400">Autocompletamos tu nombre, teléfono y dirección</p>
              </div>
              <span className="text-xs font-bold shrink-0" style={{ color: restaurant.primary_color }}>Entrar →</span>
            </Link>
          )
        )}

        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Tus datos</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
            <input value={form.customer_name} onChange={f('customer_name')} required placeholder="Juan García" className={fieldClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono *</label>
            <input value={form.customer_phone} onChange={f('customer_phone')} required placeholder="+1 (555) 000-0000" className={fieldClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo (opcional)</label>
            <input type="email" value={form.customer_email} onChange={f('customer_email')} placeholder="tu@correo.com" className={fieldClass} />
          </div>
        </div>

        {/* Order type */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Tipo de pedido</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'pickup', label: '🏪 Recoger', enabled: restaurant.pickup_enabled },
              { value: 'delivery', label: '🚚 Delivery', enabled: restaurant.delivery_enabled },
              { value: 'dine_in', label: '🍽️ En mesa', enabled: restaurant.dine_in_enabled },
            ].filter(o => o.enabled).map(opt => (
              <label key={opt.value} className={`border rounded-xl p-3 text-center cursor-pointer transition-all text-sm font-medium ${form.order_type === opt.value ? 'border-2 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                style={form.order_type === opt.value ? { borderColor: restaurant.primary_color, backgroundColor: restaurant.primary_color } : {}}>
                <input type="radio" name="order_type" value={opt.value} checked={form.order_type === opt.value} onChange={f('order_type')} className="hidden" />
                {opt.label}
              </label>
            ))}
          </div>

          {form.order_type === 'delivery' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Calle y número *</label>
                <input value={form.street} onChange={f('street')} required placeholder="Av. Juárez 123" className={fieldClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad *</label>
                  <input value={form.city} onChange={f('city')} required className={fieldClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código postal *</label>
                  <input
                    value={form.zip}
                    onChange={f('zip')}
                    required
                    placeholder="79900"
                    maxLength={10}
                    className={`${fieldClass} ${
                      form.zip && (restaurant.delivery_zip_codes?.length ?? 0) > 0 && !restaurant.delivery_zip_codes?.includes(form.zip)
                        ? 'border-red-400 focus:ring-red-400'
                        : form.zip && (restaurant.delivery_zip_codes?.length ?? 0) > 0 && restaurant.delivery_zip_codes?.includes(form.zip)
                        ? 'border-green-400 focus:ring-green-400'
                        : ''
                    }`}
                  />
                  {/* Zona validation feedback */}
                  {form.zip && (restaurant.delivery_zip_codes?.length ?? 0) > 0 && (
                    restaurant.delivery_zip_codes?.includes(form.zip) ? (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        ✓ ¡Hacemos delivery a tu zona!
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 mt-1">
                        ✗ Lo sentimos, no hacemos delivery a este código postal.
                      </p>
                    )
                  )}
                  {(restaurant.delivery_zip_codes?.length ?? 0) > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Zonas disponibles: {restaurant.delivery_zip_codes?.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Referencias</label>
                <input value={form.references} onChange={f('references')} placeholder="Casa blanca, portón negro" className={fieldClass} />
              </div>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Método de pago</h2>
          <div className="space-y-2">
            {[
              { value: 'cash', label: '💵 Pago en efectivo', show: true },
              { value: 'card', label: '💳 Tarjeta al entregar', show: true },
              { value: 'stripe', label: '🔒 Tarjeta de crédito/débito (en línea)', show: !!restaurant.stripe_connected },
            ].filter(o => o.show).map(opt => (
              <label key={opt.value} className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-all ${form.payment_method === opt.value ? 'border-2' : 'border-slate-200'}`}
                style={form.payment_method === opt.value ? { borderColor: restaurant.primary_color } : {}}>
                <input type="radio" name="payment_method" value={opt.value} checked={form.payment_method === opt.value} onChange={f('payment_method')} className="hidden" />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.payment_method === opt.value ? 'border-0' : 'border-slate-300'}`}
                  style={form.payment_method === opt.value ? { backgroundColor: restaurant.primary_color } : {}}>
                  {form.payment_method === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-sm font-medium text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas del pedido (opcional)</label>
          <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Alergias, instrucciones especiales..." className={`${fieldClass} resize-none`} />
        </div>

        {/* Coupon */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Cupón de descuento</h2>
          {coupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-bold text-green-700 font-mono">{coupon.code}</p>
                <p className="text-xs text-green-600">
                  {coupon.type === 'percent' ? `-${coupon.amount}%` : `-$${coupon.amount}`} aplicado — ahorras {formatCurrency(coupon.discount)}
                </p>
              </div>
              <button onClick={() => { setCoupon(null); setCouponCode('') }} className="text-green-500 hover:text-red-500 text-lg transition-colors">✕</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                placeholder="CÓDIGO"
                className={`${fieldClass} font-mono flex-1`}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: restaurant.primary_color }}
              >
                {couponLoading ? '...' : 'Aplicar'}
              </button>
            </div>
          )}
          {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-slate-600">
                <span>{item.quantity}x {item.item_name}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-2 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span>{formatCurrency(sub)}</span>
              </div>
              {tax > 0 && <div className="flex justify-between text-slate-600">
                <span>{restaurant.tax_name || 'Tax'}</span><span>{formatCurrency(tax)}</span>
              </div>}
              {deliveryFee > 0 && <div className="flex justify-between text-slate-600">
                <span>Delivery</span><span>{formatCurrency(deliveryFee)}</span>
              </div>}
              {discountAmt > 0 && <div className="flex justify-between text-green-600 font-medium">
                <span>Discount ({coupon?.code})</span><span>-{formatCurrency(discountAmt)}</span>
              </div>}
              <div className="flex justify-between font-bold text-slate-800 text-base pt-1">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* Stripe pago en línea */}
        {form.payment_method === 'stripe' ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-800">Datos de tarjeta</h2>
            {(!form.customer_name || !form.customer_phone) ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                Completa tu nombre y teléfono antes de ingresar los datos de tu tarjeta.
              </p>
            ) : (
              <StripePaymentForm
                restaurant={restaurant}
                orderData={{
                  customer_name: form.customer_name,
                  customer_phone: form.customer_phone,
                  customer_email: form.customer_email,
                  order_type: form.order_type,
                  notes: form.notes,
                  delivery_address: form.order_type === 'delivery'
                    ? { street: form.street, city: form.city, zip: form.zip, references: form.references }
                    : null,
                  subtotal: sub,
                  tax_amount: tax,
                  delivery_fee: deliveryFee,
                  discount_amount: discountAmt,
                  total,
                  items: items.map(i => ({
                    menu_item_id: i.menu_item_id,
                    item_name: i.item_name,
                    item_price: i.item_price,
                    quantity: i.quantity,
                    modifications: i.modifications,
                    notes: i.notes,
                    subtotal: i.subtotal,
                  })),
                }}
                onSuccess={orderId => { clearCart(); router.push(`/r/${restaurant.slug}/order/${orderId}?new=1`) }}
                onError={msg => setError(msg)}
              />
            )}
          </div>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-4 rounded-2xl font-bold text-base transition-colors disabled:opacity-60"
            style={{ backgroundColor: restaurant.primary_color }}
          >
            {loading ? 'Procesando pedido...' : `Realizar pedido — ${formatCurrency(total)}`}
          </button>
        )}

        <p className="text-center text-slate-400 text-xs pb-4">
          Al confirmar aceptas los términos del restaurante
        </p>
      </form>
    </div>
  )
}

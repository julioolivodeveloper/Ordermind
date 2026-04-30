'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Restaurant } from '@/types'

export function CheckoutForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    order_type: restaurant.pickup_enabled ? 'pickup' : restaurant.delivery_enabled ? 'delivery' : 'dine_in',
    payment_method: 'cash',
    street: '', city: restaurant.city ?? '', zip: '', references: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sub = subtotal()
  const tax = sub * (restaurant.tax_rate || 0)
  const deliveryFee = form.order_type === 'delivery' ? restaurant.delivery_fee : 0
  const total = sub + tax + deliveryFee

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
    setLoading(true)
    setError('')
    try {
      const body = {
        restaurant_id: restaurant.id,
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
        discount_amount: 0,
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
      router.push(`/r/${restaurant.slug}/order/${data.order_id}`)
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
        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Tus datos</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
            <input value={form.customer_name} onChange={f('customer_name')} required placeholder="Juan García" className={fieldClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono *</label>
            <input value={form.customer_phone} onChange={f('customer_phone')} required placeholder="+52 614 000 0000" className={fieldClass} />
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código postal</label>
                  <input value={form.zip} onChange={f('zip')} className={fieldClass} />
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
              { value: 'cash', label: '💵 Pago en efectivo' },
              { value: 'card', label: '💳 Tarjeta al entregar' },
            ].map(opt => (
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

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Resumen</h2>
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
                <span>{restaurant.tax_name || 'IVA'}</span><span>{formatCurrency(tax)}</span>
              </div>}
              {deliveryFee > 0 && <div className="flex justify-between text-slate-600">
                <span>Envío</span><span>{formatCurrency(deliveryFee)}</span>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white py-4 rounded-2xl font-bold text-base transition-colors disabled:opacity-60"
          style={{ backgroundColor: restaurant.primary_color }}
        >
          {loading ? 'Procesando pedido...' : `Realizar pedido — ${formatCurrency(total)}`}
        </button>

        <p className="text-center text-slate-400 text-xs pb-4">
          Al confirmar aceptas los términos del restaurante
        </p>
      </form>
    </div>
  )
}

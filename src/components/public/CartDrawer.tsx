'use client'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Restaurant } from '@/types'

export function CartDrawer({ restaurant }: { restaurant: Restaurant }) {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore()
  const router = useRouter()

  const sub = subtotal()
  const tax = sub * (restaurant.tax_rate || 0)
  const delivery = restaurant.delivery_enabled ? restaurant.delivery_fee : 0
  const total = sub + tax + delivery

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={closeCart} />
      <div className="w-full max-w-sm bg-white flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">Mi Pedido</h2>
          <button onClick={closeCart} className="text-slate-400 hover:text-slate-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-slate-400">
              <p className="text-5xl mb-4">🛒</p>
              <p className="font-medium text-slate-600">Tu carrito está vacío</p>
              <p className="text-sm mt-1">Agrega platillos del menú</p>
              <button onClick={closeCart} className="mt-4 text-sm font-medium underline" style={{ color: restaurant.primary_color }}>
                Ver menú
              </button>
            </div>
          ) : (
            items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                {item.image_url && (
                  <img src={item.image_url} alt={item.item_name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{item.item_name}</p>
                  {item.modifications.length > 0 && (
                    <ul className="mt-0.5 space-y-0.5">
                      {item.modifications.map((m, mi) => (
                        <li key={mi} className={`text-xs ${m.type === 'remove' ? 'text-red-500' : 'text-green-600'}`}>
                          {m.type === 'remove' ? '✗ Sin ' : '+ '}{m.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.notes && <p className="text-xs text-slate-400 italic mt-0.5">"{item.notes}"</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-0.5">
                      <button onClick={() => updateQuantity(i, item.quantity - 1)} className="text-slate-500 font-bold text-sm w-4 h-4 flex items-center justify-center">−</button>
                      <span className="text-xs font-semibold text-slate-700">{item.quantity}</span>
                      <button onClick={() => updateQuantity(i, item.quantity + 1)} className="text-slate-500 font-bold text-sm w-4 h-4 flex items-center justify-center">+</button>
                    </div>
                    <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-400 text-xs transition-colors">Quitar</button>
                  </div>
                </div>
                <p className="font-semibold text-slate-800 text-sm shrink-0">{formatCurrency(item.subtotal)}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t border-slate-100 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span>{formatCurrency(sub)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{restaurant.tax_name || 'IVA'}</span><span>{formatCurrency(tax)}</span>
                </div>
              )}
              {restaurant.delivery_enabled && (
                <div className="flex justify-between text-slate-600">
                  <span>Envío</span><span>{delivery > 0 ? formatCurrency(delivery) : 'Gratis'}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 text-base pt-2 border-t border-slate-100">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
            <button
              onClick={() => { closeCart(); router.push(`/r/${restaurant.slug}/checkout`) }}
              className="w-full text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
              style={{ backgroundColor: restaurant.primary_color }}
            >
              Ir a pagar →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

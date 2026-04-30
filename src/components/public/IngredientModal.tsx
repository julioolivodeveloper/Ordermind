'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem, Restaurant, Modification } from '@/types'

interface Props {
  item: MenuItem
  restaurant: Restaurant
  onClose: () => void
}

export function IngredientModal({ item, restaurant, onClose }: Props) {
  const { addItem, openCart } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [modifications, setModifications] = useState<Modification[]>(() =>
    (item.ingredients ?? [])
      .filter(i => !i.is_default)
      .map(i => ({ ingredient_id: i.id, name: i.name, type: 'add' as const, extra_cost: i.extra_cost }))
      .filter(() => false)
  )

  const defaultIngredients = item.ingredients?.filter(i => i.is_default) ?? []
  const optionalIngredients = item.ingredients?.filter(i => !i.is_default) ?? []

  function isRemoved(id: string) {
    return modifications.some(m => m.ingredient_id === id && m.type === 'remove')
  }
  function isAdded(id: string) {
    return modifications.some(m => m.ingredient_id === id && m.type === 'add')
  }

  function toggleRemove(ing: typeof defaultIngredients[0]) {
    if (isRemoved(ing.id)) {
      setModifications(prev => prev.filter(m => m.ingredient_id !== ing.id))
    } else {
      setModifications(prev => [...prev, { ingredient_id: ing.id, name: ing.name, type: 'remove', extra_cost: 0 }])
    }
  }

  function toggleAdd(ing: typeof optionalIngredients[0]) {
    if (isAdded(ing.id)) {
      setModifications(prev => prev.filter(m => m.ingredient_id !== ing.id))
    } else {
      setModifications(prev => [...prev, { ingredient_id: ing.id, name: ing.name, type: 'add', extra_cost: ing.extra_cost }])
    }
  }

  const extrasTotal = modifications
    .filter(m => m.type === 'add')
    .reduce((s, m) => s + m.extra_cost, 0)
  const unitPrice = item.price + extrasTotal
  const totalPrice = unitPrice * quantity

  function handleAdd() {
    addItem({
      menu_item_id: item.id,
      item_name: item.name,
      item_price: unitPrice,
      image_url: item.image_url,
      quantity,
      modifications,
      notes: notes || undefined,
      subtotal: totalPrice,
    })
    onClose()
    openCart()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        {item.image_url && (
          <div className="h-48 rounded-t-2xl overflow-hidden shrink-0">
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{item.name}</h2>
              {item.description && <p className="text-slate-500 text-sm mt-1">{item.description}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 ml-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Default ingredients - can remove */}
          {defaultIngredients.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Quitar ingredientes</h3>
              <div className="space-y-2">
                {defaultIngredients.map(ing => (
                  <label key={ing.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={!isRemoved(ing.id)}
                      onChange={() => toggleRemove(ing)}
                      className="rounded w-4 h-4"
                      style={{ accentColor: restaurant.primary_color }}
                    />
                    <span className={`text-sm ${isRemoved(ing.id) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {ing.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Optional ingredients - can add */}
          {optionalIngredients.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Agregar extras</h3>
              <div className="space-y-2">
                {optionalIngredients.map(ing => (
                  <label key={ing.id} className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isAdded(ing.id)}
                        onChange={() => toggleAdd(ing)}
                        className="rounded w-4 h-4"
                        style={{ accentColor: restaurant.primary_color }}
                      />
                      <span className="text-sm text-slate-700">{ing.name}</span>
                    </div>
                    {ing.extra_cost > 0 && (
                      <span className="text-sm font-medium text-slate-500">+ {formatCurrency(ing.extra_cost)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Notas especiales</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Alergias, preferencias..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none text-slate-800"
              style={{ '--tw-ring-color': restaurant.primary_color } as any}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3 py-1.5">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-slate-600 font-bold w-6 h-6 flex items-center justify-center hover:text-slate-900">−</button>
              <span className="font-semibold text-slate-800 w-4 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="text-slate-600 font-bold w-6 h-6 flex items-center justify-center hover:text-slate-900">+</button>
            </div>
            <div className="text-right flex-1">
              {extrasTotal > 0 && <p className="text-xs text-slate-400">Base {formatCurrency(item.price)} + extras {formatCurrency(extrasTotal)}</p>}
              <p className="font-bold text-slate-800 text-lg">{formatCurrency(totalPrice)}</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
            style={{ backgroundColor: restaurant.primary_color }}
          >
            Agregar al pedido — {formatCurrency(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem, Restaurant, Modification, SelectedOption } from '@/types'
import { ModelViewerModal } from '@/components/public/ModelViewerModal'

interface Props {
  item: MenuItem
  restaurant: Restaurant
  onClose: () => void
}

export function IngredientModal({ item, restaurant, onClose }: Props) {
  const { addItem, openCart } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [showModel, setShowModel] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([])
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

  const optionGroups = item.option_groups ?? []

  function isOptionSelected(optionId: string) {
    return selectedOptions.some(o => o.option_id === optionId)
  }

  function toggleOption(groupId: string, groupName: string, optionId: string, optionName: string, extraCost: number, maxSelections: number) {
    if (isOptionSelected(optionId)) {
      setSelectedOptions(prev => prev.filter(o => o.option_id !== optionId))
    } else {
      setSelectedOptions(prev => {
        const inGroup = prev.filter(o => o.group_id === groupId)
        const rest = prev.filter(o => o.group_id !== groupId)
        if (maxSelections === 1) {
          return [...rest, { group_id: groupId, group_name: groupName, option_id: optionId, option_name: optionName, extra_cost: extraCost }]
        }
        if (inGroup.length >= maxSelections) return prev
        return [...prev, { group_id: groupId, group_name: groupName, option_id: optionId, option_name: optionName, extra_cost: extraCost }]
      })
    }
  }

  const requiredGroups = optionGroups.filter(g => g.required)
  const allRequiredSelected = requiredGroups.every(g => selectedOptions.some(o => o.group_id === g.id))

  const extrasTotal =
    modifications.filter(m => m.type === 'add').reduce((s, m) => s + m.extra_cost, 0) +
    selectedOptions.reduce((s, o) => s + o.extra_cost, 0)
  const unitPrice = item.price + extrasTotal
  const totalPrice = unitPrice * quantity

  function handleAdd() {
    if (!allRequiredSelected) return
    addItem({
      menu_item_id: item.id,
      item_name: item.name,
      item_price: unitPrice,
      image_url: item.image_url,
      quantity,
      modifications,
      selected_options: selectedOptions,
      notes: notes || undefined,
      subtotal: totalPrice,
    })
    onClose()
    openCart()
  }

  return (
    <>
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
            {(item.image_url || (item as any).model_url) && (
              <div className="flex gap-2 mt-3">
                {item.image_url && (
                  <button
                    onClick={() => setShowImage(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Ver imagen
                  </button>
                )}
                {(item as any).model_url && (
                  <button
                    onClick={() => setShowModel(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-white transition-colors"
                    style={{ backgroundColor: restaurant.primary_color, borderColor: restaurant.primary_color }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
                    </svg>
                    Ver en 3D
                  </button>
                )}
              </div>
            )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 ml-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Option groups (combos) */}
          {optionGroups.map(group => (
            <div key={group.id} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-slate-700">{group.name}</h3>
                {group.required ? (
                  <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Requerido</span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">Opcional</span>
                )}
                {group.max_selections > 1 && (
                  <span className="text-xs text-slate-400">Elige hasta {group.max_selections}</span>
                )}
              </div>
              <div className="space-y-2">
                {(group.options ?? []).map(opt => {
                  const selected = isOptionSelected(opt.id)
                  const isRadio = group.max_selections === 1
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selected ? 'border-2 bg-opacity-5' : 'border-slate-200 hover:border-slate-300'}`}
                      style={selected ? { borderColor: restaurant.primary_color, backgroundColor: restaurant.primary_color + '10' } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type={isRadio ? 'radio' : 'checkbox'}
                          name={isRadio ? `group-${group.id}` : undefined}
                          checked={selected}
                          onChange={() => toggleOption(group.id, group.name, opt.id, opt.name, opt.extra_cost, group.max_selections)}
                          className="w-4 h-4"
                          style={{ accentColor: restaurant.primary_color }}
                        />
                        <span className="text-sm text-slate-700 font-medium">{opt.name}</span>
                      </div>
                      {opt.extra_cost > 0 && (
                        <span className="text-sm font-medium text-slate-500">+ {formatCurrency(opt.extra_cost)}</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

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
            disabled={!allRequiredSelected}
            className="w-full text-white py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: restaurant.primary_color }}
          >
            {!allRequiredSelected ? 'Selecciona las opciones requeridas' : `Agregar al pedido — ${formatCurrency(totalPrice)}`}
          </button>
        </div>
      </div>
    </div>

    {/* Image lightbox */}
    {showImage && item.image_url && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowImage(false)}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowImage(false)}
            className="absolute -top-10 right-0 text-white/70 hover:text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={item.image_url} alt={item.name} className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
        </div>
      </div>
    )}

    {/* 3D model viewer */}
    {(item as any).model_url && (
      <ModelViewerModal
        open={showModel}
        onClose={() => setShowModel(false)}
        itemName={item.name}
        modelUrl={(item as any).model_url}
        color={restaurant.primary_color}
      />
    )}
  </>
  )
}

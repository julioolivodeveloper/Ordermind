'use client'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart-store'
import { IngredientModal } from './IngredientModal'
import { CartDrawer } from './CartDrawer'
import { formatCurrency } from '@/lib/utils'
import type { Restaurant, MenuCategory, MenuItem } from '@/types'

interface Props {
  restaurant: Restaurant
  categories: (MenuCategory & { menu_items: MenuItem[] })[]
}

export function PublicMenu({ restaurant, categories }: Props) {
  const { setRestaurant, itemCount, openCart } = useCartStore()
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  useEffect(() => {
    setRestaurant(restaurant.slug)
  }, [restaurant.slug])

  const allItems = categories.flatMap(c => c.menu_items ?? [])

  const filteredItems = allItems.filter(item => {
    const matchCat = selectedCat === 'all' || item.category_id === selectedCat
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch && item.is_available
  })

  const count = itemCount()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div
        className="relative text-white"
        style={{ background: `linear-gradient(135deg, ${restaurant.primary_color}, ${restaurant.secondary_color})` }}
      >
        {restaurant.cover_url && (
          <div className="absolute inset-0">
            <img src={restaurant.cover_url} alt="" className="w-full h-full object-cover opacity-20" />
          </div>
        )}
        <div className="relative max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold shadow-lg">
                {restaurant.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              {restaurant.description && <p className="text-white/80 text-sm mt-0.5">{restaurant.description}</p>}
              {restaurant.address && (
                <p className="text-white/60 text-xs mt-1">📍 {restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ''}</p>
              )}
            </div>
          </div>

          {restaurant.is_demo && (
            <div className="mt-4 bg-yellow-400/20 border border-yellow-300/30 text-yellow-100 text-xs px-3 py-2 rounded-lg">
              🧪 Este restaurante está en modo demo
            </div>
          )}
        </div>
      </div>

      {/* Search + Cart button */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar platillos..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400"
            style={{ '--tw-ring-color': restaurant.primary_color } as any}
          />
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0"
            style={{ backgroundColor: restaurant.primary_color }}
          >
            🛒
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
            {count > 0 && <span className="hidden sm:inline">Mi pedido</span>}
          </button>
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCat('all')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedCat === 'all' ? 'text-white border-transparent' : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'}`}
              style={selectedCat === 'all' ? { backgroundColor: restaurant.primary_color, borderColor: restaurant.primary_color } : {}}
            >
              Todos ({allItems.filter(i => i.is_available).length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedCat === cat.id ? 'text-white border-transparent' : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'}`}
                style={selectedCat === cat.id ? { backgroundColor: restaurant.primary_color, borderColor: restaurant.primary_color } : {}}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-medium">{search ? 'No se encontraron platillos' : 'Sin platillos disponibles'}</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex gap-0 cursor-pointer hover:shadow-md transition-shadow menu-card"
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{item.name}</h3>
                    {item.description && (
                      <p className="text-slate-500 text-sm mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      {item.is_popular && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐ Popular</span>}
                      {item.is_spicy && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🌶️</span>}
                      {(item.ingredients?.length ?? 0) > 0 && (
                        <span className="text-xs text-slate-400">Personalizable</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-800">{formatCurrency(item.price)}</p>
                    <button
                      className="mt-2 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{ backgroundColor: restaurant.primary_color }}
                      onClick={e => { e.stopPropagation(); setSelectedItem(item) }}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
              {item.image_url && (
                <div className="w-32 shrink-0">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 text-slate-400 text-xs">
        Powered by <span className="font-semibold">Ordermind</span>
      </div>

      {/* Modals / Drawers */}
      {selectedItem && (
        <IngredientModal
          item={selectedItem}
          restaurant={restaurant}
          onClose={() => setSelectedItem(null)}
        />
      )}
      <CartDrawer restaurant={restaurant} />
    </div>
  )
}

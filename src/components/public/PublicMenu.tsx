'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  useEffect(() => { setRestaurant(restaurant.slug) }, [restaurant.slug])

  const allItems = categories.flatMap(c => c.menu_items ?? [])
  const filteredItems = allItems.filter(item => {
    const matchCat = selectedCat === 'all' || item.category_id === selectedCat
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch && item.is_available
  })
  const count = itemCount()

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero header */}
      <div
        className="relative text-white overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${restaurant.primary_color}ee, ${restaurant.secondary_color}dd)` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-2xl translate-x-1/4 translate-y-1/4" />
        </div>

        {restaurant.cover_url && (
          <div className="absolute inset-0">
            <img src={restaurant.cover_url} alt="" className="w-full h-full object-cover opacity-15" />
          </div>
        )}

        <div className="relative max-w-3xl mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-5"
          >
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-white/20" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-black shadow-2xl ring-4 ring-white/20">
                {restaurant.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tight">{restaurant.name}</h1>
              {restaurant.description && <p className="text-white/75 text-sm mt-1">{restaurant.description}</p>}
              {restaurant.address && (
                <p className="text-white/55 text-xs mt-1.5">📍 {restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ''}</p>
              )}
            </div>
          </motion.div>

          {restaurant.is_demo && (
            <div className="mt-5 bg-yellow-400/20 border border-yellow-300/30 text-yellow-100 text-xs px-4 py-2.5 rounded-xl">
              🧪 Este restaurante está en modo demo
            </div>
          )}
        </div>
      </div>

      {/* Sticky search + cart */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar platillos..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent bg-slate-50"
              style={{ '--tw-ring-color': restaurant.primary_color } as any}
            />
          </div>
          <motion.button
            onClick={openCart}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0 shadow-lg hover:brightness-110 transition-all"
            style={{ backgroundColor: restaurant.primary_color }}
          >
            🛒
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
            {count > 0 && <span className="hidden sm:inline">Mi pedido</span>}
          </motion.button>
        </div>

        {categories.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCat('all')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedCat === 'all' ? 'text-white border-transparent shadow-md' : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'}`}
              style={selectedCat === 'all' ? { backgroundColor: restaurant.primary_color } : {}}
            >
              ✨ Todos ({allItems.filter(i => i.is_available).length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedCat === cat.id ? 'text-white border-transparent shadow-md' : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'}`}
                style={selectedCat === cat.id ? { backgroundColor: restaurant.primary_color } : {}}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-slate-400">
              <p className="text-5xl mb-3">🍽️</p>
              <p className="font-semibold text-slate-500">{search ? 'No se encontraron platillos' : 'Sin platillos disponibles'}</p>
            </motion.div>
          ) : (
            filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group"
              >
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                      {item.description && (
                        <p className="text-slate-500 text-sm mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {item.is_popular && <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-medium">⭐ Popular</span>}
                        {item.is_spicy && <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-medium">🌶️ Picante</span>}
                        {(item.ingredients?.length ?? 0) > 0 && <span className="text-xs text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full">Personalizable</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-slate-800 text-lg">{formatCurrency(item.price)}</p>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="mt-2 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:brightness-110 shadow-md transition-all"
                        style={{ backgroundColor: restaurant.primary_color }}
                        onClick={e => { e.stopPropagation(); setSelectedItem(item) }}
                      >
                        + Agregar
                      </motion.button>
                    </div>
                  </div>
                </div>
                {item.image_url && (
                  <div className="w-32 shrink-0 overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="text-center pb-10 text-slate-400 text-xs">
        Powered by <span className="font-bold text-slate-500">Ordermind</span>
      </div>

      {selectedItem && <IngredientModal item={selectedItem} restaurant={restaurant} onClose={() => setSelectedItem(null)} />}
      <CartDrawer restaurant={restaurant} />
    </div>
  )
}

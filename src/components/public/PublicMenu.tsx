'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Phone, Globe, ShoppingCart,
  Search, Star, Flame, ChevronDown, Bike, UtensilsCrossed,
  MessageCircle, X, Sparkles, User
} from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart-store'
import { IngredientModal } from './IngredientModal'
import { CartDrawer } from './CartDrawer'
import { PromotionBanners } from './PromotionBanners'
import { ReviewSection } from './ReviewSection'
import { formatCurrency } from '@/lib/utils'
import type { Restaurant, MenuCategory, MenuItem, Promotion, Review } from '@/types'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

interface Props {
  restaurant: Restaurant
  categories: (MenuCategory & { menu_items: MenuItem[] })[]
  promotions?: Promotion[]
  reviews?: Review[]
}

function isOpenNow(business_hours: Record<string, unknown> | undefined): boolean | null {
  if (!business_hours || Object.keys(business_hours).length === 0) return null
  const days = ['sun','mon','tue','wed','thu','fri','sat']
  const now = new Date()
  const dayKey = days[now.getDay()]
  const hours = (business_hours as any)[dayKey]
  if (!hours || !hours.enabled) return false
  const [oh, om] = hours.open.split(':').map(Number)
  const [ch, cm] = hours.close.split(':').map(Number)
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= oh * 60 + om && mins < ch * 60 + cm
}

const LABELS = {
  es: {
    search: 'Buscar platillos...', all: 'Todos', menu: 'Nuestro Menú',
    dishes: 'platillos', viewMenu: 'Ver menú', myOrder: 'Mi pedido',
    notFound: 'No se encontraron platillos', noItems: 'Sin platillos disponibles',
    clearSearch: 'Limpiar búsqueda', popular: 'Popular', spicy: 'Picante',
    customizable: 'Personalizable', add: '+ Agregar', findUs: 'Encuéntranos',
    address: 'Dirección', whatsapp: 'WhatsApp', phone: 'Teléfono',
    open: 'Abierto ahora', closed: 'Cerrado', off: 'de desc.',
  },
  en: {
    search: 'Search dishes...', all: 'All', menu: 'Our Menu',
    dishes: 'items', viewMenu: 'View menu', myOrder: 'My order',
    notFound: 'No dishes found', noItems: 'No items available',
    clearSearch: 'Clear search', popular: 'Popular', spicy: 'Spicy',
    customizable: 'Customizable', add: '+ Add', findUs: 'Find us',
    address: 'Address', whatsapp: 'WhatsApp', phone: 'Phone',
    open: 'Open now', closed: 'Closed', off: 'off',
  },
}

export function PublicMenu({ restaurant, categories, promotions = [], reviews = [] }: Props) {
  const { setRestaurant, itemCount, openCart } = useCartStore()
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [navVisible, setNavVisible] = useState(false)
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const heroRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOpen = isOpenNow(restaurant.business_hours)
  const t = LABELS[lang]

  function itemName(item: MenuItem) { return lang === 'en' && item.name_en ? item.name_en : item.name }
  function itemDesc(item: MenuItem) { return lang === 'en' && item.description_en ? item.description_en : item.description }
  function discountedPrice(item: MenuItem) {
    if (!item.discount_percent || item.discount_percent <= 0) return null
    return item.price * (1 - item.discount_percent / 100)
  }

  useEffect(() => { setRestaurant(restaurant.slug) }, [restaurant.slug])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setNavVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  const allItems = categories.flatMap(c => c.menu_items ?? [])
  const filteredItems = allItems.filter(item => {
    const matchCat = selectedCat === 'all' || item.category_id === selectedCat
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch && item.is_available
  })
  const count = itemCount()
  const primary = restaurant.primary_color || '#f97316'
  const secondary = restaurant.secondary_color || '#ef4444'

  function scrollToMenu() {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Sticky Nav (appears after hero scrolls away) ── */}
      <AnimatePresence>
        {navVisible && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-lg"
          >
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
              {/* Mini logo */}
              <div className="flex items-center gap-2.5 shrink-0">
                {restaurant.logo_url ? (
                  <img src={restaurant.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                    style={{ backgroundColor: primary }}
                  >
                    {restaurant.name[0]}
                  </div>
                )}
                <span className="font-bold text-slate-800 text-sm hidden sm:block">{restaurant.name}</span>
              </div>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar platillos..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 bg-slate-50"
                  style={{ '--tw-ring-color': primary } as any}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Lang toggle */}
              <button
                onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}
                className="shrink-0 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                {lang === 'es' ? 'EN' : 'ES'}
              </button>

              {/* My account */}
              <Link
                href={`/r/${restaurant.slug}/account`}
                className="shrink-0 border border-slate-200 text-slate-600 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                title="My account"
              >
                <User className="w-4 h-4" />
              </Link>

              {/* Cart */}
              <motion.button
                onClick={openCart}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold shrink-0 shadow-md hover:brightness-110 transition-all"
                style={{ backgroundColor: primary }}
              >
                <ShoppingCart className="w-4 h-4 text-white" />
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  >
                    {count}
                  </motion.span>
                )}
                {count > 0 && <span className="hidden sm:inline">{t.myOrder}</span>}
              </motion.button>
            </div>

            {/* Category pills in sticky nav */}
            {categories.length > 0 && (
              <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedCat('all')}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedCat === 'all' ? 'text-white border-transparent' : 'text-slate-600 border-slate-200 bg-white'}`}
                  style={selectedCat === 'all' ? { backgroundColor: primary } : {}}
                >
                  Todo
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedCat === cat.id ? 'text-white border-transparent' : 'text-slate-600 border-slate-200 bg-white'}`}
                    style={selectedCat === cat.id ? { backgroundColor: primary } : {}}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <div ref={heroRef} className="relative h-[85vh] min-h-[540px] max-h-[800px] overflow-hidden flex flex-col">

        {/* Cover image or gradient */}
        <div className="absolute inset-0">
          {restaurant.cover_url ? (
            <>
              <img
                src={restaurant.cover_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to bottom, ${primary}55 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 100%)` }}
              />
            </>
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${primary}ff 0%, ${secondary}cc 60%, #1e1b4b 100%)` }}
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-white blur-[80px]" />
              </div>
            </div>
          )}
        </div>

        {/* Demo badge */}
        {restaurant.is_demo && (
          <div className="relative z-10 mx-auto mt-4 bg-yellow-400/20 border border-yellow-300/40 text-yellow-100 text-xs px-4 py-1.5 rounded-full backdrop-blur">
            🧪 Restaurante en modo demo
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-white text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-28 h-28 mx-auto rounded-3xl object-cover shadow-2xl ring-4 ring-white/20 mb-6"
              />
            ) : (
              <div
                className="w-28 h-28 mx-auto rounded-3xl flex items-center justify-center text-5xl font-black shadow-2xl ring-4 ring-white/20 mb-6 bg-white/20 backdrop-blur"
              >
                {restaurant.name[0]}
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-3 drop-shadow-lg"
          >
            {restaurant.name}
          </motion.h1>

          {restaurant.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-white/80 text-base md:text-lg max-w-md mx-auto mb-4 leading-relaxed"
            >
              {restaurant.description}
            </motion.p>
          )}

          {/* Quick info pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-8"
          >
            {isOpen !== null && (
              <span className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-semibold backdrop-blur ${isOpen ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'}`}>
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
                {isOpen ? t.open : t.closed}
              </span>
            )}
            {restaurant.address && (
              <span className="flex items-center gap-1.5 text-white/70 text-sm bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5" />
                {restaurant.city ?? restaurant.address}
              </span>
            )}
            {restaurant.pickup_enabled && (
              <span className="flex items-center gap-1.5 text-white/70 text-sm bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Para llevar
              </span>
            )}
            {restaurant.delivery_enabled && (
              <span className="flex items-center gap-1.5 text-white/70 text-sm bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
                <Bike className="w-3.5 h-3.5" />
                Domicilio
              </span>
            )}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            onClick={scrollToMenu}
            className="group flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">{t.viewMenu}</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.button>
        </div>

        {/* Cart FAB in hero */}
        <div className="absolute top-4 right-4 z-10">
          <motion.button
            onClick={openCart}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="relative flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-all"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
            {count > 0 ? `${t.myOrder} (${count})` : t.myOrder}
          </motion.button>
        </div>
      </div>

      {/* ── PROMOTIONS ── */}
      {promotions.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <PromotionBanners promotions={promotions} restaurant={restaurant} />
        </div>
      )}

      {/* ── MENU SECTION ── */}
      <div ref={menuRef} className="max-w-4xl mx-auto px-4 py-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: primary }} />
          <h2 className="text-2xl font-black text-slate-800">{t.menu}</h2>
          <span className="ml-auto text-sm text-slate-400">{allItems.filter(i => i.is_available).length} {t.dishes}</span>
          <button
            onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}
            className="border border-slate-200 text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            {lang === 'es' ? '🇺🇸 EN' : '🇲🇽 ES'}
          </button>
        </motion.div>

        {/* Search (non-sticky version) */}
        {!navVisible && (
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 bg-white shadow-sm"
              style={{ '--tw-ring-color': primary } as any}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        )}

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
            <button
              onClick={() => setSelectedCat('all')}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedCat === 'all' ? 'text-white shadow-md' : 'text-slate-600 bg-white border border-slate-200 hover:border-slate-300'}`}
              style={selectedCat === 'all' ? { backgroundColor: primary } : {}}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.all}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedCat === cat.id ? 'text-white shadow-md' : 'text-slate-600 bg-white border border-slate-200 hover:border-slate-300'}`}
                style={selectedCat === cat.id ? { backgroundColor: primary } : {}}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Items grid */}
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 text-slate-400"
            >
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="font-semibold text-slate-500 text-lg">
                {search ? t.notFound : t.noItems}
              </p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-3 text-sm underline" style={{ color: primary }}>
                  {t.clearSearch}
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item, i) => {
                const salePrice = discountedPrice(item)
                return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.05, 0.4) }}
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedItem(item)}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex cursor-pointer hover:shadow-lg hover:border-slate-200 transition-all"
                >
                  {/* Image */}
                  {item.image_url ? (
                    <div className="w-32 h-32 shrink-0 overflow-hidden relative">
                      <img
                        src={item.image_url}
                        alt={itemName(item)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {salePrice && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">
                          -{item.discount_percent}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-24 h-full shrink-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity relative"
                      style={{ backgroundColor: primary + '15' }}
                    >
                      <UtensilsCrossed className="w-8 h-8" style={{ color: primary }} />
                      {salePrice && (
                        <span className="absolute top-2 left-1 bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">
                          -{item.discount_percent}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors leading-snug">
                        {itemName(item)}
                      </h3>
                      {itemDesc(item) && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{itemDesc(item)}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {item.is_popular && (
                          <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-medium">
                            <Star className="w-3 h-3" /> {t.popular}
                          </span>
                        )}
                        {item.is_spicy && (
                          <span className="flex items-center gap-1 text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-medium">
                            <Flame className="w-3 h-3" /> {t.spicy}
                          </span>
                        )}
                        {(item.ingredients?.length ?? 0) > 0 && (
                          <span className="text-xs text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full">
                            {t.customizable}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        {salePrice ? (
                          <>
                            <p className="text-xs text-slate-400 line-through leading-none">{formatCurrency(item.price)}</p>
                            <p className="font-black text-red-500 text-lg leading-tight">{formatCurrency(salePrice)}</p>
                          </>
                        ) : (
                          <p className="font-black text-slate-800 text-lg">{formatCurrency(item.price)}</p>
                        )}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={e => { e.stopPropagation(); setSelectedItem(item) }}
                        className="text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:brightness-110 shadow-md transition-all"
                        style={{ backgroundColor: primary }}
                      >
                        {t.add}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── INFO / CONTACT SECTION ── */}
      {(restaurant.address || restaurant.phone || restaurant.whatsapp || restaurant.instagram || restaurant.facebook || restaurant.website) && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 pb-12"
        >
          <div
            className="rounded-3xl p-8 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primary}f0 0%, ${secondary}cc 100%)` }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-[-30%] right-[-10%] w-64 h-64 rounded-full bg-white blur-3xl" />
            </div>

            <div className="relative">
              <h3 className="text-xl font-black mb-5 text-white/90">Encuéntranos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {restaurant.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${restaurant.address} ${restaurant.city ?? ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 bg-white/10 hover:bg-white/20 rounded-2xl px-4 py-3.5 transition-colors group"
                  >
                    <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-white/60 mb-0.5">Dirección</p>
                      <p className="text-sm font-medium leading-snug">
                        {restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ''}
                      </p>
                    </div>
                  </a>
                )}

                {(restaurant.whatsapp || restaurant.phone) && (
                  <a
                    href={restaurant.whatsapp
                      ? `https://wa.me/${restaurant.whatsapp.replace(/\D/g, '')}`
                      : `tel:${restaurant.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-2xl px-4 py-3.5 transition-colors"
                  >
                    {restaurant.whatsapp ? (
                      <MessageCircle className="w-5 h-5 shrink-0" />
                    ) : (
                      <Phone className="w-5 h-5 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs text-white/60 mb-0.5">{restaurant.whatsapp ? 'WhatsApp' : 'Teléfono'}</p>
                      <p className="text-sm font-medium">{restaurant.whatsapp ?? restaurant.phone}</p>
                    </div>
                  </a>
                )}
              </div>

              {/* Social links */}
              {(restaurant.instagram || restaurant.facebook || restaurant.website) && (
                <div className="flex items-center gap-3 mt-4">
                  {restaurant.instagram && (
                    <a
                      href={`https://instagram.com/${restaurant.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                    >
                      <InstagramIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Instagram</span>
                    </a>
                  )}
                  {restaurant.facebook && (
                    <a
                      href={restaurant.facebook.startsWith('http') ? restaurant.facebook : `https://facebook.com/${restaurant.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                    >
                      <FacebookIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Facebook</span>
                    </a>
                  )}
                  {restaurant.website && (
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="hidden sm:inline">Sitio web</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── REVIEWS ── */}
      <div className="border-t border-slate-100 bg-white">
        <ReviewSection reviews={reviews} restaurant={restaurant} />
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 py-6 text-center text-slate-400 text-xs">
        <p>
          {restaurant.name} · Powered by{' '}
          <span className="font-bold text-slate-500">Ordermind</span>
        </p>
      </footer>

      {/* Modals */}
      {selectedItem && (
        <IngredientModal item={selectedItem} restaurant={restaurant} onClose={() => setSelectedItem(null)} />
      )}
      <CartDrawer restaurant={restaurant} />
    </div>
  )
}

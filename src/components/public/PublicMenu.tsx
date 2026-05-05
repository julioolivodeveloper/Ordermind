'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Phone, Globe, ShoppingCart,
  Search, Star, Flame, ChevronDown, Bike, UtensilsCrossed,
  MessageCircle, X, Sparkles, User, Box
} from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart-store'
import { IngredientModal } from './IngredientModal'
import { CartDrawer } from './CartDrawer'
import { ModelViewerModal } from './ModelViewerModal'
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
  const [item3D, setItem3D] = useState<MenuItem | null>(null)
  const [navVisible, setNavVisible] = useState(false)
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [heroUser, setHeroUser] = useState<{ name: string | null; email: string | null } | null>(null)
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
    fetch(`/api/public/${restaurant.slug}/me`)
      .then(r => r.json())
      .then(data => {
        if (data.userEmail) {
          setHeroUser({ name: data.customer?.name ?? null, email: data.userEmail })
        } else {
          setHeroUser({ name: null, email: null })
        }
      })
      .catch(() => setHeroUser({ name: null, email: null }))
  }, [restaurant.slug])

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
  const menuBg = restaurant.menu_bg_color || '#f8fafc'

  function scrollToMenu() {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: menuBg }}>

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

        {/* Login / Welcome button in hero */}
        {heroUser !== null && (
          <div className="absolute top-4 left-4 z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {heroUser.email ? (
                <Link
                  href={`/r/${restaurant.slug}/account`}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-all"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="max-w-[140px] truncate">
                    {heroUser.name ? `Bienvenido, ${heroUser.name}` : heroUser.email}
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/r/${restaurant.slug}/login`}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-all"
                >
                  <User className="w-4 h-4" />
                  Iniciar sesión
                </Link>
              )}
            </motion.div>
          </div>
        )}

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
      <div ref={menuRef} className="max-w-6xl mx-auto px-4 py-10">

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredItems.map((item, i) => {
                const salePrice = discountedPrice(item)
                const catName = categories.find(c => c.id === item.category_id)?.name
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    onClick={() => setSelectedItem(item)}
                    className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-slate-100 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: '4/3' }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={itemName(item)}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${primary}25, ${primary}08)` }}
                        >
                          <UtensilsCrossed className="w-10 h-10" style={{ color: primary + '60' }} />
                        </div>
                      )}

                      {/* Bottom gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                      {/* Discount badge */}
                      {salePrice && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg">
                          -{item.discount_percent}%
                        </div>
                      )}

                      {/* 3D badge */}
                      {item.model_url && (
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={e => { e.stopPropagation(); setItem3D(item) }}
                          className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-0.5 hover:bg-black/70 transition-colors"
                        >
                          <Box className="w-2.5 h-2.5" />
                          3D
                        </motion.button>
                      )}

                      {/* Popular ribbon */}
                      {item.is_popular && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-0.5 text-[10px] font-black text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full shadow">
                          <Star className="w-2.5 h-2.5" fill="currentColor" />
                          {t.popular}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-3 md:p-4">
                      {/* Top: grows to fill space */}
                      <div className="flex-1">
                        {catName && (
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 truncate" style={{ color: primary }}>
                            {catName}
                          </p>
                        )}
                        <h3 className="font-bold text-slate-800 text-sm md:text-[15px] leading-snug line-clamp-2">
                          {itemName(item)}
                        </h3>
                        {itemDesc(item) && (
                          <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed line-clamp-2 mt-1">
                            {itemDesc(item)}
                          </p>
                        )}
                        {item.is_spicy && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500 font-semibold mt-1.5">
                            <Flame className="w-2.5 h-2.5" /> {t.spicy}
                          </span>
                        )}
                      </div>

                      {/* Bottom: always pinned */}
                      <div className="mt-3 space-y-2.5">
                        {/* 3D button */}
                        {item.model_url && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={e => { e.stopPropagation(); setItem3D(item) }}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all hover:brightness-110"
                            style={{ backgroundColor: primary + '15', color: primary, borderColor: primary + '40' }}
                          >
                            <Box className="w-3.5 h-3.5" />
                            Ver en 3D / AR
                          </motion.button>
                        )}

                        {/* Price + Add */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                          <div>
                            {salePrice ? (
                              <>
                                <span className="text-[10px] text-slate-400 line-through block leading-none">
                                  {formatCurrency(item.price)}
                                </span>
                                <span className="font-black text-red-500 text-base md:text-lg leading-tight">
                                  {formatCurrency(salePrice)}
                                </span>
                              </>
                            ) : (
                              <span className="font-black text-slate-800 text-base md:text-lg">
                                {formatCurrency(item.price)}
                              </span>
                            )}
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={e => { e.stopPropagation(); setSelectedItem(item) }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg hover:brightness-110 transition-all shrink-0"
                            style={{ backgroundColor: primary }}
                          >
                            +
                          </motion.button>
                        </div>
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
      {item3D?.model_url && (
        <ModelViewerModal
          open={!!item3D}
          onClose={() => setItem3D(null)}
          itemName={itemName(item3D)}
          modelUrl={item3D.model_url}
          modelUsdzUrl={item3D.model_usdz_url}
          color={primary}
        />
      )}
      <CartDrawer restaurant={restaurant} />
    </div>
  )
}

'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import type { Promotion, Restaurant } from '@/types'

export function PromotionBanners({ promotions, restaurant }: { promotions: Promotion[]; restaurant: Restaurant }) {
  const [idx, setIdx] = useState(0)
  if (!promotions.length) return null

  const active = promotions[idx]
  const primary = restaurant.primary_color || '#f97316'

  return (
    <div className="max-w-4xl mx-auto px-4 pt-5 pb-2">
      <div className="relative rounded-2xl overflow-hidden shadow-md" style={{ background: `linear-gradient(135deg, ${primary}22, ${primary}11)`, border: `1px solid ${primary}33` }}>
        {active.image_url && (
          <div className="absolute inset-0">
            <img src={active.image_url} alt="" className="w-full h-full object-cover opacity-10" />
          </div>
        )}
        <div className="relative flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: primary }}>
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-800 text-sm">{active.title}</h3>
              {active.badge_text && (
                <span className="text-xs font-black text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: primary }}>
                  {active.badge_text}
                </span>
              )}
              {active.valid_until && (
                <span className="text-xs text-slate-400">
                  Hasta {new Date(active.valid_until).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            {active.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{active.description}</p>}
          </div>
          {promotions.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setIdx(i => (i - 1 + promotions.length) % promotions.length)} className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button onClick={() => setIdx(i => (i + 1) % promotions.length)} className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          )}
        </div>
        {promotions.length > 1 && (
          <div className="flex justify-center gap-1 pb-2">
            {promotions.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className="w-1.5 h-1.5 rounded-full transition-all" style={{ backgroundColor: i === idx ? primary : '#cbd5e1' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

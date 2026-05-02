'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react'
import type { Review } from '@/types'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
      ))}
    </div>
  )
}

export function ReviewsManager({ initial }: { initial: Review[] }) {
  const [items, setItems] = useState(initial)

  async function toggleVisibility(review: Review) {
    const res = await fetch('/api/dashboard/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: review.id, is_visible: !review.is_visible }),
    })
    if (res.ok) setItems(prev => prev.map(r => r.id === review.id ? { ...r, is_visible: !r.is_visible } : r))
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta reseña?')) return
    await fetch('/api/dashboard/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems(prev => prev.filter(r => r.id !== id))
  }

  const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Reseñas</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {items.length} reseña{items.length !== 1 ? 's' : ''}{items.length > 0 && ` · ${avg.toFixed(1)} promedio`}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-5 h-5 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <MessageSquare className="w-10 h-10 mx-auto mb-3" />
          <p className="text-sm">Aún no hay reseñas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              className={`bg-white/5 border rounded-2xl p-4 ${item.is_visible ? 'border-white/8' : 'border-white/4 opacity-50'}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {item.customer_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm">{item.customer_name}</p>
                    <Stars rating={item.rating} />
                    {!item.is_visible && (
                      <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full">Oculta</span>
                    )}
                  </div>
                  {item.comment && (
                    <p className="text-sm text-white/60 mt-1 leading-relaxed">{item.comment}</p>
                  )}
                  <p className="text-xs text-white/30 mt-1">
                    {new Date(item.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleVisibility(item)}
                    className="text-white/30 hover:text-white transition-colors"
                    title={item.is_visible ? 'Ocultar' : 'Mostrar'}
                  >
                    {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

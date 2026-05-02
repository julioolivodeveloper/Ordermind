'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import type { Review, Restaurant } from '@/types'

function Stars({ rating, interactive, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`w-5 h-5 transition-colors ${s <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
        </button>
      ))}
    </div>
  )
}

export function ReviewSection({ reviews: initial, restaurant, orderId }: { reviews: Review[]; restaurant: Restaurant; orderId?: string }) {
  const [reviews, setReviews] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customer_name: '', rating: 0, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0

  async function submit() {
    if (!form.customer_name || !form.rating) return
    setSubmitting(true)
    const res = await fetch(`/api/public/${restaurant.slug}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, order_id: orderId ?? null }),
    })
    if (res.ok) {
      const newReview = await res.json()
      setReviews(prev => [newReview, ...prev])
      setDone(true)
      setShowForm(false)
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800">Reseñas</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(avg)} />
              <span className="text-sm text-slate-500">{avg.toFixed(1)} · {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        {!done && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:brightness-110"
            style={{ backgroundColor: restaurant.primary_color }}
          >
            {showForm ? 'Cancelar' : '+ Dejar reseña'}
          </button>
        )}
        {done && <span className="text-sm text-green-600 font-medium">¡Gracias por tu reseña!</span>}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tu nombre</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="María García" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Calificación</label>
              <Stars rating={form.rating} interactive onRate={r => setForm(f => ({ ...f, rating: r }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comentario (opcional)</label>
              <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={3} placeholder="¿Qué te pareció?" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none" />
            </div>
            <button onClick={submit} disabled={submitting || !form.customer_name || !form.rating} className="w-full text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-all hover:brightness-110" style={{ backgroundColor: restaurant.primary_color }}>
              {submitting ? 'Enviando...' : 'Publicar reseña'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Star className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">Sé el primero en dejar una reseña</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{r.customer_name}</p>
                  <Stars rating={r.rating} />
                </div>
                <span className="text-xs text-slate-400 shrink-0">{new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.comment}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

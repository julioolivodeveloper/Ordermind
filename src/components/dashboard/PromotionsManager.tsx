'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Promotion } from '@/types'

const empty = { title: '', description: '', badge_text: '', valid_until: '', is_active: true }

export function PromotionsManager({ initial }: { initial: Promotion[] }) {
  const [items, setItems] = useState(initial)
  const [editing, setEditing] = useState<Partial<Promotion> | null>(null)
  const [saving, setSaving] = useState(false)

  const fieldClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"

  async function save() {
    if (!editing?.title) return
    setSaving(true)
    const method = editing.id ? 'PATCH' : 'POST'
    const res = await fetch('/api/dashboard/promotions', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    if (res.ok) {
      const saved = await res.json()
      setItems(prev => editing.id ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev])
      setEditing(null)
    }
    setSaving(false)
  }

  async function toggle(item: Promotion) {
    const res = await fetch('/api/dashboard/promotions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, is_active: !item.is_active }) })
    if (res.ok) setItems(prev => prev.map(p => p.id === item.id ? { ...p, is_active: !p.is_active } : p))
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta promoción?')) return
    await fetch('/api/dashboard/promotions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Promociones</h2>
          <p className="text-white/40 text-sm mt-0.5">Aparecen al inicio del menú público</p>
        </div>
        <button onClick={() => setEditing(empty)} className="flex items-center gap-2 bg-[#a3e635] hover:bg-lime-400 text-black px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white/8 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white">{editing.id ? 'Editar' : 'Nueva'} promoción</h3>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Título *</label>
              <input value={editing.title ?? ''} onChange={e => setEditing(f => ({ ...f!, title: e.target.value }))} placeholder="2x1 en hamburguesas" className={fieldClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Badge (ej: -20%)</label>
                <input value={editing.badge_text ?? ''} onChange={e => setEditing(f => ({ ...f!, badge_text: e.target.value }))} placeholder="-20%" className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Válido hasta</label>
                <input type="date" value={editing.valid_until ? editing.valid_until.slice(0, 10) : ''} onChange={e => setEditing(f => ({ ...f!, valid_until: e.target.value }))} className={fieldClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Descripción</label>
              <textarea value={editing.description ?? ''} onChange={e => setEditing(f => ({ ...f!, description: e.target.value }))} rows={2} placeholder="Detalles de la promoción..." className={`${fieldClass} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving || !editing.title} className="bg-[#a3e635] hover:bg-lime-400 disabled:opacity-50 text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(null)} className="text-white/50 hover:text-white px-4 py-2.5 text-sm transition-colors">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <Tag className="w-10 h-10 mx-auto mb-3" />
          <p className="text-sm">No hay promociones. Crea la primera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <motion.div key={item.id} layout className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-xl flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-[#a3e635]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  {item.badge_text && <span className="text-xs bg-[#a3e635]/20 text-[#a3e635] px-2 py-0.5 rounded-full font-bold">{item.badge_text}</span>}
                  {!item.is_active && <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full">Inactiva</span>}
                </div>
                {item.description && <p className="text-xs text-white/40 mt-0.5 truncate">{item.description}</p>}
                {item.valid_until && <p className="text-xs text-white/30 mt-0.5">Hasta {new Date(item.valid_until).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggle(item)} className="text-white/30 hover:text-[#a3e635] transition-colors">
                  {item.is_active ? <ToggleRight className="w-5 h-5 text-[#a3e635]" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => setEditing(item)} className="text-white/30 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(item.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

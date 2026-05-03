'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight, Copy, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Coupon {
  id: string; restaurant_id: string; code: string; type: 'percent' | 'fixed'
  amount: number; min_order: number; max_uses: number | null; times_used: number
  is_active: boolean; expires_at: string | null; created_at: string
}

interface CouponForm {
  id?: string; code: string; type: 'percent' | 'fixed'; amount: string
  min_order: string; max_uses: string; expires_at: string; is_active: boolean
}
const empty: CouponForm = { code: '', type: 'percent', amount: '', min_order: '', max_uses: '', expires_at: '', is_active: true }

export function CouponsManager({ initial }: { initial: Coupon[] }) {
  const [items, setItems] = useState(initial)
  const [editing, setEditing] = useState<CouponForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fieldClass = "w-full border border-white/10 bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#a3e635]/50"

  async function save() {
    if (!editing?.code || !editing?.amount) return
    setSaving(true)
    const method = editing.id ? 'PATCH' : 'POST'
    const body = { ...editing, amount: parseFloat(editing.amount), min_order: parseFloat(editing.min_order || '0'), max_uses: editing.max_uses ? parseInt(editing.max_uses) : null }
    const res = await fetch('/api/dashboard/coupons', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const saved = await res.json()
      setItems(prev => editing.id ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev])
      setEditing(null)
    }
    setSaving(false)
  }

  async function toggle(item: Coupon) {
    const res = await fetch('/api/dashboard/coupons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, is_active: !item.is_active }) })
    if (res.ok) setItems(prev => prev.map(c => c.id === item.id ? { ...c, is_active: !c.is_active } : c))
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este cupón?')) return
    await fetch('/api/dashboard/coupons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(c => c.id !== id))
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Cupones de descuento</h2>
          <p className="text-white/40 text-sm mt-0.5">Los clientes los ingresan en el checkout</p>
        </div>
        <button onClick={() => setEditing(empty)} className="flex items-center gap-2 bg-[#a3e635] hover:bg-lime-400 text-black px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white">{(editing as any).id ? 'Editar' : 'Nuevo'} cupón</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Código *</label>
                <input value={editing.code} onChange={e => setEditing(f => ({ ...f!, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Type</label>
                <select value={editing.type} onChange={e => setEditing(f => ({ ...f!, type: e.target.value as 'percent' | 'fixed' }))} className={fieldClass}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">{editing.type === 'percent' ? 'Percentage (%)' : 'Discount ($)'} *</label>
                <input type="number" value={editing.amount} onChange={e => setEditing(f => ({ ...f!, amount: e.target.value }))} placeholder={editing.type === 'percent' ? '20' : '5.00'} min="0" step={editing.type === 'percent' ? '1' : '0.01'} className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Minimum order ($)</label>
                <input type="number" value={editing.min_order} onChange={e => setEditing(f => ({ ...f!, min_order: e.target.value }))} placeholder="0" min="0" step="0.01" className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Max uses</label>
                <input type="number" value={editing.max_uses} onChange={e => setEditing(f => ({ ...f!, max_uses: e.target.value }))} placeholder="Unlimited" min="1" className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Expires on</label>
                <input type="date" value={editing.expires_at ? editing.expires_at.slice(0, 10) : ''} onChange={e => setEditing(f => ({ ...f!, expires_at: e.target.value }))} className={fieldClass} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={save} disabled={saving || !editing.code || !editing.amount} className="bg-[#a3e635] hover:bg-lime-400 disabled:opacity-50 text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(null)} className="text-white/40 hover:text-white px-4 py-2.5 text-sm transition-colors">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <Tag className="w-10 h-10 mx-auto mb-3" />
          <p className="text-sm">No hay cupones. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const expired = item.expires_at && new Date(item.expires_at) < new Date()
            return (
              <motion.div key={item.id} layout className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-xl flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5 text-[#a3e635]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => copyCode(item.code)} className="flex items-center gap-1 font-mono font-bold text-white text-sm bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded-lg transition-colors">
                      {item.code}
                      {copied === item.code ? <Check className="w-3 h-3 text-[#a3e635]" /> : <Copy className="w-3 h-3 text-white/40" />}
                    </button>
                    <span className="text-xs bg-[#a3e635]/20 text-[#a3e635] px-2 py-0.5 rounded-full font-bold">
                      {item.type === 'percent' ? `-${item.amount}%` : `-${formatCurrency(item.amount)}`}
                    </span>
                    {!item.is_active && <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full">Inactivo</span>}
                    {expired && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expirado</span>}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {item.min_order > 0 && `Mín. ${formatCurrency(item.min_order)} · `}
                    {item.times_used} usos{item.max_uses ? ` / ${item.max_uses}` : ''}
                    {item.expires_at && ` · hasta ${new Date(item.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(item)} className="text-white/30 hover:text-[#a3e635] transition-colors">
                    {item.is_active ? <ToggleRight className="w-5 h-5 text-[#a3e635]" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => setEditing({ id: item.id, code: item.code, type: item.type, amount: String(item.amount), min_order: String(item.min_order), max_uses: item.max_uses ? String(item.max_uses) : '', expires_at: item.expires_at ?? '', is_active: item.is_active })} className="text-white/30 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(item.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

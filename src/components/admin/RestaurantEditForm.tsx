'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import type { Restaurant, Plan } from '@/types'

interface Props {
  restaurant: Restaurant
  plans: Plan[]
  owner: { id: string; full_name: string | null; is_active: boolean } | null
  stats: { totalOrders: number; todayRevenue: number }
}

const statusLabel: Record<string, string> = {
  active: 'Activo', demo: 'Demo', suspended: 'Suspendido', pending: 'Pendiente',
}

export function RestaurantEditForm({ restaurant, plans, owner, stats }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: restaurant.name,
    status: restaurant.status,
    is_demo: restaurant.is_demo,
    plan_id: restaurant.plan_id ?? '',
    primary_color: restaurant.primary_color,
    phone: restaurant.phone ?? '',
    email: restaurant.email ?? '',
    address: restaurant.address ?? '',
    city: restaurant.city ?? '',
    notes: restaurant.notes ?? '',
    custom_domain: restaurant.custom_domain ?? '',
    delivery_fee: restaurant.delivery_fee,
    tax_rate: restaurant.tax_rate,
    pickup_enabled: restaurant.pickup_enabled,
    delivery_enabled: restaurant.delivery_enabled,
  })
  const [saving, setSaving] = useState(false)
  const [showOwnerForm, setShowOwnerForm] = useState(false)
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '' })
  const [creatingOwner, setCreatingOwner] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast('Cambios guardados')
      router.refresh()
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(status: string) {
    setForm(f => ({ ...f, status: status as any, is_demo: status === 'demo' }))
  }

  async function handleCreateOwner() {
    setCreatingOwner(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ownerForm,
          restaurant_id: restaurant.id,
          role: 'restaurant_owner',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast('Cuenta del dueño creada')
      setShowOwnerForm(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message ?? 'Error al crear cuenta', 'error')
    } finally {
      setCreatingOwner(false)
    }
  }

  function f(val: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [val]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))
  }

  const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all'

  return (
    <div className="p-8 max-w-3xl bg-[#111111] min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
        <Badge status={restaurant.status} label={statusLabel[restaurant.status]} />
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-2xl border border-white/8 p-4">
          <p className="text-xs text-white/40">Total pedidos</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalOrders}</p>
        </div>
        <div className="bg-[#a3e635]/10 rounded-2xl border border-[#a3e635]/20 p-4">
          <p className="text-xs text-white/40">Ingresos hoy</p>
          <p className="text-2xl font-bold text-[#a3e635] mt-1">{formatCurrency(stats.todayRevenue)}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Info general */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white border-b border-white/8 pb-3">Configuración</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Nombre</label>
              <input value={form.name} onChange={f('name')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Estado</label>
              <select value={form.status} onChange={e => handleStatusChange(e.target.value)} className={inp + ' bg-[#1a1a1a]'}>
                <option value="active">Activo</option>
                <option value="demo">Demo</option>
                <option value="suspended">Suspendido</option>
                <option value="pending">Pendiente de pago</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Plan</label>
              <select value={form.plan_id} onChange={f('plan_id')} className={inp + ' bg-[#1a1a1a]'}>
                <option value="">Sin plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}/mes</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Teléfono</label>
              <input value={form.phone} onChange={f('phone')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Correo</label>
              <input type="email" value={form.email} onChange={f('email')} className={inp} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Dirección</label>
              <input value={form.address} onChange={f('address')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Ciudad</label>
              <input value={form.city} onChange={f('city')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Color principal</label>
              <input type="color" value={form.primary_color} onChange={f('primary_color')} className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-2 cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Tarifa delivery ($)</label>
              <input type="number" value={form.delivery_fee} onChange={f('delivery_fee')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Impuesto (%)</label>
              <input type="number" step="0.01" value={form.tax_rate} onChange={f('tax_rate')} className={inp} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Dominio personalizado</label>
              <input value={form.custom_domain} onChange={f('custom_domain')} placeholder="menu.mirestaurante.com" className={inp} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Notas internas</label>
              <textarea value={form.notes} onChange={f('notes')} rows={2} className={inp + ' resize-none'} />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-[#a3e635] hover:brightness-110 disabled:opacity-60 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Owner */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
          <h2 className="font-semibold text-white border-b border-white/8 pb-3 mb-4">Cuenta del Dueño</h2>
          {owner ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-full flex items-center justify-center text-[#a3e635] font-bold text-sm">
                {(owner.full_name ?? 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-white text-sm">{owner.full_name}</p>
                <p className="text-white/40 text-xs">{owner.is_active ? 'Cuenta activa' : 'Cuenta suspendida'}</p>
              </div>
            </div>
          ) : (
            <div>
              {!showOwnerForm ? (
                <button onClick={() => setShowOwnerForm(true)} className="text-[#a3e635] text-sm font-medium hover:underline">
                  + Crear cuenta del dueño
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={ownerForm.name} onChange={e => setOwnerForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" className={inp} />
                    <input value={ownerForm.email} onChange={e => setOwnerForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" type="email" className={inp} />
                    <input value={ownerForm.password} onChange={e => setOwnerForm(f => ({ ...f, password: e.target.value }))} placeholder="Contraseña temporal" type="text" className={'col-span-2 ' + inp} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowOwnerForm(false)} className="border border-white/10 text-white/60 px-4 py-2 rounded-xl text-sm hover:bg-white/5 transition-colors">Cancelar</button>
                    <button onClick={handleCreateOwner} disabled={creatingOwner} className="bg-[#a3e635] text-black font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-60">
                      {creatingOwner ? 'Creando...' : 'Crear cuenta'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

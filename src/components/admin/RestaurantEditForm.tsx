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

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 mb-4 transition-colors">
        ← Regresar
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{restaurant.name}</h1>
            <Badge status={restaurant.status} label={statusLabel[restaurant.status]} />
          </div>
          <p className="text-slate-400 text-sm mt-1">
            /r/{restaurant.slug} · Creado {new Date(restaurant.created_at).toLocaleDateString('es-MX')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/menu"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Gestionar menú
          </a>
          <a
            href={`/r/${restaurant.slug}`}
            target="_blank"
            className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
          >
            Ver menú ↗
          </a>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">Total pedidos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalOrders}</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
          <p className="text-xs text-slate-500">Ingresos hoy</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(stats.todayRevenue)}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Info general */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Configuración</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input value={form.name} onChange={f('name')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select value={form.status} onChange={e => handleStatusChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="active">Activo</option>
                <option value="demo">Demo</option>
                <option value="suspended">Suspendido</option>
                <option value="pending">Pendiente de pago</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
              <select value={form.plan_id} onChange={f('plan_id')} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Sin plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}/mes</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input value={form.phone} onChange={f('phone')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
              <input type="email" value={form.email} onChange={f('email')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input value={form.address} onChange={f('address')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
              <input value={form.city} onChange={f('city')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color principal</label>
              <input type="color" value={form.primary_color} onChange={f('primary_color')} className="w-full h-10 border border-slate-200 rounded-xl px-2 cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarifa delivery ($)</label>
              <input type="number" value={form.delivery_fee} onChange={f('delivery_fee')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Impuesto (%)</label>
              <input type="number" step="0.01" value={form.tax_rate} onChange={f('tax_rate')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Dominio personalizado</label>
              <input value={form.custom_domain} onChange={f('custom_domain')} placeholder="menu.mirestaurante.com" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas internas</label>
              <textarea value={form.notes} onChange={f('notes')} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Owner */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Cuenta del Dueño</h2>
          {owner ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
                {(owner.full_name ?? 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">{owner.full_name}</p>
                <p className="text-slate-400 text-xs">{owner.is_active ? 'Cuenta activa' : 'Cuenta suspendida'}</p>
              </div>
            </div>
          ) : (
            <div>
              {!showOwnerForm ? (
                <button onClick={() => setShowOwnerForm(true)} className="text-indigo-600 text-sm font-medium hover:underline">
                  + Crear cuenta del dueño
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={ownerForm.name} onChange={e => setOwnerForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input value={ownerForm.email} onChange={e => setOwnerForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" type="email" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input value={ownerForm.password} onChange={e => setOwnerForm(f => ({ ...f, password: e.target.value }))} placeholder="Contraseña temporal" type="text" className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowOwnerForm(false)} className="border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm">Cancelar</button>
                    <button onClick={handleCreateOwner} disabled={creatingOwner} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-60">
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

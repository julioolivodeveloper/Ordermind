'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import type { Restaurant } from '@/types'

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: restaurant.name,
    description: restaurant.description ?? '',
    phone: restaurant.phone ?? '',
    email: restaurant.email ?? '',
    address: restaurant.address ?? '',
    city: restaurant.city ?? '',
    whatsapp: restaurant.whatsapp ?? '',
    instagram: restaurant.instagram ?? '',
    facebook: restaurant.facebook ?? '',
    primary_color: restaurant.primary_color,
    language: restaurant.language,
    currency: restaurant.currency,
    timezone: restaurant.timezone,
    pickup_enabled: restaurant.pickup_enabled,
    delivery_enabled: restaurant.delivery_enabled,
    dine_in_enabled: restaurant.dine_in_enabled,
    delivery_fee: restaurant.delivery_fee,
    min_order_amount: restaurant.min_order_amount,
    tax_rate: restaurant.tax_rate,
    tax_name: restaurant.tax_name,
    custom_domain: restaurant.custom_domain ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'general' | 'operations' | 'payments'>('general')

  function f(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/dashboard/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast('¡Configuración guardada!')
      router.refresh()
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'operations', label: 'Operaciones' },
    { id: 'payments', label: 'Pagos e impuestos' },
  ] as const

  const fieldClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        {tab === 'general' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del restaurante</label>
              <input value={form.name} onChange={f('name')} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={f('description')} rows={2} className={`${fieldClass} resize-none`} placeholder="Breve descripción de tu restaurante..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input value={form.phone} onChange={f('phone')} className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input value={form.whatsapp} onChange={f('whatsapp')} placeholder="+52614..." className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo de contacto</label>
                <input type="email" value={form.email} onChange={f('email')} className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                <input value={form.instagram} onChange={f('instagram')} placeholder="@mirestaurante" className={fieldClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input value={form.address} onChange={f('address')} className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                <input value={form.city} onChange={f('city')} className={fieldClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color principal</label>
                <input type="color" value={form.primary_color} onChange={f('primary_color')} className="w-full h-10 border border-slate-200 rounded-xl px-2 cursor-pointer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
                <select value={form.language} onChange={f('language')} className={fieldClass}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dominio personalizado</label>
              <input value={form.custom_domain} onChange={f('custom_domain')} placeholder="menu.mirestaurante.com" className={fieldClass} />
              <p className="text-xs text-slate-400 mt-1">Apunta tu dominio a nuestros servidores para activarlo</p>
            </div>
          </>
        )}

        {tab === 'operations' && (
          <>
            <div className="space-y-3">
              <h3 className="font-medium text-slate-700">Tipos de pedido</h3>
              {[
                ['pickup_enabled', '🏪 Recoger en restaurante'],
                ['delivery_enabled', '🚚 Delivery a domicilio'],
                ['dine_in_enabled', '🍽️ Comer en mesa'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={f(key as keyof typeof form)}
                    className="rounded w-4 h-4 text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
            {form.delivery_enabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tarifa de delivery ($)</label>
                  <input type="number" step="0.50" value={form.delivery_fee} onChange={f('delivery_fee')} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monto mínimo ($)</label>
                  <input type="number" step="0.50" value={form.min_order_amount} onChange={f('min_order_amount')} className={fieldClass} />
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'payments' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tasa de impuesto (%)</label>
                <input type="number" step="0.01" value={form.tax_rate} onChange={f('tax_rate')} placeholder="0.16" className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del impuesto</label>
                <input value={form.tax_name} onChange={f('tax_name')} placeholder="IVA" className={fieldClass} />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="font-medium text-slate-700 text-sm mb-2">Stripe</h4>
              <p className="text-xs text-slate-500 mb-3">Conecta tu cuenta de Stripe para aceptar pagos con tarjeta en línea</p>
              <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Conectar Stripe
              </button>
            </div>
          </>
        )}

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

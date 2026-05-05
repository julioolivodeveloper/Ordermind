'use client'
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import type { Restaurant } from '@/types'

const PRESET_COLORS = [
  '#f97316','#ef4444','#ec4899','#a855f7','#6366f1',
  '#3b82f6','#06b6d4','#10b981','#84cc16','#eab308',
  '#64748b','#1f2937',
]

function ColorSwatch({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-11 rounded-xl border border-slate-200 flex items-center gap-3 px-3 hover:border-slate-300 transition-colors bg-white"
      >
        <div className="w-7 h-7 rounded-lg shadow-sm border border-white/50" style={{ backgroundColor: value }} />
        <span className="text-sm font-mono text-slate-600 uppercase">{value}</span>
        <span className="ml-auto text-slate-400 text-xs">▼</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-full min-w-[240px]"
          >
            <p className="text-xs font-medium text-slate-500 mb-3">Colores predefinidos</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false) }}
                  className={`w-8 h-8 rounded-lg shadow-sm hover:scale-110 transition-transform border-2 ${value === c ? 'border-indigo-500' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-slate-500 mb-2">Color personalizado</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-1"
              />
              <input
                type="text"
                value={value}
                onChange={e => e.target.value.match(/^#[0-9a-fA-F]{0,6}$/) && onChange(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✓</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ImageUploader({
  label, hint, current, bucket, path, onUploaded, aspect,
}: {
  label: string; hint: string; current: string; bucket: string; path: string;
  onUploaded: (url: string) => void; aspect: 'square' | 'wide'
}) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fullPath = `${path}.${ext}`
      const { error } = await supabase.storage.from(bucket).upload(fullPath, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath)
      onUploaded(data.publicUrl + `?t=${Date.now()}`)
    } catch {
      toast('Error al subir imagen', 'error')
    } finally {
      setUploading(false)
    }
  }, [path, bucket, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, disabled: uploading,
  })

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      {current ? (
        <div className="relative group mb-2">
          <img
            src={current}
            alt=""
            className={`w-full object-cover rounded-xl border border-slate-200 ${aspect === 'square' ? 'h-32 w-32' : 'h-40'}`}
          />
          <div
            {...getRootProps()}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center cursor-pointer"
          >
            <input {...getInputProps()} />
            <span className="text-white text-sm font-medium">📷 Cambiar imagen</span>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-3xl mb-2">{isDragActive ? '⬇️' : '📷'}</p>
          <p className="text-sm font-medium text-slate-600">
            {uploading ? 'Subiendo...' : isDragActive ? 'Suelta aquí' : 'Arrastra o haz clic'}
          </p>
          <p className="text-xs text-slate-400 mt-1">{hint}</p>
        </div>
      )}
      {uploading && (
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-pulse w-2/3" />
        </div>
      )}
    </div>
  )
}

const DAYS = [
  { key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' }, { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' }, { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sábado' }, { key: 'sun', label: 'Domingo' },
]

function defaultHours() {
  return Object.fromEntries(DAYS.map(d => [d.key, { enabled: d.key !== 'sun', open: '09:00', close: '22:00' }]))
}

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const { toast } = useToast()
  const [zipInput, setZipInput] = useState('')
  const [zipCodes, setZipCodes] = useState<string[]>(restaurant.delivery_zip_codes ?? [])
  const [hours, setHours] = useState<Record<string, { enabled: boolean; open: string; close: string }>>(
    (restaurant.business_hours && Object.keys(restaurant.business_hours).length > 0)
      ? restaurant.business_hours as any
      : defaultHours()
  )

  function updateHour(day: string, field: 'enabled' | 'open' | 'close', value: any) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  function addZip() {
    const z = zipInput.trim()
    if (!z || zipCodes.includes(z)) { setZipInput(''); return }
    setZipCodes(prev => [...prev, z])
    setZipInput('')
  }

  function removeZip(z: string) {
    setZipCodes(prev => prev.filter(c => c !== z))
  }

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
    secondary_color: restaurant.secondary_color ?? '#1f2937',
    menu_bg_color: restaurant.menu_bg_color ?? '#f8fafc',
    logo_url: restaurant.logo_url ?? '',
    cover_url: restaurant.cover_url ?? '',
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
    loyalty_enabled: restaurant.loyalty_enabled ?? false,
    loyalty_points_per_dollar: restaurant.loyalty_points_per_dollar ?? 10,
    loyalty_redemption_points: restaurant.loyalty_redemption_points ?? 100,
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'brand' | 'general' | 'operations' | 'hours' | 'loyalty' | 'payments'>('brand')

  function f(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, delivery_zip_codes: zipCodes, business_hours: hours }),
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
    { id: 'brand', label: '🎨 Marca' },
    { id: 'general', label: '📋 General' },
    { id: 'operations', label: '⚙️ Operaciones' },
    { id: 'hours', label: '🕐 Horarios' },
    { id: 'loyalty', label: '⭐ Lealtad' },
    { id: 'payments', label: '💳 Pagos' },
  ] as const

  const fieldClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"

  return (
    <div className="max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        {tab === 'brand' && (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <ImageUploader
                  label="Logo del restaurante"
                  hint="PNG o JPG, 1:1, máx 2MB"
                  current={form.logo_url}
                  bucket="menu-images"
                  path={`restaurants/${restaurant.id}/logo`}
                  aspect="square"
                  onUploaded={url => setForm(f => ({ ...f, logo_url: url }))}
                />
              </div>
              <div className="flex flex-col gap-4">
                <ColorSwatch
                  label="Color de botones"
                  value={form.primary_color}
                  onChange={c => setForm(f => ({ ...f, primary_color: c }))}
                />
                <ColorSwatch
                  label="Color secundario (encabezado)"
                  value={form.secondary_color}
                  onChange={c => setForm(f => ({ ...f, secondary_color: c }))}
                />
                <ColorSwatch
                  label="Fondo del menú"
                  value={form.menu_bg_color}
                  onChange={c => setForm(f => ({ ...f, menu_bg_color: c }))}
                />
              </div>
            </div>

            <div>
              <ImageUploader
                label="Imagen de portada"
                hint="JPG o PNG horizontal, recomendado 1200x400px"
                current={form.cover_url}
                bucket="menu-images"
                path={`restaurants/${restaurant.id}/cover`}
                aspect="wide"
                onUploaded={url => setForm(f => ({ ...f, cover_url: url }))}
              />
            </div>

            {/* Live preview */}
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <p className="text-xs font-medium text-slate-500 px-4 py-2 bg-slate-50 border-b border-slate-100">
                Vista previa
              </p>
              <div
                className="p-6 flex items-center gap-4"
                style={{ background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})` }}
              >
                {form.logo_url ? (
                  <img src={form.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/30" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xl">
                    {form.name[0]}
                  </div>
                )}
                <div>
                  <p className="text-white font-black text-lg">{form.name}</p>
                  {form.description && <p className="text-white/70 text-sm">{form.description}</p>}
                </div>
              </div>
              <div className="p-4 flex items-center gap-3" style={{ backgroundColor: form.menu_bg_color }}>
                <div className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow" style={{ backgroundColor: form.primary_color }}>
                  Ordenar
                </div>
                <div className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow" style={{ backgroundColor: form.primary_color }}>
                  Ver menú
                </div>
                <p className="text-xs ml-auto opacity-50">Fondo del menú</p>
              </div>
            </div>
          </>
        )}

        {tab === 'general' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del restaurante</label>
              <input value={form.name} onChange={f('name')} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={f('description')} rows={3} placeholder="Breve descripción de tu restaurante..." className={`${fieldClass} resize-none`} />
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
                <input type="email" value={form.email} onChange={f('email')} className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                <input value={form.instagram} onChange={f('instagram')} placeholder="@mirestaurante" className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input value={form.address} onChange={f('address')} className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                <input value={form.city} onChange={f('city')} className={fieldClass} />
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
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700 mb-3">Tipos de pedido habilitados</h3>
              {([
                ['pickup_enabled', '🏪', 'Recoger en restaurante', 'Los clientes recogen su pedido'],
                ['delivery_enabled', '🚚', 'Delivery a domicilio', 'Envío a la dirección del cliente'],
                ['dine_in_enabled', '🍽️', 'Comer en mesa', 'Pedidos desde la mesa'],
              ] as const).map(([key, icon, title, desc]) => (
                <label key={key} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={f(key as keyof typeof form)}
                    className="rounded w-4 h-4 text-indigo-600 accent-indigo-600"
                  />
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {form.delivery_enabled && (
              <>
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

                {/* Zonas de entrega por ZIP */}
                <div className="pt-2">
                  <h3 className="font-semibold text-slate-700 mb-1">Zonas de entrega (Zip Codes)</h3>
                  <p className="text-xs text-slate-400 mb-3">Solo se aceptan pedidos a domicilio en estos códigos postales. Si no agregas ninguno, se acepta cualquier dirección.</p>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={zipInput}
                      onChange={e => setZipInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addZip())}
                      placeholder="Ej: 79900"
                      maxLength={10}
                      className={fieldClass + ' flex-1'}
                    />
                    <button
                      type="button"
                      onClick={addZip}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
                    >
                      + Agregar
                    </button>
                  </div>

                  {zipCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {zipCodes.map(z => (
                        <span key={z} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
                          📍 {z}
                          <button type="button" onClick={() => removeZip(z)} className="text-indigo-400 hover:text-red-500 transition-colors font-bold leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin zonas configuradas — delivery disponible en cualquier dirección.</p>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'hours' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Configura los horarios en que tu restaurante acepta pedidos.</p>
            {DAYS.map(day => (
              <div key={day.key} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-28 shrink-0">
                  <input type="checkbox" checked={hours[day.key]?.enabled ?? false} onChange={e => updateHour(day.key, 'enabled', e.target.checked)} className="rounded accent-indigo-600 w-4 h-4" />
                  <span className="text-sm font-medium text-slate-700">{day.label}</span>
                </label>
                {hours[day.key]?.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={hours[day.key]?.open ?? '09:00'} onChange={e => updateHour(day.key, 'open', e.target.value)} className={fieldClass + ' flex-1'} />
                    <span className="text-slate-400 text-sm">—</span>
                    <input type="time" value={hours[day.key]?.close ?? '22:00'} onChange={e => updateHour(day.key, 'close', e.target.value)} className={fieldClass + ' flex-1'} />
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">Cerrado</span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'loyalty' && (
          <div className="space-y-5">
            <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-colors">
              <input type="checkbox" checked={form.loyalty_enabled} onChange={f('loyalty_enabled')} className="rounded w-4 h-4 accent-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">⭐ Programa de lealtad activo</p>
                <p className="text-xs text-slate-500">Los clientes acumulan puntos al hacer pedidos y los canjean por descuentos.</p>
              </div>
            </label>
            {form.loyalty_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Puntos por cada $1 gastado</label>
                  <input type="number" min="1" value={form.loyalty_points_per_dollar} onChange={f('loyalty_points_per_dollar')} className={fieldClass} />
                  <p className="text-xs text-slate-400 mt-1">Ej: 10 = el cliente gana 10 pts por cada dólar</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Puntos para canjear $1</label>
                  <input type="number" min="1" value={form.loyalty_redemption_points} onChange={f('loyalty_redemption_points')} className={fieldClass} />
                  <p className="text-xs text-slate-400 mt-1">Ej: 100 = 100 puntos = $1 de descuento</p>
                </div>
              </div>
            )}
          </div>
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
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">S</div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Stripe</h4>
                  <p className="text-xs text-slate-500">Pagos con tarjeta en línea</p>
                </div>
              </div>
              <button className="bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Conectar Stripe →
              </button>
            </div>
          </>
        )}

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-500/20"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

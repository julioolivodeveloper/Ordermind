'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Check, X, Eye, EyeOff, ExternalLink, AlertCircle, Unplug } from 'lucide-react'

interface Props {
  stripeConnected: boolean
  stripePublishableKey?: string
}

export function StripeConnect({ stripeConnected, stripePublishableKey }: Props) {
  const [connected, setConnected] = useState(stripeConnected)
  const [pubKey, setPubKey] = useState(stripePublishableKey ?? '')
  const [form, setForm] = useState({ publishableKey: '', secretKey: '' })
  const [showSecret, setShowSecret] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'test' | 'live' | null>(
    pubKey.startsWith('pk_test') ? 'test' : pubKey.startsWith('pk_live') ? 'live' : null
  )

  async function connect() {
    if (!form.publishableKey || !form.secretKey) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/stripe/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishableKey: form.publishableKey.trim(), secretKey: form.secretKey.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setConnected(true)
      setPubKey(form.publishableKey.trim())
      setMode(data.mode)
      setShowForm(false)
      setForm({ publishableKey: '', secretKey: '' })
    }
    setSaving(false)
  }

  async function disconnect() {
    if (!confirm('¿Desconectar Stripe? Los pagos con tarjeta dejarán de funcionar.')) return
    await fetch('/api/stripe/connect', { method: 'DELETE' })
    setConnected(false)
    setPubKey('')
    setMode(null)
  }

  const fieldClass = "w-full border border-white/10 bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#a3e635]/50"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Pagos con Stripe</h2>
          <p className="text-white/40 text-sm mt-0.5">Acepta tarjetas de crédito y débito directamente</p>
        </div>
        {connected && (
          <button onClick={disconnect} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors">
            <Unplug className="w-4 h-4" />
            Desconectar
          </button>
        )}
      </div>

      {/* Status card */}
      <div className={`rounded-2xl border p-5 ${connected ? 'bg-[#a3e635]/5 border-[#a3e635]/20' : 'bg-white/5 border-white/10'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-[#a3e635]/20' : 'bg-white/10'}`}>
            <CreditCard className={`w-5 h-5 ${connected ? 'text-[#a3e635]' : 'text-white/40'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white text-sm">
                {connected ? 'Stripe conectado' : 'Stripe no conectado'}
              </p>
              {connected && mode && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${mode === 'test' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-green-400/20 text-green-300'}`}>
                  {mode === 'test' ? 'TEST' : 'LIVE'}
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs mt-0.5">
              {connected
                ? `pk ...${pubKey.slice(-8)}`
                : 'Conecta tu cuenta de Stripe para aceptar pagos con tarjeta'}
            </p>
          </div>
          {connected
            ? <Check className="w-5 h-5 text-[#a3e635] shrink-0" />
            : <X className="w-5 h-5 text-white/20 shrink-0" />}
        </div>
      </div>

      {/* Connect button / Form */}
      {!connected && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#a3e635] hover:bg-lime-400 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <CreditCard className="w-4 h-4" />
          Conectar Stripe
        </button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5"
          >
            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">¿Dónde encuentro mis keys?</p>
              <ol className="space-y-1.5 text-sm text-white/50">
                <li className="flex gap-2"><span className="text-[#a3e635] font-bold shrink-0">1.</span>Entra a <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-[#a3e635] underline inline-flex items-center gap-1">dashboard.stripe.com/apikeys <ExternalLink className="w-3 h-3" /></a></li>
                <li className="flex gap-2"><span className="text-[#a3e635] font-bold shrink-0">2.</span>Copia la <strong className="text-white/70">Publishable key</strong> (empieza con <code className="text-[#a3e635]">pk_</code>)</li>
                <li className="flex gap-2"><span className="text-[#a3e635] font-bold shrink-0">3.</span>Haz clic en <strong className="text-white/70">"Reveal"</strong> y copia la <strong className="text-white/70">Secret key</strong> (empieza con <code className="text-[#a3e635]">sk_</code>)</li>
                <li className="flex gap-2"><span className="text-[#a3e635] font-bold shrink-0">4.</span>Para pruebas usa las keys que dicen <strong className="text-yellow-300">test</strong>; para producción usa las <strong className="text-green-300">live</strong></li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Publishable Key <span className="text-white/30">(pk_...)</span></label>
                <input
                  value={form.publishableKey}
                  onChange={e => setForm(f => ({ ...f, publishableKey: e.target.value }))}
                  placeholder="pk_test_..."
                  className={fieldClass}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Secret Key <span className="text-white/30">(sk_...)</span></label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={form.secretKey}
                    onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))}
                    placeholder="sk_test_..."
                    className={`${fieldClass} pr-10`}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/30 mt-1">Guardada de forma segura, nunca se envía al navegador</p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={connect}
                disabled={saving || !form.publishableKey || !form.secretKey}
                className="bg-[#a3e635] hover:bg-lime-400 disabled:opacity-50 text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                {saving ? 'Verificando...' : 'Conectar cuenta'}
              </button>
              <button onClick={() => { setShowForm(false); setError('') }} className="text-white/40 hover:text-white px-4 py-2.5 text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      {connected && (
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Visa / Mastercard', icon: '💳' },
            { label: 'American Express', icon: '💳' },
            { label: 'Apple / Google Pay', icon: '📱' },
          ].map(item => (
            <div key={item.label} className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
              <p className="text-lg mb-1">{item.icon}</p>
              <p className="text-xs text-white/50">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

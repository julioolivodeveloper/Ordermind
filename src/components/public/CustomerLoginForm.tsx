'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, ArrowRight, CheckCircle2, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface Restaurant { id: string; name: string; slug: string; logo_url: string | null; primary_color: string }

type Mode = 'login' | 'signup' | 'magic'

export function CustomerLoginForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const color = restaurant.primary_color || '#a3e635'

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function reset() { setError(''); setSent(false) }

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError('Correo o contraseña incorrectos'); return }
    router.push(`/r/${restaurant.slug}/account`)
  }

  async function handleSignup() {
    if (!email || !password) return
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { role: 'customer' },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/r/${restaurant.slug}/account`,
      },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  async function handleMagicLink() {
    if (!email) return
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/r/${restaurant.slug}/account`,
        data: { role: 'customer' },
      },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  const isDark = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
  }
  const btnTextColor = isDark(color) ? '#000' : '#fff'

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: color + '20' }}>
            <CheckCircle2 className="w-10 h-10" style={{ color }} />
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Revisa tu correo</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            {mode === 'signup'
              ? <>Enviamos un enlace de confirmación a <span className="text-white font-medium">{email}</span>. Confirma tu cuenta para continuar.</>
              : <>Enviamos un enlace de acceso a <span className="text-white font-medium">{email}</span>. Haz clic en él para entrar.</>}
          </p>
          <button onClick={() => { setSent(false); setEmail(''); setPassword('') }} className="text-white/40 hover:text-white text-sm transition-colors">
            Usar otro correo
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' }}>

      {/* Back */}
      <div className="p-4">
        <Link href={`/r/${restaurant.slug}`} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Volver al menú
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">

          {/* Restaurant branding */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-2xl ring-4 ring-white/20 mb-4" />
            ) : (
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center font-black text-3xl mb-4 shadow-2xl" style={{ backgroundColor: color, color: btnTextColor }}>
                {restaurant.name[0].toUpperCase()}
              </div>
            )}
            <h1 className="text-white font-black text-xl">{restaurant.name}</h1>
            <p className="text-white/40 text-sm mt-1">Portal de clientes</p>
          </motion.div>

          {/* Tab switcher */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="flex bg-white/5 rounded-2xl p-1 mb-6">
            {([['login', 'Iniciar sesión'], ['signup', 'Crear cuenta']] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); reset() }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={mode === m ? { backgroundColor: color, color: btnTextColor } : { color: 'rgba(255,255,255,0.4)' }}
              >
                {label}
              </button>
            ))}
          </motion.div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
            >
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : mode === 'signup' ? handleSignup() : handleMagicLink())}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'magic' && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
                      placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm password */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSignup()}
                      placeholder="Repite tu contraseña"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>
              )}

              {/* Primary action */}
              <button
                onClick={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleMagicLink}
                disabled={loading || !email || (mode !== 'magic' && !password)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-40 shadow-lg"
                style={{ backgroundColor: color, color: btnTextColor }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Magic link toggle */}
              {mode === 'login' && (
                <button
                  onClick={() => { setMode('magic'); reset() }}
                  className="w-full text-center text-white/30 hover:text-white/60 text-xs transition-colors py-1"
                >
                  ¿Olvidaste tu contraseña? Entra con enlace por correo
                </button>
              )}
              {mode === 'magic' && (
                <button
                  onClick={() => { setMode('login'); reset() }}
                  className="w-full text-center text-white/30 hover:text-white/60 text-xs transition-colors py-1"
                >
                  ← Volver a iniciar sesión con contraseña
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

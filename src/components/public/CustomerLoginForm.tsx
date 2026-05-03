'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Restaurant { id: string; name: string; slug: string; logo_url: string | null; primary_color: string }

export function CustomerLoginForm({ restaurant }: { restaurant: Restaurant }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!email) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/r/${restaurant.slug}/account`,
        data: { role: 'customer' },
      },
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  const color = restaurant.primary_color || '#a3e635'

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href={`/r/${restaurant.slug}`} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to menu
        </Link>

        <div className="flex items-center gap-3 mb-8">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-sm" style={{ backgroundColor: color }}>
              {restaurant.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm">{restaurant.name}</p>
            <p className="text-white/40 text-xs">Customer portal</p>
          </div>
        </div>

        {sent ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color }} />
            <h2 className="text-white font-bold text-lg mb-2">Check your email</h2>
            <p className="text-white/50 text-sm">We sent a sign-in link to <span className="text-white font-medium">{email}</span>. Click it to access your account.</p>
            <button onClick={() => { setSent(false); setEmail('') }} className="mt-6 text-white/30 hover:text-white text-sm transition-colors">
              Use a different email
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-bold text-xl mb-1">Sign in</h2>
            <p className="text-white/40 text-sm mb-6">View your orders and track deliveries</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ ['--tw-ring-color' as string]: color + '60' }}
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                onClick={handleSend}
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                style={{ backgroundColor: color, color: '#000' }}
              >
                {loading ? 'Sending...' : 'Send sign-in link'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-white/20 text-xs text-center mt-5">
              No password needed — we&apos;ll email you a secure link
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

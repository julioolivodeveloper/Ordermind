'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ExternalLink, Unlink, AlertCircle } from 'lucide-react'

interface Props {
  connected: boolean
  merchantId?: string | null
  connectedAt?: string | null
  error?: string | null
  justConnected?: boolean
}

function SquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="1" y="1" width="22" height="22" rx="3" />
      <rect x="6" y="6" width="12" height="12" rx="1.5" fill="white" />
    </svg>
  )
}

export function SquareConnect({ connected, merchantId, connectedAt, error, justConnected }: Props) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleDisconnect() {
    if (!confirm('¿Seguro que quieres desconectar Square? Los pagos con Square dejarán de funcionar.')) return
    setDisconnecting(true)
    setLocalError(null)
    try {
      const res = await fetch('/api/square/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('Error al desconectar')
      router.refresh()
    } catch {
      setLocalError('No se pudo desconectar. Intenta de nuevo.')
    } finally {
      setDisconnecting(false)
    }
  }

  const displayError = error ?? localError

  return (
    <div className="space-y-5">
      {/* Just connected banner */}
      {justConnected && (
        <div className="flex items-center gap-3 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-2xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-[#a3e635] shrink-0" />
          <p className="text-[#a3e635] text-sm font-semibold">¡Square conectado exitosamente!</p>
        </div>
      )}

      {/* Error banner */}
      {displayError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{errorMessage(displayError)}</p>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
            <SquareIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Square Payments</h2>
            <p className="text-white/40 text-sm mt-0.5">Acepta pagos con tarjeta a través de Square POS y online</p>
          </div>
        </div>

        {connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-xl px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse shrink-0" />
              <span className="text-[#a3e635] text-sm font-semibold">Cuenta conectada</span>
            </div>

            {merchantId && (
              <div className="bg-white/5 rounded-xl px-4 py-3">
                <p className="text-white/40 text-xs mb-1">Merchant ID</p>
                <p className="text-white text-sm font-mono">{merchantId}</p>
              </div>
            )}

            {connectedAt && (
              <div className="bg-white/5 rounded-xl px-4 py-3">
                <p className="text-white/40 text-xs mb-1">Conectado el</p>
                <p className="text-white text-sm">
                  {new Date(connectedAt).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50 mt-2"
            >
              <Unlink className="w-4 h-4" />
              {disconnecting ? 'Desconectando...' : 'Desconectar Square'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-white/50 text-sm leading-relaxed">
              Conecta tu cuenta de Square para aceptar pagos con tarjeta, gestionar tu catálogo y sincronizar pedidos directamente con tu POS.
            </p>

            <ul className="space-y-2">
              {[
                'Pagos con tarjeta de crédito y débito',
                'Sincronización con Square POS',
                'Historial de transacciones unificado',
                'Reembolsos desde el dashboard',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="/api/square/connect"
              className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl font-bold text-sm bg-black text-white hover:bg-white/10 border border-white/10 transition-all mt-2"
            >
              <SquareIcon className="w-5 h-5" />
              Conectar con Square
              <ExternalLink className="w-3.5 h-3.5 text-white/40" />
            </a>

            <p className="text-white/20 text-xs text-center">
              Serás redirigido a Square para autorizar el acceso. Puedes desconectar en cualquier momento.
            </p>
          </div>
        )}
      </div>

      {/* Developer info */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
          <p className="text-amber-400 text-xs font-mono">Modo sandbox activo</p>
        </div>
      )}
    </div>
  )
}

function errorMessage(code: string): string {
  const map: Record<string, string> = {
    access_denied: 'Rechazaste la autorización de Square.',
    invalid_state: 'Sesión expirada. Intenta conectar de nuevo.',
    token_exchange_failed: 'Error al obtener el token de Square. Intenta de nuevo.',
    db_error: 'Error al guardar la conexión. Contacta soporte.',
    no_restaurant: 'No tienes un restaurante asignado.',
    missing_params: 'Parámetros inválidos en el callback.',
  }
  return map[code] ?? `Error: ${code}`
}

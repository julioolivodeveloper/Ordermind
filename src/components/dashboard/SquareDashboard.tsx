'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CreditCard, Package, CheckCircle2, AlertCircle, Unlink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Connection {
  merchant_id: string
  location_id: string | null
  created_at: string
}

interface Props {
  connection: Connection
  isSandbox: boolean
}

function SquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="1" y="1" width="22" height="22" rx="3" />
      <rect x="6" y="6" width="12" height="12" rx="1.5" fill="white" />
    </svg>
  )
}

export function SquareDashboard({ connection, isSandbox }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'transactions' | 'catalog'>('overview')
  const [transactions, setTransactions] = useState<any[] | null>(null)
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState('')
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number; total: number } | null>(null)
  const [syncError, setSyncError] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError] = useState('')

  async function loadTransactions() {
    setTxLoading(true); setTxError('')
    try {
      const res = await fetch('/api/square/transactions')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTransactions(data.payments)
    } catch (e: any) {
      setTxError(e.message)
    } finally {
      setTxLoading(false)
    }
  }

  async function handleSync() {
    setSyncLoading(true); setSyncError(''); setSyncResult(null)
    try {
      const res = await fetch('/api/square/sync-catalog', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncResult(data)
    } catch (e: any) {
      setSyncError(e.message)
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Square?')) return
    setDisconnecting(true)
    await fetch('/api/square/disconnect', { method: 'POST' })
    router.refresh()
  }

  async function handleManualConnect() {
    if (!manualToken.trim()) return
    setManualLoading(true); setManualError('')
    try {
      const res = await fetch('/api/square/manual-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: manualToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.refresh()
    } catch (e: any) {
      setManualError(e.message)
    } finally {
      setManualLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Conexión', icon: SquareIcon },
    { id: 'transactions', label: 'Transacciones', icon: CreditCard },
    { id: 'catalog', label: 'Catálogo', icon: Package },
  ] as const

  const statusColor = { COMPLETED: 'text-emerald-400', FAILED: 'text-red-400', CANCELED: 'text-slate-400' }

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <div className="flex items-center gap-3 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-2xl px-4 py-3">
        <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse shrink-0" />
        <span className="text-[#a3e635] text-sm font-semibold">Square conectado</span>
        <span className="text-white/30 text-xs ml-auto">{connection.merchant_id}</span>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id as any); if (t.id === 'transactions' && !transactions) loadTransactions() }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id ? 'bg-[#a3e635] text-black' : 'text-white/40 hover:text-white'}`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-1">Merchant ID</p>
              <p className="text-white text-sm font-mono truncate">{connection.merchant_id}</p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-1">Location ID</p>
              <p className="text-white text-sm font-mono truncate">{connection.location_id ?? '—'}</p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4 col-span-2">
              <p className="text-white/40 text-xs mb-1">Conectado el</p>
              <p className="text-white text-sm">
                {new Date(connection.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {isSandbox && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <p className="text-amber-400 text-xs font-semibold mb-2">🧪 Modo sandbox — reconectar con token manual</p>
              {manualError && <p className="text-red-400 text-xs mb-2">{manualError}</p>}
              <div className="flex gap-2">
                <input
                  type="password"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                  placeholder="Access Token de prueba"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
                />
                <button
                  onClick={handleManualConnect}
                  disabled={manualLoading || !manualToken.trim()}
                  className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  {manualLoading ? '...' : 'Actualizar'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Unlink className="w-4 h-4" />
            {disconnecting ? 'Desconectando...' : 'Desconectar Square'}
          </button>
        </div>
      )}

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-sm">Últimos 50 pagos desde Square</p>
            <button onClick={loadTransactions} disabled={txLoading} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
          </div>

          {txError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {txError}
            </div>
          )}

          {txLoading && !transactions && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#a3e635]/40 border-t-[#a3e635] rounded-full animate-spin" />
            </div>
          )}

          {transactions && transactions.length === 0 && (
            <div className="text-center py-12 text-white/30 text-sm">Sin transacciones aún</div>
          )}

          {transactions && transactions.length > 0 && (
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Monto</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide hidden md:table-cell">Tarjeta</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={tx.id} className={`${i > 0 ? 'border-t border-white/5' : ''} hover:bg-white/3 transition-colors`}>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${(statusColor as any)[tx.status] ?? 'text-white/40'}`}>
                          {tx.status === 'COMPLETED' ? '✓' : tx.status === 'FAILED' ? '✗' : '○'} {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs hidden sm:table-cell">
                        {new Date(tx.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white font-bold text-sm">
                          {formatCurrency((tx.amount_money?.amount ?? 0) / 100)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white/40 text-xs hidden md:table-cell">
                        {tx.card_details?.card?.card_brand} ···{tx.card_details?.card?.last_4}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Catalog Sync */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm mb-2">Sincronizar catálogo de Square</h3>
            <p className="text-white/40 text-sm mb-4 leading-relaxed">
              Importa los productos de tu catálogo de Square directamente al menú de Ordermind. Los productos existentes se actualizarán, los nuevos se crearán.
            </p>

            {syncResult && (
              <div className="flex items-center gap-2 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-xl px-4 py-3 mb-4">
                <CheckCircle2 className="w-4 h-4 text-[#a3e635] shrink-0" />
                <p className="text-[#a3e635] text-sm">
                  Sincronizado: <strong>{syncResult.created}</strong> creados, <strong>{syncResult.updated}</strong> actualizados de <strong>{syncResult.total}</strong> productos.
                </p>
              </div>
            )}

            {syncError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{syncError}</p>
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={syncLoading}
              className="flex items-center gap-2 bg-[#a3e635] hover:brightness-110 disabled:opacity-50 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
          </div>

          <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
            <p className="text-white/40 text-xs leading-relaxed">
              La sincronización importa nombre, descripción, precio e imagen de cada producto. Los productos se agregan a la primera categoría existente o se crea una categoría &quot;Square Catalog&quot; automáticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

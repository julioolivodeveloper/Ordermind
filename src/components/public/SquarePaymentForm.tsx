'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

declare global {
  interface Window { Square?: any }
}

interface Props {
  restaurantId: string
  locationId: string
  primaryColor: string
  slug: string
  total: number
  orderData: Record<string, any>
  onSuccess: (orderId: string) => void
  onError: (msg: string) => void
}

export function SquarePaymentForm({
  restaurantId, locationId, primaryColor, slug, total, orderData, onSuccess, onError,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const cardInstance = useRef<any>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initError, setInitError] = useState('')

  const isSandbox = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT !== 'production'
  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? ''

  useEffect(() => {
    if (!appId || !locationId) {
      setInitError('Square no está configurado correctamente.')
      return
    }

    const scriptUrl = isSandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js'

    const existing = document.querySelector(`script[src="${scriptUrl}"]`)

    const init = async () => {
      try {
        const payments = window.Square!.payments(appId, locationId)
        const card = await payments.card({
          style: {
            '.input-container': { borderRadius: '12px' },
            '.input-container.is-focus': { borderColor: primaryColor },
          },
        })
        await card.attach(cardRef.current!)
        cardInstance.current = card
        setSdkReady(true)
      } catch (e: any) {
        setInitError('No se pudo cargar el formulario de tarjeta.')
      }
    }

    if (existing) {
      if (window.Square) init()
      else existing.addEventListener('load', init)
    } else {
      const script = document.createElement('script')
      script.src = scriptUrl
      script.onload = init
      script.onerror = () => setInitError('Error cargando Square SDK.')
      document.head.appendChild(script)
    }

    return () => { cardInstance.current?.destroy?.() }
  }, [appId, locationId])

  async function handlePay() {
    if (!cardInstance.current || !sdkReady) return
    setLoading(true)
    onError('')
    try {
      const result = await cardInstance.current.tokenize()
      if (result.status !== 'OK') {
        throw new Error(result.errors?.[0]?.message ?? 'Error al procesar la tarjeta')
      }

      const res = await fetch('/api/square/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: result.token,
          restaurantId,
          orderData,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar el pago')
      onSuccess(data.order_id)
    } catch (err: any) {
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (initError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        {initError}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Square card element mounts here */}
      <div ref={cardRef} className="min-h-[90px]" />

      {!sdkReady && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
          Cargando formulario de tarjeta...
        </div>
      )}

      {sdkReady && (
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full text-white py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
          ) : (
            `Pagar ${formatCurrency(total)} con Square`
          )}
        </button>
      )}

      <p className="text-center text-slate-400 text-xs flex items-center justify-center gap-1">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <rect x="1" y="1" width="22" height="22" rx="3" />
          <rect x="6" y="6" width="12" height="12" rx="1.5" fill="white" />
        </svg>
        Pago seguro con Square
      </p>
    </div>
  )
}

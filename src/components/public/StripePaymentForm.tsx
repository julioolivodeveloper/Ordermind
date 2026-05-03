'use client'
import { useState, useEffect, useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatCurrency } from '@/lib/utils'
import type { Restaurant } from '@/types'

interface OrderData {
  customer_name: string
  customer_phone: string
  customer_email: string
  order_type: string
  notes: string
  delivery_address: object | null
  subtotal: number
  tax_amount: number
  delivery_fee: number
  discount_amount: number
  total: number
  items: object[]
}

interface Props {
  restaurant: Restaurant
  orderData: OrderData
  onSuccess: (orderId: string) => void
  onError: (msg: string) => void
}

// Formulario interno (debe estar dentro de <Elements>)
function PaymentForm({ restaurant, orderData, onSuccess, onError }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  async function handlePay() {
    if (!stripe || !elements) return
    setProcessing(true)

    // 1. Confirmar pago con Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/r/${restaurant.slug}/checkout`,
      },
      redirect: 'if_required',
    })

    if (error) {
      onError(error.message ?? 'Error al procesar el pago')
      setProcessing(false)
      return
    }

    if (paymentIntent?.status !== 'succeeded') {
      onError('El pago no se completó. Por favor intenta de nuevo.')
      setProcessing(false)
      return
    }

    // 2. Crear el pedido con payment_intent_id
    try {
      const res = await fetch(`/api/public/${restaurant.slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          restaurant_id: restaurant.id,
          payment_method: 'stripe',
          payment_intent_id: paymentIntent.id,
          payment_status: 'paid',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear pedido')
      onSuccess(data.order_id)
    } catch (err: any) {
      onError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
      <button
        onClick={handlePay}
        disabled={!stripe || !elements || processing}
        className="w-full text-white py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50 hover:brightness-110 active:scale-95"
        style={{ backgroundColor: restaurant.primary_color }}
      >
        {processing ? 'Procesando...' : `Pagar ${formatCurrency(orderData.total)}`}
      </button>
    </div>
  )
}

// Componente wrapper que carga Stripe Elements
export function StripePaymentForm(props: Props) {
  const { restaurant, orderData } = props
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  // loadStripe es costoso, solo lo instanciamos si la clave cambia
  const stripePromise = useMemo(
    () => restaurant.stripe_publishable_key ? loadStripe(restaurant.stripe_publishable_key) : null,
    [restaurant.stripe_publishable_key]
  )

  useEffect(() => {
    if (!restaurant.stripe_publishable_key) return
    fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        amount: orderData.total,
        currency: restaurant.currency,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setLoadError(data.error)
        else setClientSecret(data.clientSecret)
      })
      .catch(() => setLoadError('No se pudo iniciar el pago. Intenta de nuevo.'))
      .finally(() => setLoading(false))
  }, [restaurant.id, orderData.total])

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
        Cargando formulario de pago...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        {loadError}
      </div>
    )
  }

  if (!stripePromise || !clientSecret) return null

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: restaurant.primary_color ?? '#f97316',
            borderRadius: '12px',
          },
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  )
}

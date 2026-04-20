import Stripe from 'stripe'

let _stripe: Stripe | null = null

export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    if (!_stripe) {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', {
        apiVersion: '2026-03-25.dahlia',
      })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_stripe as any)[prop]
  },
})

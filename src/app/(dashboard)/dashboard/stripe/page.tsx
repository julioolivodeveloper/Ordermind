import { requireRestaurantAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { StripeConnect } from '@/components/dashboard/StripeConnect'

export default async function StripePage() {
  const profile = await requireRestaurantAccess()
  const admin = createAdminClient()

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('stripe_connected, stripe_publishable_key')
    .eq('id', profile.restaurant_id!)
    .single()

  return (
    <div className="p-6 max-w-2xl bg-[#111111] min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pagos con tarjeta</h1>
        <p className="text-white/40 text-sm mt-1">Conecta tu cuenta de Stripe para aceptar tarjetas</p>
      </div>
      <StripeConnect
        stripeConnected={restaurant?.stripe_connected ?? false}
        stripePublishableKey={restaurant?.stripe_publishable_key ?? undefined}
      />
    </div>
  )
}

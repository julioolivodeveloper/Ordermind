import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { CheckoutForm } from '@/components/public/CheckoutForm'

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id,slug,name,description,logo_url,cover_url,status,is_demo,primary_color,secondary_color,phone,email,address,city,state,country,website,instagram,facebook,whatsapp,timezone,language,currency,pickup_enabled,delivery_enabled,dine_in_enabled,delivery_fee,min_order_amount,tax_rate,tax_name,business_hours,delivery_zip_codes,loyalty_enabled,loyalty_points_per_dollar,loyalty_redemption_points,stripe_connected,stripe_publishable_key,notes,created_at,updated_at')
    .eq('slug', slug)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) notFound()

  // Check Square connection for this restaurant
  const admin = createAdminClient()
  const { data: squareConn } = await admin
    .from('square_connections')
    .select('location_id')
    .eq('restaurant_id', restaurant.id)
    .single()

  return <CheckoutForm restaurant={restaurant} squareLocationId={squareConn?.location_id ?? null} />
}

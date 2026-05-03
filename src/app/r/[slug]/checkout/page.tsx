import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckoutForm } from '@/components/public/CheckoutForm'

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Excluir stripe_secret_key — nunca debe llegar al cliente
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id,slug,name,description,logo_url,cover_url,status,is_demo,primary_color,secondary_color,phone,email,address,city,state,country,website,instagram,facebook,whatsapp,timezone,language,currency,pickup_enabled,delivery_enabled,dine_in_enabled,delivery_fee,min_order_amount,tax_rate,tax_name,business_hours,delivery_zip_codes,loyalty_enabled,loyalty_points_per_dollar,loyalty_redemption_points,stripe_connected,stripe_publishable_key,notes,created_at,updated_at')
    .eq('slug', slug)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) notFound()

  return <CheckoutForm restaurant={restaurant} />
}

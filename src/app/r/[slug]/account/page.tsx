import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { CustomerAccount } from '@/components/public/CustomerAccount'

export default async function CustomerAccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/r/${slug}/login`)

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name, slug, logo_url, primary_color')
    .eq('slug', slug)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) notFound()

  const { data: orders } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', restaurant.id)
    .eq('customer_email', user.email ?? '')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: customer } = await admin
    .from('customers')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('email', user.email ?? '')
    .maybeSingle()

  // Look up loyalty points using the phone from the customer record
  let loyalty = null
  if (customer?.phone) {
    const { data: lp } = await admin
      .from('loyalty_points')
      .select('points, total_spent')
      .eq('restaurant_id', restaurant.id)
      .eq('customer_phone', customer.phone)
      .maybeSingle()
    loyalty = lp
  }

  // Also fetch restaurant loyalty settings to show redemption info
  const { data: restaurantFull } = await admin
    .from('restaurants')
    .select('loyalty_enabled, loyalty_points_per_dollar, loyalty_redemption_points')
    .eq('id', restaurant.id)
    .single()

  return (
    <CustomerAccount
      restaurant={restaurant as any}
      user={{ email: user.email ?? '', id: user.id }}
      orders={(orders ?? []) as any[]}
      customer={customer as any}
      loyalty={loyalty as any}
      loyaltySettings={restaurantFull as any}
    />
  )
}

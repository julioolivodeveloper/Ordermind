import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { CustomerLoginForm } from '@/components/public/CustomerLoginForm'

export default async function CustomerLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name, slug, logo_url, primary_color')
    .eq('slug', slug)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) notFound()

  return <CustomerLoginForm restaurant={restaurant as any} />
}

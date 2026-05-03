import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CustomersManager } from '@/components/dashboard/CustomersManager'

export default async function CustomersPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, restaurant:restaurants(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) redirect('/dashboard')

  const { data: customers } = await admin
    .from('customers')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('last_order_at', { ascending: false, nullsFirst: false })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <CustomersManager initial={(customers ?? []) as any[]} restaurantSlug={(profile.restaurant as any)?.slug ?? ''} />
    </div>
  )
}

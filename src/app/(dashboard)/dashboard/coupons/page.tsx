import { requireRestaurantAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { CouponsManager } from '@/components/dashboard/CouponsManager'

export default async function CouponsPage() {
  const profile = await requireRestaurantAccess()
  const admin = createAdminClient()
  const { data: coupons } = await admin
    .from('coupons')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id!)
    .order('created_at', { ascending: false })
  return (
    <div className="p-6 max-w-3xl bg-[#111111] min-h-full">
      <CouponsManager initial={coupons ?? []} />
    </div>
  )
}

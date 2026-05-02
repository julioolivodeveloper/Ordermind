import { requireRestaurantAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PromotionsManager } from '@/components/dashboard/PromotionsManager'

export default async function PromotionsPage() {
  const profile = await requireRestaurantAccess()
  const admin = createAdminClient()

  const { data: promotions } = await admin
    .from('promotions')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id!)
    .order('sort_order')

  return (
    <div className="p-6 max-w-3xl bg-[#111111] min-h-full">
      <PromotionsManager initial={promotions ?? []} />
    </div>
  )
}

import { requireRestaurantAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReviewsManager } from '@/components/dashboard/ReviewsManager'

export default async function ReviewsPage() {
  const profile = await requireRestaurantAccess()
  const admin = createAdminClient()

  const { data: reviews } = await admin
    .from('reviews')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id!)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-3xl bg-[#111111] min-h-full">
      <ReviewsManager initial={reviews ?? []} />
    </div>
  )
}

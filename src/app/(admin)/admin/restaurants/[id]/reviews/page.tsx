import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { ReviewsManager } from '@/components/dashboard/ReviewsManager'

export default async function AdminRestaurantReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin()
  const { id } = await params
  const admin = createAdminClient()

  const { data: restaurant } = await admin.from('restaurants').select('id, name, slug').eq('id', id).single()
  if (!restaurant) notFound()

  const { data: reviews } = await admin
    .from('reviews')
    .select('*')
    .eq('restaurant_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-3xl bg-[#111111] min-h-full">
      <ReviewsManager initial={reviews ?? []} />
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { PromotionsManager } from '@/components/dashboard/PromotionsManager'
import Link from 'next/link'

export default async function AdminRestaurantPromotionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin()
  const { id } = await params
  const admin = createAdminClient()

  const { data: restaurant } = await admin.from('restaurants').select('id, name, slug').eq('id', id).single()
  if (!restaurant) notFound()

  const { data: promotions } = await admin
    .from('promotions')
    .select('*')
    .eq('restaurant_id', id)
    .order('sort_order')

  return (
    <div className="p-6 max-w-3xl bg-[#111111] min-h-full">
      <PromotionsManager initial={promotions ?? []} />
    </div>
  )
}

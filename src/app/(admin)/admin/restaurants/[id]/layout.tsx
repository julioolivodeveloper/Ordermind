import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { RestaurantDashboardSidebar } from '@/components/admin/RestaurantDashboardSidebar'

export default async function RestaurantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  await requireSuperAdmin()
  const { id } = await params
  const admin = createAdminClient()

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name, slug, logo_url, primary_color')
    .eq('id', id)
    .single()

  if (!restaurant) notFound()

  return (
    <div className="flex h-full bg-[#111111]">
      <RestaurantDashboardSidebar restaurant={restaurant as any} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

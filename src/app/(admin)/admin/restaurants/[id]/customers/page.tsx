import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { CustomersManager } from '@/components/dashboard/CustomersManager'
import Link from 'next/link'

export default async function AdminRestaurantCustomersPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin()
  const { id } = await params
  const admin = createAdminClient()

  const { data: restaurant } = await admin.from('restaurants').select('id, name, slug').eq('id', id).single()
  if (!restaurant) notFound()

  const { data: customers } = await admin
    .from('customers')
    .select('*')
    .eq('restaurant_id', id)
    .order('last_order_at', { ascending: false, nullsFirst: false })

  return (
    <div className="p-6 bg-[#111111] min-h-full">
      <div className="mb-6">
        <Link href={`/admin/restaurants/${id}`} className="text-white/40 hover:text-white text-sm flex items-center gap-1 mb-3 transition-colors">
          ← {restaurant.name}
        </Link>
        <h1 className="text-2xl font-bold text-white">Clientes — {restaurant.name}</h1>
        <p className="text-white/40 text-sm mt-1">/{restaurant.slug}</p>
      </div>
      <CustomersManager initial={(customers ?? []) as any[]} restaurantSlug={restaurant.slug} />
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { OrderTracker } from '@/components/public/OrderTracker'

export default async function OrderStatusPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ new?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*), restaurant:restaurants(name, primary_color, slug, phone, whatsapp)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  return <OrderTracker order={order as any} isNew={sp.new === '1'} />
}

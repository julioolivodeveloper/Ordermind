import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ customer: null })

  const admin = createAdminClient()
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()
  if (!restaurant) return NextResponse.json({ customer: null })

  const { data: customer } = await admin
    .from('customers')
    .select('name, phone, email')
    .eq('restaurant_id', restaurant.id)
    .eq('email', user.email)
    .maybeSingle()

  const { data: lastDelivery } = await admin
    .from('orders')
    .select('delivery_address')
    .eq('restaurant_id', restaurant.id)
    .eq('customer_email', user.email)
    .eq('order_type', 'delivery')
    .not('delivery_address', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    userEmail: user.email,
    customer: customer ?? null,
    lastAddress: lastDelivery?.delivery_address ?? null,
  })
}

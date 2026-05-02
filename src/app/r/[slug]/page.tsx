import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { PublicMenu } from '@/components/public/PublicMenu'

export default async function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) notFound()

  const [
    { data: categories },
    { data: promotions },
    { data: reviews },
  ] = await Promise.all([
    supabase.from('menu_categories').select('*, menu_items(*, ingredients:item_ingredients(*))').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
    admin.from('promotions').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
    admin.from('reviews').select('*').eq('restaurant_id', restaurant.id).eq('is_visible', true).order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <PublicMenu
      restaurant={restaurant}
      categories={categories ?? []}
      promotions={promotions ?? []}
      reviews={reviews ?? []}
    />
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicMenu } from '@/components/public/PublicMenu'

export default async function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) notFound()

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*, menu_items(*, ingredients:item_ingredients(*))')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('sort_order')

  return (
    <PublicMenu
      restaurant={restaurant}
      categories={categories ?? []}
    />
  )
}

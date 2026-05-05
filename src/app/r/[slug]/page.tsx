import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { PublicMenu } from '@/components/public/PublicMenu'

export default async function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  // Excluir stripe_secret_key — nunca debe llegar al cliente
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id,slug,name,description,logo_url,cover_url,status,is_demo,primary_color,secondary_color,phone,email,address,city,state,country,website,instagram,facebook,whatsapp,timezone,language,currency,pickup_enabled,delivery_enabled,dine_in_enabled,delivery_fee,min_order_amount,tax_rate,tax_name,business_hours,delivery_zip_codes,loyalty_enabled,loyalty_points_per_dollar,loyalty_redemption_points,stripe_connected,stripe_publishable_key,notes,created_at,updated_at')
    .eq('slug', slug)
    .in('status', ['active', 'demo'])
    .single()

  if (!restaurant) notFound()

  const [
    { data: categories },
    { data: promotions },
    { data: reviews },
  ] = await Promise.all([
    supabase.from('menu_categories').select('*, menu_items(*, ingredients:item_ingredients(*), option_groups:item_option_groups(*, options:item_options(*)))').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
    admin.from('promotions').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
    admin.from('reviews').select('*').eq('restaurant_id', restaurant.id).eq('is_visible', true).order('created_at', { ascending: false }).limit(20),
  ])

  // Fetch combo_items separately to avoid PostgREST ambiguous FK error
  const allItemIds = (categories ?? []).flatMap(c => (c.menu_items ?? []).map((i: any) => i.id))
  const { data: comboItems } = allItemIds.length
    ? await supabase.from('combo_items').select('id, combo_id, component_id, quantity, sort_order').in('combo_id', allItemIds)
    : { data: [] }

  // Attach combo_items to their menu_items
  const categoriesWithCombos = (categories ?? []).map((cat: any) => ({
    ...cat,
    menu_items: (cat.menu_items ?? []).map((item: any) => ({
      ...item,
      combo_items: (comboItems ?? []).filter((ci: any) => ci.combo_id === item.id),
    })),
  }))

  return (
    <PublicMenu
      restaurant={restaurant}
      categories={categoriesWithCombos}
      promotions={promotions ?? []}
      reviews={reviews ?? []}
    />
  )
}

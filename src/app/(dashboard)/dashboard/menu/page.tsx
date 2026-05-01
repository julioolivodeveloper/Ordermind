import { requireRestaurantAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { MenuManager } from '@/components/dashboard/MenuManager'

export default async function MenuPage() {
  const profile = await requireRestaurantAccess()
  const supabase = await createClient()
  const restaurantId = profile.restaurant_id!

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from('menu_categories').select('*').eq('restaurant_id', restaurantId).order('sort_order'),
    supabase.from('menu_items').select('*, category:menu_categories(name), ingredients:item_ingredients(*)').eq('restaurant_id', restaurantId).order('sort_order'),
  ])

  return (
    <div className="p-6 bg-[#111111] min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Menú</h1>
        <p className="text-white/40 text-sm mt-1">Gestiona tus categorías y platillos</p>
      </div>
      <MenuManager
        restaurantId={restaurantId}
        initialCategories={categories ?? []}
        initialItems={items ?? []}
      />
    </div>
  )
}

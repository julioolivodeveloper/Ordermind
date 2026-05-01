import { requireRestaurantAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const profile = await requireRestaurantAccess()
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', profile.restaurant_id!)
    .single()

  return (
    <div className="p-6 max-w-2xl bg-[#111111] min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-white/40 text-sm mt-1">Personaliza tu restaurante</p>
      </div>
      {restaurant && <SettingsForm restaurant={restaurant} />}
    </div>
  )
}

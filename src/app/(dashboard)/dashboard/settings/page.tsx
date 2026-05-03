import { requireRestaurantAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/dashboard/SettingsForm'
import { QRCodeCard } from '@/components/dashboard/QRCodeCard'

export default async function SettingsPage() {
  const profile = await requireRestaurantAccess()
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', profile.restaurant_id!)
    .single()

  return (
    <div className="p-6 max-w-2xl bg-[#111111] min-h-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Customize your restaurant</p>
      </div>
      {restaurant && <SettingsForm restaurant={restaurant} />}
      {restaurant?.slug && (
        <div className="border-t border-white/5 pt-8">
          <QRCodeCard slug={restaurant.slug} />
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function isSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  if (!await isSuperAdmin(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const { create_owner, owner_name, owner_email, owner_password, ...restaurantData } = body

  const admin = createAdminClient()

  const { data: restaurant, error } = await admin
    .from('restaurants')
    .insert(restaurantData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (create_owner && owner_email && owner_password) {
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: owner_email,
      password: owner_password,
      email_confirm: true,
      user_metadata: { full_name: owner_name, role: 'restaurant_owner' },
    })

    if (!authError && authUser.user) {
      await admin.from('profiles').update({
        role: 'restaurant_owner',
        restaurant_id: restaurant.id,
        full_name: owner_name,
      }).eq('id', authUser.user.id)

      await admin.from('restaurants').update({ owner_id: authUser.user.id }).eq('id', restaurant.id)
    }
  }

  return NextResponse.json(restaurant)
}

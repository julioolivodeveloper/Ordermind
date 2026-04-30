import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { name, email, password, restaurant_id, role } = await request.json()

  const admin = createAdminClient()
  const { data: authUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('profiles').update({ role, restaurant_id, full_name: name }).eq('id', authUser.user.id)

  if (restaurant_id && role === 'restaurant_owner') {
    await supabase.from('restaurants').update({ owner_id: authUser.user.id }).eq('id', restaurant_id)
  }

  return NextResponse.json({ id: authUser.user.id, email, name })
}

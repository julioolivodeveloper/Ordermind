import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role, restaurant_id').eq('id', user.id).single()
  return data
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile || !['super_admin', 'restaurant_owner', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase.from('menu_items').insert(body).select('*, ingredients:item_ingredients(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

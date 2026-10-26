import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data: profile } = await supabase.from('profiles').select('role, restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

  const body = await request.json()
  // Owners edit their profile, not account-control fields
  const { id: _id, status: _status, is_demo: _isDemo, plan_id: _planId, plan: _plan, owner_id: _ownerId, owner: _owner, created_at: _createdAt, ...updates } = body
  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', profile.restaurant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function isSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'super_admin'
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  if (!await isSuperAdmin(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('restaurants')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  if (!await isSuperAdmin(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  await supabase.from('restaurants').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

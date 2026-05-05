import { createClient } from '@/lib/supabase/server'
import { requireRestaurantAccess } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const profile = await requireRestaurantAccess()
  const supabase = await createClient()

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `${profile.restaurant_id}/${Date.now()}-agent.${ext}`
  const buffer = await file.arrayBuffer()

  const { error } = await supabase.storage.from('menu-images').upload(path, buffer, { contentType: file.type, upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data } = supabase.storage.from('menu-images').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}

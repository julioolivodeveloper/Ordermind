import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('item_option_groups')
    .insert(body)
    .select('*, options:item_options(*)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

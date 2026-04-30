import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  await supabase.from('item_ingredients').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

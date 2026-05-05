import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getSquareClient } from '@/lib/square'

export async function GET(_req: Request, { params }: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Sin restaurante' }, { status: 403 })

  try {
    const square = await getSquareClient(profile.restaurant_id)
    const data = await square.get<any>(`/terminals/checkouts/${checkoutId}`)
    const checkout = data.checkout
    return NextResponse.json({ status: checkout.status, payment_ids: checkout.payment_ids ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

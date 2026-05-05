import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getSquareClient } from '@/lib/square'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Sin restaurante' }, { status: 403 })

  const admin = createAdminClient()
  const { data: conn } = await admin
    .from('square_connections')
    .select('location_id')
    .eq('restaurant_id', profile.restaurant_id)
    .single()

  if (!conn) return NextResponse.json({ error: 'Square no conectado' }, { status: 404 })

  try {
    const square = await getSquareClient(profile.restaurant_id)
    const params = conn.location_id ? `?location_id=${conn.location_id}&limit=50&sort_order=DESC` : '?limit=50&sort_order=DESC'
    const data = await square.get<any>(`/payments${params}`)
    return NextResponse.json({ payments: data.payments ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

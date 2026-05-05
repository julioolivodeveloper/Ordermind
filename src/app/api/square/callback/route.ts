import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SQUARE_BASE =
  process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com'

const DASHBOARD_URL = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/dashboard/square`

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Square denied access
  if (error) {
    return NextResponse.redirect(`${DASHBOARD_URL}?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${DASHBOARD_URL}?error=missing_params`)
  }

  // Verify CSRF state
  const cookieStore = await cookies()
  const savedState = cookieStore.get('square_oauth_state')?.value
  cookieStore.delete('square_oauth_state')

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${DASHBOARD_URL}?error=invalid_state`)
  }

  // Get authenticated user + restaurant
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.redirect(`${DASHBOARD_URL}?error=no_restaurant`)
  }

  // Exchange code for access_token
  const tokenRes = await fetch(`${SQUARE_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Square-Version': '2024-01-18' },
    body: JSON.stringify({
      client_id: process.env.SQUARE_CLIENT_ID,
      client_secret: process.env.SQUARE_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_url: process.env.SQUARE_REDIRECT_URL,
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenRes.ok || !tokenData.access_token) {
    console.error('Square token exchange error:', tokenData)
    return NextResponse.redirect(`${DASHBOARD_URL}?error=token_exchange_failed`)
  }

  const { access_token, refresh_token, expires_at, merchant_id } = tokenData

  // Save to Supabase via admin client (bypasses RLS)
  const admin = createAdminClient()
  const { error: dbError } = await admin
    .from('square_connections')
    .upsert(
      {
        restaurant_id: profile.restaurant_id,
        user_id: user.id,
        merchant_id,
        access_token,
        refresh_token: refresh_token ?? null,
        expires_at: expires_at ?? null,
      },
      { onConflict: 'restaurant_id' }
    )

  if (dbError) {
    console.error('Square DB save error:', dbError)
    return NextResponse.redirect(`${DASHBOARD_URL}?error=db_error`)
  }

  return NextResponse.redirect(`${DASHBOARD_URL}?connected=true`)
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const SQUARE_BASE =
  process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com'

const SCOPES = [
  'ORDERS_READ',
  'ITEMS_READ',
  'PAYMENTS_READ',
  'MERCHANT_PROFILE_READ',
].join(' ')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (!user) return NextResponse.redirect(`${siteUrl}/login`)

  const state = crypto.randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    client_id: process.env.SQUARE_CLIENT_ID!,
    scope: SCOPES,
    session: 'false',
    state,
    redirect_uri: process.env.SQUARE_REDIRECT_URL!,
  })

  // Set cookie on the redirect response itself
  const response = NextResponse.redirect(`${SQUARE_BASE}/oauth2/authorize?${params}`)
  response.cookies.set('square_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}

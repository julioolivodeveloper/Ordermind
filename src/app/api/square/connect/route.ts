import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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
  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))

  // CSRF state token
  const state = crypto.randomBytes(16).toString('hex')

  const cookieStore = await cookies()
  cookieStore.set('square_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: process.env.SQUARE_CLIENT_ID!,
    scope: SCOPES,
    session: 'false',
    state,
  })

  return NextResponse.redirect(`${SQUARE_BASE}/oauth2/authorize?${params}`)
}

import { createAdminClient } from '@/lib/supabase/admin'

const SQUARE_BASE =
  process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com'

interface SquareConnection {
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  merchant_id: string
  restaurant_id: string
}

async function refreshSquareToken(conn: SquareConnection): Promise<string> {
  if (!conn.refresh_token) throw new Error('No refresh token available')

  const res = await fetch(`${SQUARE_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Square-Version': '2024-01-18' },
    body: JSON.stringify({
      client_id: process.env.SQUARE_CLIENT_ID,
      client_secret: process.env.SQUARE_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: conn.refresh_token,
    }),
  })

  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error('Token refresh failed')

  const admin = createAdminClient()
  await admin
    .from('square_connections')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? conn.refresh_token,
      expires_at: data.expires_at ?? null,
    })
    .eq('restaurant_id', conn.restaurant_id)

  return data.access_token
}

async function getValidToken(restaurantId: string): Promise<string> {
  const admin = createAdminClient()
  const { data: conn, error } = await admin
    .from('square_connections')
    .select('access_token, refresh_token, expires_at, merchant_id, restaurant_id')
    .eq('restaurant_id', restaurantId)
    .single()

  if (error || !conn) throw new Error('No Square connection found for this restaurant')

  // Refresh if token expires within 5 minutes
  if (conn.expires_at) {
    const expiresAt = new Date(conn.expires_at).getTime()
    const fiveMinutes = 5 * 60 * 1000
    if (Date.now() + fiveMinutes >= expiresAt) {
      return refreshSquareToken(conn)
    }
  }

  return conn.access_token
}

/** Returns a typed fetch wrapper pre-authorized for the given restaurant */
export async function getSquareClient(restaurantId: string) {
  const token = await getValidToken(restaurantId)

  async function squareFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${SQUARE_BASE}/v2${path}`, {
      ...init,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
        ...init?.headers,
      },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.errors?.[0]?.detail ?? 'Square API error')
    return data
  }

  return {
    get: <T = any>(path: string) => squareFetch<T>(path),
    post: <T = any>(path: string, body: unknown) =>
      squareFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  }
}

/** Check if a restaurant has an active Square connection */
export async function getSquareConnection(restaurantId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('square_connections')
    .select('merchant_id, location_id, created_at, expires_at')
    .eq('restaurant_id', restaurantId)
    .single()
  return data ?? null
}

import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'

export const ACATORTAS_COOKIE = 'acatortas_admin'
export const ACATORTAS_SESSION_SECONDS = 24 * 60 * 60

function secret(): string | null {
  return process.env.ACATORTAS_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? null
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(`acatortas:${payload}`).digest('hex')
}

export function createAcaTortasSession(): string | null {
  const key = secret()
  if (!key) return null
  const issuedAt = Date.now().toString()
  return `${issuedAt}.${sign(issuedAt, key)}`
}

function isValidSession(value: string | undefined): boolean {
  const key = secret()
  if (!key || !value) return false
  const [issuedAt, sig] = value.split('.')
  if (!issuedAt || !sig) return false
  const expected = Buffer.from(sign(issuedAt, key), 'hex')
  const given    = Buffer.from(sig, 'hex')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false
  const age = Date.now() - Number(issuedAt)
  return age >= 0 && age < ACATORTAS_SESSION_SECONDS * 1000
}

/** Returns a 401 response unless the request carries a valid admin PIN session. */
export function requireAcaTortasAdmin(req: NextRequest): NextResponse | null {
  if (isValidSession(req.cookies.get(ACATORTAS_COOKIE)?.value)) return null
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

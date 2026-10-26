import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { ACATORTAS_COOKIE, ACATORTAS_SESSION_SECONDS, createAcaTortasSession } from '@/lib/acatortas-auth'

// Best-effort brute-force brake for the 4-digit PIN (per serverless instance)
const failures = new Map<string, { count: number; resetAt: number }>()
const MAX_FAILURES = 5
const WINDOW_MS = 15 * 60 * 1000

// POST /api/acatortas/auth — verifica el PIN del admin en el servidor
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const entry = failures.get(ip)
  if (entry && now < entry.resetAt && entry.count >= MAX_FAILURES) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  const { pin } = await req.json()
  const correct = process.env.ACATORTAS_ADMIN_PIN
  const given = Buffer.from(String(pin ?? ''))
  const expected = Buffer.from(correct ?? '')
  const ok = !!correct && given.length === expected.length && timingSafeEqual(given, expected)

  if (!ok) {
    const fresh = !entry || now >= entry.resetAt
    failures.set(ip, { count: fresh ? 1 : entry.count + 1, resetAt: fresh ? now + WINDOW_MS : entry.resetAt })
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  failures.delete(ip)
  const session = createAcaTortasSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 500 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ACATORTAS_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ACATORTAS_SESSION_SECONDS,
    path: '/',
  })
  return res
}

// DELETE /api/acatortas/auth — cierra la sesión del admin
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ACATORTAS_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}

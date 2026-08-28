import { NextRequest, NextResponse } from 'next/server'

// POST /api/acatortas/auth — verifica el PIN del admin en el servidor
export async function POST(req: NextRequest) {
  const { pin } = await req.json()
  const correct = process.env.ACATORTAS_ADMIN_PIN ?? '1234'

  if (pin !== correct) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}

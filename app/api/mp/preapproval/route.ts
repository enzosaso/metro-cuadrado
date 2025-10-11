import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createPreapproval } from '@/lib/mercadopago'
import { setUserEmail } from '@/lib/users'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUSCRIPTION_PRICE = process.env.SUSCRIPTION_PRICE
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || ''

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET })
  const email = typeof token?.email === 'string' ? token.email.toLowerCase() : undefined
  const userId = typeof token?.sub === 'string' ? token.sub : undefined
  if (!email || !userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const mpEmailRaw: unknown = body?.mpEmail
  const mpEmail = typeof mpEmailRaw === 'string' ? mpEmailRaw.trim().toLowerCase() : ''

  // set payerEmail to user email
  await setUserEmail(email, mpEmail)

  // Validación mínima de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mpEmail)) {
    return NextResponse.json({ error: 'Email de Mercado Pago inválido' }, { status: 400 })
  }

  const APP_URL = process.env.APP_URL!
  const reason = 'Suscripción Metro Cuadrado'
  const amount = Number(SUSCRIPTION_PRICE) // ARS/mes (ajustá el precio)
  const frequency = 1
  const frequency_type = 'months' as const

  const initPoint = await createPreapproval({
    payer_email: mpEmail,
    reason,
    amount,
    frequency,
    frequency_type,
    back_url: `${APP_URL}/wizard`,
    external_reference: userId
  })

  return NextResponse.json({ init_point: initPoint })
}

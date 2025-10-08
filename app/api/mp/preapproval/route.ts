import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createPreapproval } from '@/lib/mercadopago'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUSCRIPTION_PRICE = process.env.SUSCRIPTION_PRICE
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || ''

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET })
  const email = typeof token?.email === 'string' ? token.email.toLowerCase() : undefined
  const userId = typeof token?.sub === 'string' ? token.sub : undefined
  if (!email || !userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!email) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const APP_URL = process.env.APP_URL!
  const reason = 'Suscripción Metro Cuadrado'
  const amount = Number(SUSCRIPTION_PRICE) // ARS/mes (ajustá el precio)
  const frequency = 1
  const frequency_type = 'months' as const

  const notification_url = `${APP_URL}/api/mp/webhook` // debe ser público en prod

  const pre = await createPreapproval({
    payer_email: email,
    reason,
    amount,
    frequency,
    frequency_type,
    back_url: `${APP_URL}/wizard`,
    notification_url,
    external_reference: userId
  })

  return NextResponse.json({ init_point: pre.init_point })
}

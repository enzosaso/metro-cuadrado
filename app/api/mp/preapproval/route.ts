import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPreapproval } from '@/lib/mercadopago'

const SUSCRIPTION_PRICE = process.env.SUSCRIPTION_PRICE

export async function POST() {
  const session = await auth()
  const email = session?.user?.email
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
    notification_url
  })

  return NextResponse.json({ init_point: pre.init_point })
}

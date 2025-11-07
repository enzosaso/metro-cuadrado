import { NextRequest, NextResponse } from 'next/server'
import { issuePasswordReset } from '@/lib/passwordReset'
import { sendPasswordResetEmail } from '@/lib/mailer'

export const runtime = 'nodejs'

type Body = { email?: string }

export async function POST(req: NextRequest) {
  const body: Body = await req.json().catch(() => ({} as Body))
  const email = body.email?.trim()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const ua = req.headers.get('user-agent') || undefined
  const ip = req.headers.get('x-forwarded-for') || undefined
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin

  const opts: { ua?: string; ip?: string; baseUrl: string } = { baseUrl }
  if (ua) opts.ua = ua
  if (ip) opts.ip = ip

  const { token, resetUrl } = await issuePasswordReset(email, opts)

  if (token && resetUrl) {
    try {
      await sendPasswordResetEmail({ to: email, resetUrl })
    } catch (err) {
      // No filtramos existencia; log y seguimos con 200
      console.error('Error enviando email de reset', err)
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEV] Password reset link:', resetUrl)
    }
  }

  // Mensaje neutro siempre
  return NextResponse.json({ ok: true })
}

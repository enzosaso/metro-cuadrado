import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyPasswordResetToken, consumePasswordReset } from '@/lib/passwordReset'
import { usersCol, Timestamp } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  const u = user!.length <= 2 ? user![0] + '*' : user![0] + '*'.repeat(user!.length - 2) + user![user!.length - 1]
  return `${u}@${domain}`
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  if (token.length < 64) return NextResponse.json({ error: 'token inválido' }, { status: 400 })
  try {
    const { email } = await verifyPasswordResetToken(token)
    return NextResponse.json({ email: maskEmail(email) })
  } catch {
    return NextResponse.json({ error: 'link inválido o expirado' }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  const { token, password } = (await req.json().catch(() => ({}))) as { token?: string; password?: string }
  if (!token || token.length < 64) return NextResponse.json({ error: 'token inválido' }, { status: 400 })
  if (!password) {
    return NextResponse.json({ error: 'Contraseña inválida' }, { status: 400 })
  }

  try {
    const { docId, uid } = await verifyPasswordResetToken(token)

    const passwordHash = await bcrypt.hash(password, 12)
    await usersCol().doc(uid).update({ passwordHash, updatedAt: Timestamp.now() })
    await consumePasswordReset(docId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo restablecer la contraseña' }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { draftsCol } from '@/lib/firebaseAdmin'

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || ''

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/drafts → lista borradores del usuario
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET })
  const userId = token?.sub
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const snap = await draftsCol().where('userId', '==', userId).orderBy('updatedAt', 'desc').get()
  const drafts = snap.docs.map(d => ({ id: d.id, ...(d.data() as { name: string; data: string }) }))
  return NextResponse.json(drafts)
}

// POST /api/drafts → guarda un nuevo borrador o actualiza uno existente
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET })
  const userId = token?.sub
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { name, draft, id, createdAt, updatedAt } = await req.json()
  if (!name || !draft) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  if (createdAt === updatedAt) {
    await draftsCol().doc(id).set({ id, name, userId, draft, updatedAt, createdAt })
    return NextResponse.json({ ok: true, id })
  } else {
    await draftsCol().doc(id).update({ name, draft, updatedAt })
    return NextResponse.json({ ok: true, id })
  }
}

// DELETE /api/drafts/:id
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const token = await getToken({ req, secret: NEXTAUTH_SECRET })
  const userId = token?.sub
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  await draftsCol().doc(id).delete()
  return NextResponse.json({ ok: true })
}

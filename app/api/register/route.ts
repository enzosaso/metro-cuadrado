import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { usersCol } from '@/lib/firebaseAdmin'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
    }

    const emailNorm = email.toString().trim().toLowerCase()

    // Verificar si ya existe
    const existing = await usersCol().where('email', '==', emailNorm).limit(1).get()

    if (!existing.empty) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 })
    }

    // Hashear la contraseña
    const passwordHash = await hash(password, 10)

    // Crear documento en Firestore
    const docRef = await usersCol().add({
      email: emailNorm,
      passwordHash,
      name: name ?? null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (err) {
    console.error('Error en registro:', err)
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
  }
}

import { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { usersCol } from '@/lib/firebaseAdmin'
import { compare } from 'bcryptjs'

type Role = 'owner' | 'admin' | 'user'

interface FireUser {
  id: string
  email: string
  passwordHash: string
  name?: string
  role?: Role
}

async function getUserByEmail(email: string): Promise<FireUser | null> {
  const snap = await usersCol().where('email', '==', email).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const data = doc?.data() as Partial<FireUser> | undefined
  if (!data || !data.email || !data.passwordHash) return null
  return {
    id: doc?.id || '',
    email: data.email,
    passwordHash: data.passwordHash,
    name: data.name ?? 'Usuario',
    role: (data.role as Role) ?? 'user'
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(creds) {
        const { email, password } = creds ?? {}

        if (!email || !password) return null

        const emailNorm = email.toString().trim().toLowerCase()
        // Buscar usuario en Firestore
        const user = await getUserByEmail(emailNorm)
        if (!user?.passwordHash) return null

        // Validar contraseña
        const ok = await compare(password, user.passwordHash)
        if (!ok) return null

        // Payload mínimo para JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? 'Usuario',
          role: user.role ?? 'user'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id?: string; email?: string; name?: string; role?: Role } }) {
      // Al iniciar sesión, hidratar el token
      if (user) {
        // user viene del return de authorize()
        const u = user
        if (u.id) token.sub = u.id
        token.role = u.role ?? token.role ?? 'user'
        token.name = u.name ?? token.name ?? null
        token.email = u.email ?? token.email ?? null
      } else if (typeof token.email === 'string') {
        // Renovaciones: sincronizar rol/nombre por si cambian en Firestore
        try {
          const found = await getUserByEmail(token.email.toLowerCase())
          if (found) {
            token.role = found.role ?? token.role ?? 'user'
            token.name = found.name ?? token.name ?? null
          }
        } catch {
          // noop
        }
      }
      return token
    },
    async session({
      session,
      token
    }: {
      session: { user?: { id?: string; name?: string | null; email?: string | null; role?: Role } }
      token: JWT
    }) {
      if (session.user) {
        if (token.sub) {
          session.user = session.user || {}
          session.user.id = token.sub
          session.user.role = token.role ?? 'user'
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}

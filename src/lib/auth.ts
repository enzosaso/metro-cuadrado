import type { DefaultSession, NextAuthOptions, User } from 'next-auth'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { usersCol } from '@/lib/firebaseAdmin'
import { compare } from 'bcryptjs'

type Role = 'owner' | 'admin' | 'user' | 'guest'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }

  interface User {
    role?: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role
  }
}

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

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set')
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 24 * 60 * 60, // 60 días en segundos
    updateAge: 24 * 60 * 60 // renueva cada 24 horas
  },
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
          role: user.role ?? 'guest'
        }
      }
    })
  ],
  callbacks: {
    // Extend the default User type to include role
    async jwt({ token, user }) {
      // Al iniciar sesión, hidratar el token
      if (user) {
        // user viene del return de authorize()
        if (user.id) token.sub = user.id
        // Type assertion to handle custom user properties
        const customUser = user as User
        token.role = customUser.role ?? token.role ?? 'guest'
        token.name = user.name ?? token.name ?? null
        token.email = user.email ?? token.email ?? null
      } else if (typeof token.email === 'string') {
        // Renovaciones: sincronizar rol/nombre por si cambian en Firestore
        try {
          const found = await getUserByEmail(token.email.toLowerCase())
          if (found) {
            token.role = found.role ?? token.role ?? 'guest'
            token.name = found.name ?? token.name ?? null
          }
        } catch {
          // noop
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = (token.role as Role) ?? 'guest'
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}

export const auth = NextAuth(authOptions)

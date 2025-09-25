// next-auth.d.ts
import NextAuth, { DefaultSession } from 'next-auth'
import { JWT as DefaultJWT } from 'next-auth/jwt'

type Role = 'owner' | 'admin' | 'user'

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id?: string
      role?: Role
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role?: Role
  }
}

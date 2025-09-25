'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <main className='min-h-screen grid place-content-center p-8'>
      <div className='max-w-xl rounded-2xl border p-6 shadow'>
        <h1 className='text-3xl font-bold text-gray-800'>Metro Cuadrado</h1>
        <p className='mt-2 text-gray-600'>Bienvenido al MVP de presupuestos de obra. 🚀</p>

        <div className='mt-6 flex gap-3'>
          {status === 'loading' ? (
            <span className='text-sm text-muted-foreground'>Cargando…</span>
          ) : session ? (
            <Link
              href='/wizard'
              className='inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50'
            >
              Ir al Wizard
            </Link>
          ) : (
            <>
              <Link
                href='/login'
                className='inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50'
              >
                Iniciar Sesión
              </Link>
              <Link
                href='/login'
                className='inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50'
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

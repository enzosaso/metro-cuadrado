'use client'
import Link from 'next/link'
import { WizardProvider } from '@/wizard/state'
import { signOut, useSession } from 'next-auth/react'

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WizardProvider>
      <div className='min-h-screen'>
        <header className='border-b'>
          <nav className='container flex h-14 items-center justify-between'>
            <Link href='/' className='font-semibold'>
              Metro Cuadrado
            </Link>
            <div className='flex items-center gap-4'>
              <div className='text-sm text-muted-foreground hidden sm:block'>Calculadora de presupuesto</div>
              <UserMenu />
            </div>
          </nav>
        </header>
        <main className='container py-6'>
          <Stepper />
          <div className='mt-6'>{children}</div>
        </main>
      </div>
    </WizardProvider>
  )
}

function Stepper() {
  const steps = [
    { href: '/wizard/select', label: '1. Rubros' },
    { href: '/wizard/edit', label: '2. Cantidades' },
    { href: '/wizard/review', label: '3. Resumen' }
  ]
  return (
    <ol className='grid grid-cols-3 gap-2 text-sm'>
      {steps.map(s => (
        <li key={s.href} className='rounded-xl border border-secondary bg-secondary p-3 text-center cursor-pointer'>
          <Link href={s.href} className='inline-block'>
            {s.label}
          </Link>
        </li>
      ))}
    </ol>
  )
}

function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm font-medium'>{session.user.name || session.user.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className='rounded-xl border px-3 py-1 text-sm hover:bg-muted cursor-pointer'
      >
        Cerrar sesión
      </button>
    </div>
  )
}

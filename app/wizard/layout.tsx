'use client'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { WizardProvider } from '@/wizard/state'
import Button from '@/components/ui/button'

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // redirect si no está logeado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div className='p-6 text-center'>Cargando…</div>
  }

  if (!session) {
    return null // mientras hace el redirect
  }

  if (session?.user?.role === 'guest') {
    return <div className='p-6 text-center'>No puedes acceder a esta página</div>
  }

  return (
    <WizardProvider>
      <div className='min-h-screen container mx-auto px-4 lg:px-0'>
        <header className='border-b'>
          <nav className='flex h-14 items-center justify-between'>
            <Link href='/' className='font-semibold'>
              Metro Cuadrado
            </Link>
            <div className='flex items-center gap-4'>
              <div className='hidden text-sm text-muted-foreground sm:block'>Calculadora de presupuesto</div>
              <UserMenu />
            </div>
          </nav>
        </header>
        <main className='py-6'>
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
        <Link href={s.href} className='inline-block font-semibold' key={s.href}>
          <li className='rounded-xl border border-secondary bg-secondary p-3 text-center text-primary'>{s.label}</li>
        </Link>
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
      <Button
        onClick={() => signOut({ callbackUrl: '/' })}
        className='rounded-xl border px-3 py-1 text-sm bg-white hover:bg-muted'
      >
        Cerrar sesión
      </Button>
    </div>
  )
}

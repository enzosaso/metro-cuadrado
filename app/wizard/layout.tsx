'use client'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WizardProvider } from '@/wizard/state'
import Button from '@/components/ui/button'
import { fmt } from '@/lib/calc'

const SUBSCRIPTION_PRICE = process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // redirect si no está logueado
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') return <div className='p-6 text-center'>Cargando…</div>
  if (!session) return null // mientras redirige

  if (session.user?.role === 'guest') {
    return (
      <main className='min-h-screen grid place-content-center p-6'>
        <SubscriptionCTA />
      </main>
    )
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

function SubscriptionCTA() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mpEmail, setMpEmail] = useState('')

  const startSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/mp/preapproval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpEmail })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo iniciar la suscripción')
      }
      const { init_point } = (await res.json()) as { init_point: string }
      window.location.href = init_point
    } catch {
      setError('Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-[380px] max-w-sm rounded-2xl border bg-background p-6 shadow-sm'>
      <h1 className='text-2xl font-bold text-center'>Suscripción requerida</h1>
      <p className='mt-2 text-sm text-muted-foreground text-center'>
        Ingresá el <strong>email de tu cuenta de Mercado Pago.</strong>
      </p>

      <div className='mt-4 space-y-2'>
        <label className='text-sm' htmlFor='mpEmail'>
          Email de Mercado Pago
        </label>
        <input
          id='mpEmail'
          type='email'
          value={mpEmail}
          onChange={e => setMpEmail(e.target.value)}
          placeholder='tu-email@mercadopago.com'
          className='w-full rounded-xl border px-3 py-2'
          required
        />
      </div>

      <div className='mt-5 rounded-xl border p-4'>
        <div className='flex items-baseline justify-between'>
          <div>
            <div className='text-lg font-semibold'>{fmt(Number(SUBSCRIPTION_PRICE))} / mes</div>
            <div className='text-xs text-muted-foreground'>AR$ por mes · Renovación automática</div>
          </div>
          <Button onClick={startSubscription} disabled={loading || !mpEmail} styleType='primary'>
            {loading ? 'Redirigiendo…' : 'Suscribirme'}
          </Button>
        </div>
        {error && <div className='mt-3 text-sm text-red-600'>{error}</div>}
      </div>

      <p className='mt-3 text-xs text-muted-foreground text-center'>
        Usaremos ese email como titular de la suscripción en Mercado Pago.
      </p>

      <div className='mt-4 flex justify-center'>
        <Link href='/' className='text-primary hover:underline text-sm'>
          Volver al inicio
        </Link>
      </div>
    </div>
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

import Link from 'next/link'
import { WizardProvider } from '@/wizard/state'

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WizardProvider>
      <div className='min-h-screen'>
        <header className='border-b'>
          <nav className='container flex h-14 items-center justify-between'>
            <Link href='/' className='font-semibold'>
              Metro Cuadrado
            </Link>
            <div className='text-sm text-muted-foreground'>MVP Wizard</div>
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
        <li key={s.href} className='rounded-xl border p-3 text-center'>
          <Link href={s.href} className='inline-block'>
            {s.label}
          </Link>
        </li>
      ))}
    </ol>
  )
}

'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { CalculatorIcon, ArrowsPointingOutIcon, CubeIcon, HomeModernIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <main className='min-h-screen bg-white'>
      {/* Hero */}
      <section className='relative overflow-hidden bg-[#17384C] text-white'>
        <div className='mx-auto max-w-6xl px-6 py-10 md:py-16'>
          {/* Top bar */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <HomeModernIcon className='h-10 w-10 text-white' />
              <div>
                <p className='text-3xl font-semibold leading-tight md:text-4xl'>Metro</p>
                <p className='-mt-1 text-2xl font-semibold leading-tight md:text-3xl'>Cuadrado</p>
              </div>
            </div>
          </div>

          {/* Headline + CTA */}
          <div className='mt-10 grid items-center gap-10 md:grid-cols-2 md:gap-6'>
            <div className='max-w-xl'>
              <h1 className='text-4xl font-extrabold leading-tight md:text-5xl'>
                Tu presupuesto <br className='hidden md:block' /> de obra, al instante
              </h1>
              <div className='mt-6'>
                <Link
                  href={session && status === 'authenticated' ? '/wizard' : '/login'}
                  className='inline-flex items-center justify-center rounded-xl bg-[#F4B000] px-6 py-3 text-base font-semibold text-[#17384C] shadow hover:bg-[#e2a200]'
                >
                  Comenzar cálculo
                </Link>
              </div>
            </div>

            <div className='relative mx-auto hidden w-full max-w-md md:block'>
              <HomeModernIcon className='h-48 w-48 text-white/80' />
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className='mx-auto max-w-6xl px-6 py-12 md:py-16'>
        <div className='grid gap-10 md:grid-cols-3'>
          <Feature title='Seleccioná la etapa de obra' Icon={CalculatorIcon} />
          <Feature title='Ingresá los m²' Icon={ArrowsPointingOutIcon} />
          <Feature title='Obtené tu presupuesto estimado' Icon={CubeIcon} />
        </div>

        <p className='mx-auto mt-10 max-w-5xl text-center text-gray-700'>
          Calculá en segundos el costo de tu obra. Editá los metros cuadrados y obtené precios actualizados de mano de
          obra y materiales. Una herramienta simple, rápida y confiable para planificar tu proyecto de construcción.
        </p>
      </section>
    </main>
  )
}

function Feature({ title, Icon }: { title: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) {
  return (
    <div className='flex flex-col items-center text-center'>
      <div className='rounded-2xl border bg-white p-4 shadow-sm'>
        <Icon className='h-10 w-10 text-[#17384C]' />
      </div>
      <h3 className='mt-4 text-lg font-semibold text-gray-900'>{title}</h3>
    </div>
  )
}

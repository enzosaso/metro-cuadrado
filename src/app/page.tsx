export default function Home() {
  return (
    <main className='min-h-screen grid place-content-center p-8'>
      <div className='max-w-xl rounded-2xl border p-6 shadow'>
        <h1 className='text-3xl font-bold text-gray-800'>Metro Cuadrado</h1>
        <p className='mt-2 text-gray-600'>Bienvenido al MVP de presupuestos de obra. 🚀</p>
        <a
          href='/wizard'
          className='mt-6 inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50'
        >
          Ingresar al Wizard
        </a>
      </div>
    </main>
  )
}

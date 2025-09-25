'use client'
import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(params.get('error'))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    if (mode === 'login') {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false
      })
      setLoading(false)
      if (res?.ok) {
        router.push('/wizard')
      } else {
        setErrorMsg('Credenciales inválidas')
      }
    } else {
      // Registro
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Error en el registro')
        }
        // Autologin después de registro
        const loginRes = await signIn('credentials', {
          email,
          password,
          redirect: false
        })
        setLoading(false)
        if (loginRes?.ok) {
          router.push('/wizard')
        } else {
          setErrorMsg('Usuario registrado pero fallo el login')
        }
      } catch (err) {
        setLoading(false)
        setErrorMsg(err instanceof Error ? err.message : 'Error en el registro')
      }
    }
  }

  return (
    <main className='min-h-screen grid place-content-center p-6'>
      <div className='w-[360px] max-w-sm rounded-2xl border bg-background p-6 shadow-sm'>
        <h1 className='text-2xl font-bold'>Metro Cuadrado</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {mode === 'login' ? 'Iniciá sesión para continuar' : 'Creá tu cuenta para empezar'}
        </p>

        <form onSubmit={onSubmit} className='mt-6 space-y-3'>
          {mode === 'register' && (
            <div className='space-y-1'>
              <label className='text-sm' htmlFor='name'>
                Nombre
              </label>
              <input
                id='name'
                type='text'
                className='w-full rounded-xl border px-3 py-2'
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className='space-y-1'>
            <label className='text-sm' htmlFor='email'>
              Email
            </label>
            <input
              id='email'
              type='email'
              autoComplete='username'
              className='w-full rounded-xl border px-3 py-2'
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className='space-y-1'>
            <label className='text-sm' htmlFor='password'>
              Contraseña
            </label>
            <input
              id='password'
              type='password'
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className='w-full rounded-xl border px-3 py-2'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <div className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{errorMsg}</div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-xl bg-primary px-3 py-2 text-white disabled:opacity-50 cursor-pointer'
          >
            {loading
              ? mode === 'login'
                ? 'Ingresando…'
                : 'Registrando…'
              : mode === 'login'
              ? 'Ingresar'
              : 'Registrarse'}
          </button>
        </form>

        <div className='mt-4 text-sm flex justify-between'>
          <Link href='/' className='text-primary hover:underline'>
            Volver al inicio
          </Link>
          <button
            type='button'
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className='text-primary hover:underline cursor-pointer'
          >
            {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
          </button>
        </div>
      </div>
    </main>
  )
}

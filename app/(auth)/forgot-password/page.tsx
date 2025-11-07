'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Email inválido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized })
      })

      // Siempre mostramos éxito para evitar enumeración
      if (!res.ok && res.status !== 400) {
        // 400 lo tratamos como validación de cliente ya cubierta
        console.error('forgot-password error', await res.text())
      }
      setDone(true)
    } catch {
      // No exponemos detalles
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='min-h-screen grid place-content-center p-6'>
      <div className='w-[360px] max-w-sm rounded-2xl border bg-background p-6 shadow-sm'>
        <h1 className='text-2xl font-bold'>Revisa tu email</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Te enviamos un enlace para restablecer tu contraseña.</p>

        {done ? (
          <div className='mt-4 text-sm'>
            <p>
              Si existe una cuenta para <span className='font-medium'>{email}</span>, te enviamos el enlace.
            </p>
            <p className='mt-2'>Revisá tu bandeja de entrada y spam.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className='mt-6 space-y-3'>
            <div className='space-y-1'>
              <label htmlFor='email' className='text-sm'>
                Email
              </label>
              <input
                id='email'
                type='email'
                className='w-full rounded-xl border px-3 py-2'
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete='username'
                required
              />
            </div>

            {error && (
              <div className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</div>
            )}

            <Button type='submit' disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>
        )}

        <div className='mt-4 text-sm flex justify-between'>
          <Link href='/login' className='text-primary hover:underline'>
            Volver a iniciar sesión
          </Link>
          {!done && <span className='text-muted-foreground'> </span>}
        </div>
      </div>
    </main>
  )
}

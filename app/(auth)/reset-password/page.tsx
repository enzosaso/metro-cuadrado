'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/button'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen'>
          <div className='animate-pulse'>Cargando...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [emailMasked, setEmailMasked] = useState<string | null>(null)
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || token.length < 64) {
      setError('Enlace inválido')
      setLoading(false)
      return
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async r => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then(d => setEmailMasked(d.email as string))
      .catch(() => setError('El enlace expiró o es inválido'))
      .finally(() => setLoading(false))
  }, [token])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (pwd !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pwd })
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/login?reset=ok')
    } catch {
      setError('No se pudo establecer la nueva contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className='p-6 text-center'>Verificando enlace…</div>

  return (
    <main className='min-h-screen grid place-content-center p-6'>
      <div className='w-[360px] rounded-2xl border bg-background p-6 shadow-sm'>
        <h1 className='text-2xl font-bold'>Nueva contraseña</h1>
        {emailMasked && <p className='mt-1 text-sm text-muted-foreground'>Cuenta: {emailMasked}</p>}

        <form onSubmit={onSubmit} className='mt-4 space-y-3'>
          <div className='space-y-1'>
            <label htmlFor='pwd' className='text-sm'>
              Contraseña
            </label>
            <input
              id='pwd'
              type='text'
              className='w-full rounded-xl border px-3 py-2'
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              autoComplete='new-password'
              required
            />
          </div>
          <div className='space-y-1'>
            <label htmlFor='confirm' className='text-sm'>
              Confirmar contraseña
            </label>
            <input
              id='confirm'
              type='text'
              className='w-full rounded-xl border px-3 py-2'
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete='new-password'
              required
            />
          </div>

          {error && (
            <div className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</div>
          )}

          <Button type='submit' disabled={submitting} styleType='primary' className='w-full'>
            {submitting ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
        </form>
      </div>
    </main>
  )
}

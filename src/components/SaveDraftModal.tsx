'use client'

import { useState } from 'react'
import { DocumentCheckIcon } from '@heroicons/react/24/solid'
import { useWizard } from '@/wizard/state'
import Button from '@/components/ui/button'

export default function SaveDraftModal() {
  const { state, dispatch } = useWizard()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const now = new Date()
      const id = crypto.randomUUID()
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          createdAt: now,
          updatedAt: now,
          id,
          draft: state.draft
        })
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error guardando el borrador')
      }

      setSuccess(true)
      setOpen(false)
      dispatch({ type: 'SET_NAME', name: state.name })
      dispatch({ type: 'SET_ID', id })
      dispatch({ type: 'SET_CREATED_AT', createdAt: now })
      dispatch({ type: 'SET_UPDATED_AT', updatedAt: now })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!state.id) return
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: state.id, name: state.name, draft: state.draft, updatedAt: new Date() })
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error actualizando el borrador')
      }

      dispatch({ type: 'SET_UPDATED_AT', updatedAt: new Date() })
      setSuccess(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          if (state.id) handleUpdate()
          else setOpen(true)
        }}
        styleType='primary'
        className='px-4'
        disabled={saving}
      >
        <DocumentCheckIcon className='w-4 h-4 mr-2 inline-block' />
        {saving ? 'Guardando…' : state.id ? `Actualizar${state.name ? ` (${state.name})` : ''}` : 'Guardar borrador'}
      </Button>

      {open && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-6 w-[360px] shadow-xl'>
            <h2 className='text-lg font-semibold'>Guardar borrador</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Asignale un nombre a este presupuesto para continuar más tarde.
            </p>

            <input
              type='text'
              placeholder='Ej: Presupuesto cocina'
              value={state.name}
              onChange={e => dispatch({ type: 'SET_NAME', name: e.target.value })}
              className='mt-4 w-full rounded-xl border px-3 py-2'
            />

            {error && (
              <div className='text-sm text-red-600 mt-2 border border-red-100 bg-red-50 rounded-xl px-3 py-1'>
                {error}
              </div>
            )}
            {success && (
              <div className='text-sm text-green-600 mt-2 border border-green-100 bg-green-50 rounded-xl px-3 py-1'>
                Borrador guardado correctamente
              </div>
            )}

            <div className='mt-4 flex justify-end gap-2'>
              <Button onClick={() => setOpen(false)} styleType='tertiary' className='px-4 py-2'>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!state.name || saving} styleType='secondary'>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

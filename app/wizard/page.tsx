'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon } from '@heroicons/react/24/outline'
import type { PersistedBudgetDraft } from '@/types'
import Button from '@/components/ui/button'

export default function WizardEntry() {
  const [draftsDb, setDraftsDb] = useState<PersistedBudgetDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await fetch('/api/drafts', { cache: 'no-store' })
        if (!res.ok) throw new Error('Error al obtener borradores')
        const data = await res.json()
        setDraftsDb(data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }
    fetchDrafts()
  }, [])

  if (loading) return <div className='p-6 text-center'>Cargando borradores…</div>
  if (error) return <div className='p-6 text-center text-red-600'>{error}</div>

  const loadDraft = (draftDb: PersistedBudgetDraft) => {
    // Guardamos el borrador en localStorage (para que el wizard lo lea al iniciar)
    localStorage.setItem(
      'mc_wizard_v1',
      JSON.stringify({
        step: 'select',
        name: draftDb.name,
        id: draftDb.id,
        userId: draftDb.userId,
        createdAt: draftDb.createdAt,
        updatedAt: draftDb.updatedAt,
        draft: draftDb.draft
      } as PersistedBudgetDraft)
    )
    window.dispatchEvent(new Event('wizard-storage-update'))
    router.push('/wizard/select')
  }

  const createNew = () => {
    localStorage.removeItem('mc_wizard_v1')
    window.dispatchEvent(new Event('wizard-storage-update'))
    router.push('/wizard/select')
  }

  const deleteDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('¿Estás seguro de eliminar este borrador?')) return
    try {
      const res = await fetch(`/api/drafts?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar borrador')
      setDraftsDb(draftsDb.filter(d => d.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    }
  }

  return (
    <div className='max-w-sm rounded-2xl border bg-background p-6 mt-12 shadow-sm mx-auto flex flex-col items-center'>
      <h1 className='text-2xl font-bold'>Presupuestos guardados</h1>
      <p className='text-sm text-muted-foreground mt-1'>Elegí un borrador o creá uno nuevo.</p>

      {draftsDb.length > 0 ? (
        <ul className='mt-4 space-y-2'>
          {draftsDb.map(d => {
            const date = new Date(d.updatedAt)
            return (
              <li
                key={d.id}
                className='border rounded-xl px-3 py-2 cursor-pointer hover:bg-muted transition-colors'
                onClick={() => loadDraft(d)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col mr-2'>
                    <div className='font-medium'>{d.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      Última edición: {date ? date.toLocaleString() : 'Fecha desconocida'}
                    </div>
                  </div>
                  <TrashIcon className='ml-2 h-4 w-4 text-red-600' onClick={e => deleteDraft(e, d.id)} />
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className='mt-4 text-sm text-muted-foreground'>No tenés borradores guardados todavía.</div>
      )}

      <Button onClick={createNew} styleType='secondary' className='mt-6'>
        Crear nuevo presupuesto
      </Button>
    </div>
  )
}

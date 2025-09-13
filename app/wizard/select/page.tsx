'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useWizard } from '@/wizard/state'
import { useItems } from '@/hooks/useItems'

export default function SelectStep() {
  const { state, dispatch } = useWizard()
  const { data: items, loading, error } = useItems()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!items) return []
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(
      i => i.name.toLowerCase().includes(s) || i.chapter.toLowerCase().includes(s) || String(i.code).includes(s)
    )
  }, [q, items])

  const canNext = state.draft.selectedItemIds.length > 0

  return (
    <div>
      <h2 className='text-xl font-semibold'>Seleccioná rubros/ítems</h2>

      <div className='mt-4 flex items-center gap-3'>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder='Buscar por código, capítulo o nombre…'
          className='w-full rounded-xl border px-3 py-2'
        />
      </div>

      {loading && <div className='mt-4 text-sm text-muted-foreground'>Cargando ítems…</div>}
      {error && <div className='mt-4 text-sm text-red-600'>Error cargando ítems.</div>}

      {!loading && !error && (
        <ul className='mt-4 grid grid-cols-1 gap-2 md:grid-cols-2'>
          {filtered.map(item => {
            const checked = state.draft.selectedItemIds.includes(item.id)
            return (
              <li key={item.id} className='rounded-xl border p-3'>
                <label className='flex items-start gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={checked}
                    onChange={() => dispatch({ type: 'TOGGLE_SELECT', itemId: item.id })}
                    className='mt-1'
                  />
                  <div className='flex-1'>
                    <div className='font-medium'>{item.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      {/* Cap. {item.code} · {item.chapter} · Unidad: {item.unit} */}
                      {item.code % 100 === 0 ? (
                        <span className='font-semibold text-primary text-lg'>{item.chapter}</span>
                      ) : (
                        `Cap. ${item.code} · ${item.chapter} · Unidad: ${item.unit.toUpperCase()}`
                      )}
                    </div>
                    <div className='text-xs mt-1'>
                      PU Materiales: <strong>${Number(item.pu_materials).toLocaleString()}</strong> · PU Mano de Obra:{' '}
                      <strong>${Number(item.pu_labor).toLocaleString()}</strong>
                    </div>
                  </div>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      <div className='mt-6 flex justify-end gap-2'>
        <Link href='/' className='rounded-xl border px-4 py-2'>
          Cancelar
        </Link>
        <Link
          href={canNext ? '/wizard/edit' : '#'}
          className={`rounded-xl px-4 py-2 ${
            canNext ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground pointer-events-none'
          }`}
        >
          Continuar
        </Link>
      </div>
    </div>
  )
}

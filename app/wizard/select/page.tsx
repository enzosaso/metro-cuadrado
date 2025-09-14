'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useWizard } from '@/wizard/state'
import { useItems } from '@/hooks/useItems'
import type { Item } from '@/types'
import { fmt } from '@/lib/calc'

export default function SelectStep() {
  const { state, dispatch } = useWizard()
  const { data: items, loading, error } = useItems()
  const [q, setQ] = useState('')
  const [openParents, setOpenParents] = useState<Record<number, boolean>>({})

  // Filtro por búsqueda (aplica a padres e hijos; si un hijo matchea, su padre se muestra con ese hijo)
  const { parents, childrenByParent } = useMemo(() => {
    const all = items ?? []
    const s = q.trim().toLowerCase()

    // separar padres e hijos
    const parents = all.filter(i => i.code % 100 === 0)
    const children = all.filter(i => i.code % 100 !== 0)

    // indexar hijos por code base (x00)
    const group: Record<number, Item[]> = {}
    for (const child of children) {
      const base = Math.floor(child.code / 100) * 100
      if (!group[base]) group[base] = []
      group[base].push(child)
    }

    // aplicar búsqueda: si hay query, filtramos por name/chapter/code
    if (s) {
      const matches = (it: Item) =>
        it.name.toLowerCase().includes(s) || it.chapter.toLowerCase().includes(s) || String(it.code).includes(s)

      const filteredParents = parents.filter(p => matches(p) || (group[p.code]?.some(matches) ?? false))
      const filteredGroup: Record<number, Item[]> = {}
      for (const p of filteredParents) {
        const allKids = group[p.code] ?? []
        filteredGroup[p.code] = allKids.filter(matches)
      }
      return {
        parents: filteredParents.sort((a, b) => a.code - b.code),
        childrenByParent: filteredGroup
      }
    }

    // sin búsqueda: devolver todo, hijos ordenados
    for (const k of Object.keys(group)) {
      group?.[+k]?.sort((a, b) => a.code - b.code)
    }
    return {
      parents: parents.sort((a, b) => a.code - b.code),
      childrenByParent: group
    }
  }, [items, q])

  const canNext = state.draft.selectedItems.length > 0

  const toggleOpen = (baseCode: number) => setOpenParents(prev => ({ ...prev, [baseCode]: !prev[baseCode] }))

  const isSelected = (id: string) => state.draft.selectedItems.some(i => i.id === id)

  return (
    <div className='px-4 lg:px-0 lg:max-w-[60vw] mx-auto'>
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
        <div className='mt-4 space-y-3'>
          {parents.map(parent => {
            const kids = childrenByParent[parent.code] ?? []
            const open = openParents[parent.code] ?? Boolean(q) // si hay búsqueda, abrir por defecto
            const hasKids = kids.length > 0

            return (
              <div key={parent.id} className='rounded-2xl border'>
                {/* Header del capítulo (no seleccionable) */}
                <button
                  type='button'
                  onClick={() => hasKids && toggleOpen(parent.code)}
                  className='flex w-full items-center justify-between px-4 py-3 cursor-pointer'
                  aria-expanded={open}
                >
                  <div className='flex items-center gap-3'>
                    <div className='text-left'>
                      <div className='font-semibold text-primary'>{parent.chapter || parent.name}</div>
                    </div>
                  </div>
                  <span className='text-sm'>{open ? '▾' : '▸'}</span>
                </button>

                {/* Lista de hijos seleccionables */}
                {open && hasKids && (
                  <ul className='border-t'>
                    {kids.map(item => {
                      const checked = isSelected(item.id)
                      return (
                        <li key={item.id} className='flex items-start gap-3 px-4 py-3 border-b last:border-b-0'>
                          <input
                            type='checkbox'
                            checked={checked}
                            onChange={() => dispatch({ type: 'TOGGLE_SELECT', item })}
                            className='mt-1 cursor-pointer'
                          />
                          <div className='flex-1'>
                            <div className='font-medium'>{item.name}</div>
                            <div className='text-md font-normal text-shadow-gray-800'>
                              {item.chapter}
                              {item.unit ? ` · Unidad: ${item.unit.toUpperCase()}` : ''}
                            </div>
                            <div className='text-xs mt-1'>
                              {item.pu_materials ? (
                                <>
                                  PU Materiales:{' '}
                                  <strong className={item.pu_materials ? 'mr-2' : ''}>
                                    {fmt(Number(item.pu_materials))}
                                  </strong>
                                </>
                              ) : null}
                              {item.pu_labor ? (
                                <>
                                  PU Mano de Obra: <strong>{fmt(Number(item.pu_labor))}</strong>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                    {kids.length === 0 && (
                      <li className='px-4 py-3 text-sm text-muted-foreground'>Sin ítems en este capítulo.</li>
                    )}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
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

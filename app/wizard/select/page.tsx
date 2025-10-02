'use client'
import { useMemo, useState } from 'react'
import { useWizard } from '@/wizard/state'
import { useItems } from '@/hooks/useItems'
import { fmt } from '@/lib/calc'
import Button from '@/components/ui/button'
import { sortByItemCode, getParentCode, getParentsAndChild } from '@/lib/wizard-helpers'

export default function SelectStep() {
  const { state, dispatch } = useWizard()
  const { data: items = [], isLoading, error } = useItems()
  const [query, setQuery] = useState('')
  const [openParents, setOpenParents] = useState<Record<number, boolean>>({})

  const { parents, childrenByParent } = useMemo(() => getParentsAndChild(items, query), [items, query])

  const canNext = state.draft.selectedItems.length > 0
  const toggleOpen = (baseCode: number) => setOpenParents(prev => ({ ...prev, [baseCode]: !prev[baseCode] }))
  const isSelected = (id: string) => state.draft.selectedItems.some(i => i.id === id)
  const sortSelectedItems = useMemo(() => sortByItemCode(state.draft.selectedItems), [state.draft.selectedItems])

  return (
    <div className='px-4 lg:px-0 lg:max-w-[60vw] mx-auto'>
      <h2 className='text-xl font-semibold'>Seleccioná rubros/ítems</h2>

      <div className='mt-4 flex items-center gap-3'>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Buscar por código, capítulo o nombre…'
          className='w-full rounded-xl border px-3 py-2'
        />
      </div>

      {/* Panel de seleccionados */}
      {sortSelectedItems.length > 0 && (
        <aside className='mt-4 rounded-2xl border p-3'>
          <div className='flex items-center justify-between'>
            <div className='text-sm'>
              Seleccionados: <strong>{sortSelectedItems.length}</strong>
            </div>
            <Button href='/wizard/edit' styleType='secondary' className='px-3 py-1.5 text-sm'>
              Continuar a Cantidades
            </Button>
          </div>
          <ul className='mt-3 grid gap-2 md:grid-cols-2'>
            {sortSelectedItems.map(sel => (
              <li key={sel.id} className='flex items-start justify-between rounded-xl border px-3 py-2'>
                <div className='mr-3'>
                  <div className='font-medium text-sm'>{sel.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    <span className='font-semibold'>
                      {getParentCode(sel.parent_name, parents) ?? ''} {sel.parent_name}
                    </span>
                    <br />
                    {sel.chapter}
                    {sel.unit ? ` · ${sel.unit.toUpperCase()}` : ''}
                  </div>
                  {(sel.pu_materials || sel.pu_labor) && (
                    <div className='text-[11px] mt-1'>
                      {sel.pu_materials ? (
                        <>
                          Mat: <strong>{fmt(Number(sel.pu_materials))}</strong>
                        </>
                      ) : null}
                      {sel.pu_materials && sel.pu_labor ? ' · ' : null}
                      {sel.pu_labor ? (
                        <>
                          MO: <strong>{fmt(Number(sel.pu_labor))}</strong>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
                <Button
                  type='button'
                  onClick={() => dispatch({ type: 'TOGGLE_SELECT', item: sel })}
                  styleType='primary'
                  className='text-xs rounded-lg px-2 py-1 hover:opacity-80'
                  title='Quitar'
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {isLoading && <div className='mt-4 text-sm text-muted-foreground'>Cargando ítems…</div>}
      {error && <div className='mt-4 text-sm text-red-600'>Error cargando ítems.</div>}

      {!isLoading && !error && (
        <div className='mt-4 space-y-3'>
          {parents.map(parent => {
            const kids = childrenByParent[parent.code] ?? []
            const open = openParents[parent.code] ?? Boolean(query)
            if (!kids.length) return null

            return (
              <div key={parent.id} className='rounded-2xl border'>
                <button
                  type='button'
                  onClick={() => toggleOpen(parent.code)}
                  className='flex w-full items-center justify-between px-4 py-3 cursor-pointer'
                  aria-expanded={open}
                >
                  <div className='text-left'>
                    <div className='font-semibold text-primary'>
                      {parent.code / 100}. {parent.chapter || parent.name}
                    </div>
                  </div>
                  <span className='text-sm'>{open ? '▾' : '▸'}</span>
                </button>

                {open && (
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
                            <div className='text-md font-normal'>
                              {item.chapter}
                              {item.unit ? ` · Unidad: ${item.unit.toUpperCase()}` : ''}
                            </div>
                            {(item.pu_materials || item.pu_labor) && (
                              <div className='text-xs mt-1'>
                                {item.pu_materials ? (
                                  <>
                                    PU Mat: <strong>{fmt(Number(item.pu_materials))}</strong>
                                  </>
                                ) : null}
                                {item.pu_materials && item.pu_labor ? ' · ' : null}
                                {item.pu_labor ? (
                                  <>
                                    PU MO: <strong>{fmt(Number(item.pu_labor))}</strong>
                                  </>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className='mt-6 flex justify-end gap-2'>
        <Button href='/' styleType='tertiary'>
          Cancelar
        </Button>
        <Button
          href={canNext ? '/wizard/edit' : '#'}
          className={`rounded-xl px-4 py-2 ${
            canNext ? 'bg-primary text-white' : 'border text-muted-foreground pointer-events-none'
          }`}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}

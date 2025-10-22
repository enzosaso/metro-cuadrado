'use client'
import { useMemo } from 'react'
import { fmt, lineSubtotal, totals } from '@/lib/calc'
import { useWizard } from '@/wizard/state'
import Button from '@/components/ui/button'
import SaveDraftModal from '@/components/SaveDraftModal'
import { getParentCode, getParentsAndChild } from '@/lib/wizard-helpers'
import { useItems } from '@/hooks/useItems'

export default function EditStep() {
  const { state, dispatch } = useWizard()
  const { data: items = [] } = useItems()
  const lines = state.draft.lines

  const canNext = state.draft.selectedItems.every(i => Number(lines[i.id]?.quantity || 0) > 0)
  const t = totals(state.draft.selectedItems, lines, state.draft.markupPercent)
  const { parents } = useMemo(() => getParentsAndChild(items), [items])

  return (
    <div>
      <h2 className='text-xl font-semibold'>Cargá cantidades y ajustes</h2>

      <div className='mt-4'>
        {/* Mobile: cards */}
        <div className='space-y-3 md:hidden'>
          {state.draft.selectedItems.map(it => {
            const line = lines[it.id]!
            const qty = Number(line.quantity || 0)
            const subMat = qty * (it.pu_materials ?? 0)
            const subLab = qty * (it.pu_labor ?? 0)
            const subtotal = lineSubtotal(it, line)
            return (
              <div key={it.id} className='rounded-xl border p-4 shadow-sm'>
                <div className='font-medium'>{it.name}</div>
                <div className='text-xs text-muted-foreground'>
                  {getParentCode(it.parent_name, parents) ?? ''} {it.parent_name}
                </div>
                <div className='text-sm font-semibold text-primary mb-2'>{it.chapter}</div>

                <div className='flex flex-wrap gap-2 text-sm'>
                  <span className='px-2 py-1 rounded bg-muted text-xs'>Unidad: {it.unit.toUpperCase()}</span>
                  <span className='ml-auto'>
                    Subtotal: <strong>{fmt(subtotal)}</strong>
                  </span>
                </div>

                <div className='mt-3 flex flex-col gap-2'>
                  <input
                    inputMode='decimal'
                    value={line.quantity}
                    onChange={e => dispatch({ type: 'SET_LINE', item: it, patch: { quantity: e.target.value } })}
                    placeholder='Cantidad'
                    className='rounded-xl border px-2 py-1 w-full'
                  />
                  <div className='flex justify-between text-xs'>
                    <span>PU Materiales: {it.pu_materials ? fmt(it.pu_materials) : '-'}</span>
                    <span>PU Mano de Obra: {it.pu_labor ? fmt(it.pu_labor) : '-'}</span>
                  </div>
                  <div className='flex justify-between text-xs'>
                    <span>
                      Subtot. Materiales: <strong>{fmt(subMat)}</strong>
                    </span>
                    <span>
                      Subtot. Mano de Obra: <strong>{fmt(subLab)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop: tabla */}
        <div className='hidden md:block overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left border-b'>
                <th className='py-2 pr-2'>Ítem</th>
                <th className='py-2 pr-2 w-24'>Unidad</th>
                <th className='py-2 pr-2 w-28'>Cantidad</th>
                <th className='py-2 pr-2 w-28'>PU Materiales</th>
                <th className='py-2 pr-2 w-28'>PU Mano de Obra</th>
                <th className='py-2 pr-2 w-32 text-right'>Sub. Materiales</th>
                <th className='py-2 pr-2 w-32 text-right'>Sub. Mano de Obra</th>
                <th className='py-2 pr-2 w-32 text-right'>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {state.draft.selectedItems.map(it => {
                const line = lines[it.id]!
                const qty = Number(line.quantity || 0)
                const subMat = qty * (it.pu_materials ?? 0)
                const subLab = qty * (it.pu_labor ?? 0)
                const subtotal = lineSubtotal(it, line)
                return (
                  <tr key={it.id} className='border-b'>
                    <td className='py-2 pr-2'>
                      <div className='font-medium'>{it.name}</div>
                      <div className='text-xs font-semibold text-primary'>
                        {getParentCode(it.parent_name, parents)} {it.parent_name}
                      </div>
                      <div className='text-xs text-muted-foreground'>{it.chapter}</div>
                    </td>
                    <td className='py-2 pr-2'>{it.unit.toUpperCase()}</td>
                    <td className='py-2 pr-2'>
                      <input
                        inputMode='decimal'
                        value={line.quantity}
                        onChange={e => dispatch({ type: 'SET_LINE', item: it, patch: { quantity: e.target.value } })}
                        placeholder='0'
                        className='w-24 rounded-xl border px-2 py-1'
                      />
                    </td>
                    <td className='py-2 pr-2'>{it.pu_materials ? fmt(it.pu_materials) : '-'}</td>
                    <td className='py-2 pr-2'>{it.pu_labor ? fmt(it.pu_labor) : '-'}</td>
                    <td className='py-2 pr-2 text-right'>{fmt(subMat)}</td>
                    <td className='py-2 pr-2 text-right'>{fmt(subLab)}</td>
                    <td className='py-2 pr-2 text-right'>{fmt(subtotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className='mt-4 rounded-2xl border p-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <div>
            Materiales: <strong>{fmt(t.mat)}</strong>
          </div>
          <div>
            Mano de Obra: <strong>{fmt(t.mo)}</strong>
          </div>
          <div>
            Subtotal: <strong>{fmt(t.subtotal)}</strong>
          </div>
          <div className='flex items-center gap-2'>
            <span>Ajuste de obra</span>
            <input
              inputMode='decimal'
              value={state.draft.markupPercent}
              onChange={e => dispatch({ type: 'SET_MARKUP', value: e.target.value })}
              className='w-24 rounded-xl border px-2 py-1'
              placeholder='0.10'
            />
          </div>
          <div className='ml-auto text-lg'>
            Total: <strong>{fmt(t.total)}</strong>
          </div>
        </div>
      </aside>

      <div className='mt-6'>
        <SaveDraftModal />
      </div>

      <div className='mt-6 flex flex-wrap justify-between gap-2'>
        <Button href='/wizard/select' styleType='tertiary'>
          Volver
        </Button>

        <div className='flex gap-2'>
          <Button href={canNext ? '/wizard/review' : '#'} styleType='secondary' disabled={!canNext}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}

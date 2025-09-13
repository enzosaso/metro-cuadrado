'use client'
import Link from 'next/link'
import { fmt, lineSubtotal, totals } from '@/lib/calc'
import { useWizard } from '@/wizard/state'

export default function EditStep() {
  const { state, dispatch } = useWizard()
  console.log(state)
  const canNext = state.draft.selectedItem.every(i => Number(state.draft.lines[i.id]?.quantity || 0) > 0)

  const t = totals(state.draft.selectedItem, state.draft.lines, state.draft.markupPercent)

  return (
    <div>
      <h2 className='text-xl font-semibold'>Cargá cantidades y ajustes</h2>

      <div className='mt-4 overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left border-b'>
              <th className='py-2 pr-2'>Ítem</th>
              <th className='py-2 pr-2 w-24'>Unidad</th>
              <th className='py-2 pr-2 w-28'>Cantidad</th>
              <th className='py-2 pr-2 w-28'>Precio Unitario Materiales</th>
              <th className='py-2 pr-2 w-28'>Precio Unitario Mano de Obra</th>
              <th className='py-2 pr-2 w-32 text-right'>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {state.draft.selectedItem.map(it => {
              const line = state.draft.lines[it.id]!
              const subtotal = lineSubtotal(it, line)
              return (
                <tr key={it.id} className='border-b'>
                  <td className='py-2 pr-2'>
                    <div className='font-medium'>{it.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      Cap. {it.code} · {it.chapter}
                    </div>
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
                  <td className='py-2 pr-2'>{fmt(it.pu_materials)}</td>
                  <td className='py-2 pr-2'>{fmt(it.pu_labor)}</td>
                  <td className='py-2 pr-2 text-right'>{fmt(subtotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
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

      <div className='mt-6 flex justify-between'>
        <Link href='/wizard/select' className='rounded-xl border px-4 py-2'>
          Volver
        </Link>
        <Link
          href={canNext ? '/wizard/review' : '#'}
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

'use client'
import { useState, useMemo } from 'react'
import { fmt, lineSubtotal, totals } from '@/lib/calc'
import { useWizard } from '@/wizard/state'
import Button from '@/components/ui/button'
import { getParentCode, getParentsAndChild } from '@/lib/wizard-helpers'
import { useItems } from '@/hooks/useItems'

export default function ReviewStep() {
  const { state } = useWizard()
  const { data: dbItems = [] } = useItems()
  const items = state.draft.selectedItems
  const lines = state.draft.lines

  const [loading, setLoading] = useState(false)
  const [includeMaterials, setIncludeMaterials] = useState(true)

  const rawTotals = totals(items, lines, state.draft.markupPercent)
  const t = {
    ...rawTotals,
    mat: includeMaterials ? rawTotals.mat : 0,
    subtotal: includeMaterials ? rawTotals.subtotal : rawTotals.subtotal - rawTotals.mat,
    total: includeMaterials ? rawTotals.total : rawTotals.total - rawTotals.mat
  }

  const { parents } = useMemo(() => getParentsAndChild(dbItems), [dbItems])

  // grupos solo para mobile
  const groups = useMemo(() => {
    const map: Record<string, typeof items> = {}
    for (const it of items) {
      const key = it.parent_name || 'Otros'
      if (!map[key]) map[key] = []
      map[key].push(it)
    }
    return map
  }, [items])

  const onPrint = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Presupuesto Metro Cuadrado',
          lines,
          markupPercent: state.draft.markupPercent,
          includeMaterials
        })
      })
      if (!res.ok) throw new Error('Fallo la generación')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='pb-28 md:pb-0'>
      <h2 className='text-xl font-semibold'>Resumen</h2>

      {/* MOBILE: siempre expandido, sin accordions */}
      <div className='mt-4 space-y-4 md:hidden'>
        {Object.entries(groups).map(([parent, group]) => {
          const groupSubtotal = group.reduce((acc, it) => {
            const line = lines[it.id]!
            const qty = Number(line.quantity || 0)
            const sub = includeMaterials ? lineSubtotal(it, line) : qty * (it.pu_labor ?? 0)
            return acc + sub
          }, 0)
          return (
            <section key={parent} className='rounded-2xl border'>
              <header className='flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/40 rounded-t-2xl'>
                <div className='text-sm font-semibold'>
                  {getParentCode(parent, parents) ?? ''} {parent}
                </div>
                <div className='text-sm font-semibold'>{fmt(groupSubtotal)}</div>
              </header>
              <div className='p-3 space-y-3'>
                {group.map(it => {
                  const line = lines[it.id]!
                  const qty = Number(line.quantity || 0)
                  const subMat = includeMaterials ? qty * (it.pu_materials ?? 0) : 0
                  const subLab = qty * (it.pu_labor ?? 0)
                  const sub = includeMaterials
                    ? lineSubtotal(it, line)
                    : Number(line.quantity || 0) * (it.pu_labor ?? 0)
                  return (
                    <div key={it.id} className='rounded-xl border p-3'>
                      <div className='text-sm font-medium'>{it.chapter}</div>
                      <div className='mt-1 text-xs text-muted-foreground'>
                        Unidad {it.unit?.toUpperCase() || '-'} · Cant. {line.quantity || '0'}
                      </div>
                      <div className={`mt-2 grid gap-2 text-xs ${includeMaterials ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {includeMaterials && (
                          <>
                            <div className='rounded bg-muted px-2 py-1'>
                              PU Mat: <strong>{it.pu_materials ? fmt(it.pu_materials) : '-'}</strong>
                            </div>
                            <div className='rounded px-2 py-1 border'>
                              Subtot. Mat: <strong>{fmt(subMat)}</strong>
                            </div>
                          </>
                        )}
                        <div className='rounded bg-muted px-2 py-1'>
                          PU MO: <strong>{it.pu_labor ? fmt(it.pu_labor) : '-'}</strong>
                        </div>
                        <div className='rounded px-2 py-1 border'>
                          Subtot. MO: <strong>{fmt(subLab)}</strong>
                        </div>
                      </div>
                      <div className='mt-2 flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>Subtotal ítem</span>
                        <span className='font-semibold'>{fmt(sub)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* DESKTOP/TABLET: UI original con las dos columnas extra, sin grupos */}
      <div className='hidden md:block mt-4 rounded-2xl border overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left border-b'>
              <th className='py-2 px-3'>Ítem</th>
              <th className='py-2 px-3'>Cant.</th>
              <th className='py-2 px-3'>Unidad</th>
              {includeMaterials && <th className='py-2 px-3 text-right'>Subtot. Materiales</th>}
              <th className='py-2 px-3 text-right'>Subtot. Mano de Obra</th>
              <th className='py-2 px-3 text-right'>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, index) => {
              const line = lines[it.id]!
              const qty = Number(line.quantity || 0)
              const subMat = includeMaterials ? qty * (it.pu_materials ?? 0) : 0
              const subLab = qty * (it.pu_labor ?? 0)
              const sub = includeMaterials ? lineSubtotal(it, line) : Number(line.quantity || 0) * (it.pu_labor ?? 0)
              return (
                <tr key={it.id} className={index === items.length - 1 ? '' : 'border-b'}>
                  <td className='py-2 px-3'>
                    <span className='font-semibold'>
                      {getParentCode(it.parent_name, parents) ?? ''} {it.parent_name}
                    </span>
                    <br />
                    {it.chapter}
                  </td>
                  <td className='py-2 px-3'>{line.quantity || '0'}</td>
                  <td className='py-2 px-3'>{it.unit}</td>
                  {includeMaterials && <td className='py-2 px-3 text-right'>{fmt(subMat)}</td>}
                  <td className='py-2 px-3 text-right'>{fmt(subLab)}</td>
                  <td className='py-2 px-3 text-right'>{fmt(sub)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className='mt-6 flex items-center gap-2'>
        <input
          id='toggle-mat'
          type='checkbox'
          checked={includeMaterials}
          onChange={() => setIncludeMaterials(prev => !prev)}
          className='h-4 w-4'
        />
        <label htmlFor='toggle-mat' className='text-sm'>
          Incluir costos de materiales
        </label>
      </div>

      {/* Totales desktop/tablet */}
      <aside className='mt-4 rounded-2xl border p-4 hidden md:block'>
        <div className='flex flex-wrap items-center gap-4'>
          {includeMaterials && (
            <div>
              Materiales: <strong>{fmt(t.mat)}</strong>
            </div>
          )}
          <div>
            Mano de Obra: <strong>{fmt(t.mo)}</strong>
          </div>
          <div>
            Subtotal: <strong>{fmt(t.subtotal)}</strong>
          </div>
          <div>
            Ajuste de obra: <strong>{(t.markupPercent * 100).toFixed(0)}%</strong>
          </div>
          <div className='ml-auto text-lg'>
            Total: <strong>{fmt(t.total)}</strong>
          </div>
        </div>
      </aside>

      {/* Barra fija mobile */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='mx-auto max-w-screen-sm px-4 py-3'>
          <div className='flex items-center gap-3'>
            <div className='text-sm'>
              Total <strong className='text-base'>{fmt(t.total)}</strong>
              <div className='text-xs text-muted-foreground'>
                {includeMaterials && <>Mat {fmt(t.mat)} · </>}
                MO {fmt(t.mo)} · Ajuste {(t.markupPercent * 100).toFixed(0)}%
              </div>
            </div>
            <div className='ml-auto flex gap-2'>
              <Button href='/wizard/edit' styleType='tertiary'>
                Editar
              </Button>
              <Button onClick={onPrint} disabled={loading} loading={loading} styleType='secondary'>
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Botones desktop */}
      <div className='mt-6 hidden md:flex justify-between'>
        <Button href='/wizard/edit' styleType='tertiary'>
          Editar
        </Button>
        <Button onClick={onPrint} disabled={loading} loading={loading} styleType='secondary'>
          Imprimir / PDF
        </Button>
      </div>
    </div>
  )
}

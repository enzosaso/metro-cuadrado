'use client'
import { useState, useMemo } from 'react'
import { fmt, lineSubtotal, totals } from '@/lib/calc'
import { useWizard } from '@/wizard/state'
import Button from '@/components/ui/button'
import { getParentCode, getParentsAndChild } from '@/lib/wizard-helpers'
import { useItems } from '@/hooks/useItems'
import type { PdfHeader } from '@/types'
import SaveDraftModal from '@/components/SaveDraftModal'

const TITLE_OPTIONS = ['Presupuesto de obra', 'Remodelación', 'Mantenimiento'] as const

export default function ReviewStep() {
  const { state, dispatch } = useWizard()
  const { data: dbItems = [] } = useItems()
  const items = state.draft.selectedItems
  const lines = state.draft.lines

  const [loading, setLoading] = useState(false)
  const [includeMaterials, setIncludeMaterials] = useState(true)

  const header = state.pdfHeader
  const footer = state.pdfFooter

  // Normalize title if legacy value is present
  const safeTitulo = TITLE_OPTIONS.includes(header.title as (typeof TITLE_OPTIONS)[number])
    ? header.title
    : TITLE_OPTIONS[0]

  const rawTotals = totals(items, lines, state.draft.markupPercent)
  const mo = rawTotals.mo
  const mat = includeMaterials ? rawTotals.mat : 0
  const subtotal = mo + mat
  const markup = subtotal * rawTotals.markupPercent
  const total = subtotal + markup
  const t = { ...rawTotals, mat, subtotal, total }

  const { parents } = useMemo(() => getParentsAndChild(dbItems), [dbItems])

  // Groups for mobile rendering
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
          lines,
          markupPercent: state.draft.markupPercent,
          includeMaterials,
          header: { ...state.pdfHeader, title: safeTitulo },
          footer: state.pdfFooter
        })
      })
      if (!res.ok) throw new Error('PDF generation failed')
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

      {/* PDF data form */}
      <section className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border p-4'>
        <div className='space-y-3'>
          <div className='text-sm font-semibold'>Encabezado del PDF</div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <label className='text-sm md:col-span-2'>
              <span className='block text-xs text-muted-foreground'>Título</span>
              <select
                value={safeTitulo}
                onChange={e =>
                  dispatch({ type: 'PATCH_PDF_HEADER', patch: { title: e.target.value as PdfHeader['title'] } })
                }
                className='mt-1 w-full rounded-md border px-2 py-1'
              >
                {TITLE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>

            <label className='text-sm'>
              <span className='block text-xs text-muted-foreground'>Fecha</span>
              <input
                type='date'
                value={header.date}
                onChange={e => dispatch({ type: 'PATCH_PDF_HEADER', patch: { date: e.target.value } })}
                className='mt-1 w-full rounded-md border px-2 py-1'
              />
            </label>

            <label className='text-sm md:col-span-1 col-span-1'>
              <span className='block text-xs text-muted-foreground'>Cliente</span>
              <input
                type='text'
                placeholder='Nombre y apellido'
                value={header.client}
                onChange={e => dispatch({ type: 'PATCH_PDF_HEADER', patch: { client: e.target.value } })}
                className='mt-1 w-full rounded-md border px-2 py-1'
              />
            </label>

            <label className='text-sm md:col-span-2'>
              <span className='block text-xs text-muted-foreground'>Dirección de la obra</span>
              <input
                type='text'
                placeholder='Calle, número, localidad'
                value={header.address}
                onChange={e => dispatch({ type: 'PATCH_PDF_HEADER', patch: { address: e.target.value } })}
                className='mt-1 w-full rounded-md border px-2 py-1'
              />
            </label>

            <label className='text-sm md:col-span-2'>
              <span className='block text-xs text-muted-foreground'>Tiempo estimado de obra</span>
              <input
                type='text'
                placeholder='Ej. 45 días hábiles'
                value={header.timeEstimate}
                onChange={e => dispatch({ type: 'PATCH_PDF_HEADER', patch: { timeEstimate: e.target.value } })}
                className='mt-1 w-full rounded-md border px-2 py-1'
              />
            </label>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='text-sm font-semibold'>Pie del PDF</div>
          <div className='grid grid-cols-1 gap-3'>
            <label className='text-sm'>
              <span className='block text-xs text-muted-foreground'>Emitido por</span>
              <input
                type='text'
                placeholder='Tu nombre o emprendimiento'
                value={footer.issuer}
                onChange={e => dispatch({ type: 'PATCH_PDF_FOOTER', patch: { issuer: e.target.value } })}
                className='mt-1 w-full rounded-md border px-2 py-1'
              />
            </label>
            <label className='text-sm'>
              <span className='block text-xs text-muted-foreground'>Domicilio (opcional)</span>
              <input
                type='text'
                placeholder='Barrio, ciudad'
                value={footer.address ?? ''}
                onChange={e => dispatch({ type: 'PATCH_PDF_FOOTER', patch: { address: e.target.value } })}
                className='mt-1 w-full rounded-md border px-2 py-1'
              />
            </label>
            <label className='text-sm'>
              <span className='block text-xs text-muted-foreground'>Teléfono o correo (opcional)</span>
              <input
                type='text'
                placeholder='Ej. 123456789 o tuemail@gmail.com'
                value={footer.contact ?? ''}
                onChange={e => dispatch({ type: 'PATCH_PDF_FOOTER', patch: { contact: e.target.value } })}
                className='mt-1 w-full rounded-md border px-2 py-1'
              />
            </label>
          </div>
        </div>
      </section>

      {/* Mobile list */}
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
                  const sub = includeMaterials ? lineSubtotal(it, line) : subLab
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

      {/* Desktop table */}
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
              const sub = includeMaterials ? lineSubtotal(it, line) : subLab
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

      {/* Totals */}
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

      {/* Mobile fixed bar */}
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

      <div className='mt-6'>
        <SaveDraftModal />
      </div>

      {/* Desktop actions */}
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

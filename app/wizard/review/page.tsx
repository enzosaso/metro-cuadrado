'use client'
import { useState } from 'react'
import { fmt, lineSubtotal, totals } from '@/lib/calc'
import { useWizard } from '@/wizard/state'
import Button from '@/components/ui/button'

export default function ReviewStep() {
  const { state } = useWizard()
  const items = state.draft.selectedItems
  const t = totals(items, state.draft.lines, state.draft.markupPercent)
  const [loading, setLoading] = useState(false)

  const onPrint = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Presupuesto Metro Cuadrado',
          lines: state.draft.lines,
          markupPercent: state.draft.markupPercent
        })
      })
      if (!res.ok) throw new Error('Fallo la generación')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      // Abrir en nueva pestaña (o forzar descarga)
      window.open(url, '_blank')
      // Para descarga directa:
      // const a = document.createElement("a"); a.href = url; a.download = "presupuesto.pdf"; a.click(); URL.revokeObjectURL(url);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className='text-xl font-semibold'>Resumen</h2>
      <div className='mt-4 rounded-2xl border'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left border-b'>
              <th className='py-2 px-3'>Ítem</th>
              <th className='py-2 px-3'>Cant.</th>
              <th className='py-2 px-3'>Unidad</th>
              <th className='py-2 px-3 text-right'>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, index) => {
              const line = state.draft.lines[it.id]!
              const sub = lineSubtotal(it, line)
              return (
                <tr key={it.id} className={index === items.length - 1 ? '' : 'border-b'}>
                  <td className='py-2 px-3'>
                    <span className='font-semibold'>{it.parent_name}</span>
                    <br />
                    {it.chapter}
                  </td>
                  <td className='py-2 px-3'>{line.quantity || '0'}</td>
                  <td className='py-2 px-3'>{it.unit}</td>
                  <td className='py-2 px-3 text-right'>{fmt(sub)}</td>
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
          <div>
            Ajuste de obra: <strong>{(t.markupPercent * 100).toFixed(0)}%</strong>
          </div>
          <div className='ml-auto text-lg'>
            Total: <strong>{fmt(t.total)}</strong>
          </div>
        </div>
      </aside>

      <div className='mt-6 flex justify-between'>
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

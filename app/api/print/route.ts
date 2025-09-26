import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QuoteDoc from '@/pdf/QuoteDoc'
import type { LineDraft } from '@/types'

export const runtime = 'nodejs' // fuerza Node (no Edge)
export const dynamic = 'force-dynamic' // no cachear en build

export async function POST(req: NextRequest) {
  try {
    const { title, lines, markupPercent } = (await req.json()) as {
      title: string
      lines: Record<string, LineDraft>
      markupPercent: string
    }

    // Filtrar solo ítems presentes
    const selectedItems = Object.values(lines).map(l => l.item)

    const pdf = await renderToBuffer(
      QuoteDoc({ title: title || 'Presupuesto', items: selectedItems, lines, markupPercent })
    )

    // Convert Buffer to Uint8Array and then to Blob for proper Response handling
    const pdfArray = new Uint8Array(pdf)
    const blob = new Blob([pdfArray], { type: 'application/pdf' })

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(title || 'presupuesto').replace(/\s+/g, '-')}.pdf"`
      }
    })
  } catch (err) {
    console.error(err)
    return new Response('Error generando PDF', { status: 500 })
  }
}

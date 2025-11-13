import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QuoteDoc from '@/pdf/QuoteDoc'
import type { LineDraft } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PdfHeader = {
  title?: 'Presupuesto de obra' | 'Remodelación' | 'Mantenimiento'
  date?: string // yyyy-mm-dd
  client?: string
  address?: string
  timeEstimate?: string
}

type PdfFooter = {
  issuer?: string
  address?: string
  contact?: string
}

const TITLE_OPTIONS = ['Presupuesto de obra', 'Remodelación', 'Mantenimiento'] as const

function isValidTitle(t?: string): t is (typeof TITLE_OPTIONS)[number] {
  return !!t && (TITLE_OPTIONS as readonly string[]).includes(t)
}

function toDDMMYYYY(input?: string): string {
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [yyyy, mm, dd] = input.split('-')
    return `${dd}/${mm}/${yyyy}`
  }

  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()

  return `${dd}/${mm}/${yyyy}`
}

export async function POST(req: NextRequest) {
  try {
    const {
      lines,
      markupPercent,
      includeMaterials,
      header,
      footer
    }: {
      title?: string
      lines?: Record<string, LineDraft>
      markupPercent?: string
      includeMaterials?: boolean
      header?: PdfHeader
      footer?: PdfFooter
    } = await req.json()

    const safeLines: Record<string, LineDraft> = lines ?? {}
    const selectedItems = Object.values(safeLines).map(l => l.item)

    const safeHeader = {
      title: isValidTitle(header?.title) ? header!.title : TITLE_OPTIONS[0],
      date: toDDMMYYYY(header?.date),
      client: header?.client ?? '',
      address: header?.address ?? '',
      timeEstimate: header?.timeEstimate ?? ''
    }

    const safeFooter = {
      issuer: footer?.issuer ?? '',
      address: footer?.address || '',
      contact: footer?.contact || ''
    }

    const safeIncludeMaterials = includeMaterials ?? true
    const safeMarkup = markupPercent ?? '0.10'

    const pdfBuffer = await renderToBuffer(
      QuoteDoc({
        items: selectedItems,
        lines: safeLines,
        markupPercent: safeMarkup,
        includeMaterials: safeIncludeMaterials,
        header: safeHeader,
        footer: safeFooter
      })
    )

    const filenameBase = `${safeHeader.title}-${safeHeader.client || 'cliente'}-${safeHeader.date}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_/]/g, '')

    const pdfArray = new Uint8Array(pdfBuffer)
    const blob = new Blob([pdfArray], { type: 'application/pdf' })

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filenameBase || 'presupuesto'}.pdf"`
      }
    })
  } catch (err) {
    console.error(err)
    return new Response('Error generando PDF', { status: 500 })
  }
}

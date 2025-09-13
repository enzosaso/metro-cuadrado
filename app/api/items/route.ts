import { NextResponse } from 'next/server'
import { fetchCsv } from '@/lib/csv'
import { ITEMS as FALLBACK } from '@/lib/mock-items'
import type { Item } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.SHEETS_ITEMS_CSV_URL
    if (!url) return NextResponse.json(FALLBACK)
    const rows = await fetchCsv<Item>(url)

    // Mapear columnas del Sheet a Item
    const items = rows.map((r, idx) => ({
      id: r.id || `row-${idx}`,
      code: Number(r.code ?? 0),
      chapter: r.chapter ?? '',
      name: r.name ?? '',
      unit: (r.unit ?? 'u').toLowerCase(),
      pu_materials: Number(r.pu_materials ?? 0),
      pu_labor: Number(r.pu_labor ?? 0)
    }))

    return NextResponse.json(items, { headers: { 'Cache-Control': 's-maxage=60' } })
  } catch (e) {
    console.error(e)
    return NextResponse.json(FALLBACK, { status: 200 })
  }
}

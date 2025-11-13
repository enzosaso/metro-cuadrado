import type { Item, LineDraft } from '@/types'

/** convierte string decimal -> number seguro (solo para MVP) */
const D = (v: string | number | undefined) => Number(v ?? 0) || 0

export function lineSubtotal(item: Item, line: LineDraft) {
  const qty = D(line.quantity)

  const puMat = line.puMaterials !== undefined && line.puMaterials !== '' ? D(line.puMaterials) : D(item.pu_materials)

  const puLab = line.puLabor !== undefined && line.puLabor !== '' ? D(line.puLabor) : D(item.pu_labor)

  return qty * (puMat + puLab)
}

export function totals(items: Item[], lines: Record<string, LineDraft>, markupPercent: string) {
  let mat = 0
  let mo = 0
  let subtotal = 0

  for (const it of items) {
    const line = lines[it.id]
    if (!line) continue
    const qty = D(line.quantity)

    const puMat = line.puMaterials !== undefined && line.puMaterials !== '' ? D(line.puMaterials) : D(it.pu_materials)

    const puLab = line.puLabor !== undefined && line.puLabor !== '' ? D(line.puLabor) : D(it.pu_labor)

    mat += qty * puMat
    mo += qty * puLab
    subtotal += qty * (puMat + puLab)
  }
  const m = D(markupPercent)
  const total = subtotal * (1 + m)
  return { mat, mo, subtotal, markupPercent: m, total }
}

export const fmt = (n: number) =>
  n.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  })

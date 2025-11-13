// types.ts
export type Unit = 'm2' | 'm3' | 'ml' | 'u'

export interface Item {
  id: string // slug único (ej: "contrapiso_12")
  code: number // código del ítem (ej: 1201)
  chapter: string // nombre del capítulo (ej: "Contrapisos")
  name: string // descripción (ej: "Contrapiso sobre terreno natural")
  unit: Unit
  parent_name: string // nombre del capítulo padre (ej: "Pisos")
  pu_materials: number // precio unitario materiales
  pu_labor: number // precio unitario mano de obra
}

export interface LineDraft {
  item: Item
  quantity: string // cantidad en texto (p. ej. "12.5")
  puMaterialsOverride?: string // override manual opcional
  puLaborOverride?: string // override manual opcional
}

export interface BudgetDraft {
  selectedItems: Item[] // ítems seleccionados
  lines: Record<string, LineDraft> // key = item.id
  markupPercent: string // markup decimal como string (ej: "0.10")
}

export interface PdfHeader {
  title: 'Presupuesto de obra' | 'Remodelación' | 'Mantenimiento'
  date: string // yyyy-mm-dd
  client: string
  address: string
  timeEstimate: string
}

export interface PdfFooter {
  issuer: string
  address?: string
  contact?: string
}

export interface PersistedBudgetDraft {
  name: string
  createdAt: Date
  updatedAt: Date
  id: string
  userId: string
  draft: BudgetDraft
  pdfHeader: PdfHeader
  pdfFooter: PdfFooter
}

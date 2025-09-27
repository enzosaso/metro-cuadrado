export type Unit = 'm2' | 'm3' | 'ml' | 'u'

export interface Item {
  id: string // slug único
  code: number // capítulo (12, 16, etc.)
  chapter: string // nombre del capítulo
  name: string // descripción
  unit: Unit
  parent_name: string
  pu_materials: number // números chicos para MVP (ARS)
  pu_labor: number
}

export interface LineDraft {
  item: Item
  quantity: string // decimal como string
  puMaterialsOverride?: string
  puLaborOverride?: string
}

export interface BudgetDraft {
  selectedItems: Item[]
  lines: Record<string, LineDraft> // key = itemId
  markupPercent: string // "0.10" (10%)
}

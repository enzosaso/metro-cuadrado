import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Item, LineDraft, PdfHeader, PdfFooter } from '@/types'
import { lineSubtotal, totals, fmt } from '@/lib/calc'

const groupByParent = (items: Item[], lines: Record<string, LineDraft>) => {
  const groups: Record<string, Item[]> = {}
  items.forEach(it => {
    if (!lines[it.id]) return
    const key = it.parent_name || 'Otros'
    if (!groups[key]) groups[key] = []
    groups[key].push(it)
  })
  return groups
}

const COL_WITH_MAT = { item: 36, qty: 10, unit: 10, mat: 16, labor: 16, total: 12 } as const
const COL_NO_MAT = { item: 44, qty: 10, unit: 10, labor: 24, total: 12 } as const

const pct = (n: number) => `${n}%`

const HEADER_BG = '#f7f7f7'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 2 },
  h1: { fontSize: 18, fontWeight: 700 },

  // ✅ Cada línea del header como fila separada (sin \n)
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaLabel: { color: '#444', fontWeight: 700 },
  metaValue: { color: '#444' },

  table: { marginTop: 12, borderWidth: 1, borderColor: '#ddd' },

  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    minHeight: 20
  },

  trHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'stretch',
    minHeight: 44
  },

  cell: { flexGrow: 0, flexShrink: 0 },

  td: { padding: 4 },

  thCell: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 6,
    justifyContent: 'flex-end'
  },
  thText: { fontWeight: 700, lineHeight: 0.9 },
  thLeft: { textAlign: 'left' },
  thCenter: { textAlign: 'center' },
  thRight: { textAlign: 'right' },

  itemText: { lineHeight: 1 },
  num: { textAlign: 'right' },

  totals: { marginTop: 12, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  footerWrap: { marginTop: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
  small: { fontSize: 9, color: '#555' }
})

export interface QuoteDocProps {
  items: Item[]
  lines: Record<string, LineDraft>
  markupPercent: string
  includeMaterials: boolean
  header: PdfHeader
  footer: PdfFooter
}

const numOr = (val: unknown, fallback: number) => {
  if (val === undefined || val === '') return fallback
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

const qtyOf = (line: LineDraft) => {
  const n = Number(line.quantity ?? 0)
  return Number.isFinite(n) ? n : 0
}

const getUnitPrices = (item: Item, line: LineDraft) => {
  const puMaterials = numOr(line.puMaterials, item.pu_materials ?? 0)
  const puLabor = numOr(line.puLabor, item.pu_labor ?? 0)
  return { puMaterials, puLabor }
}

export default function QuoteDoc({ items, lines, markupPercent, includeMaterials, header, footer }: QuoteDocProps) {
  const chosen = items.filter(i => lines[i.id])
  const groups = groupByParent(chosen, lines)

  const rawTotals = totals(chosen, lines, markupPercent)
  const mo = rawTotals.mo
  const mat = includeMaterials ? rawTotals.mat : 0
  const subtotal = mo + mat
  const markup = subtotal * rawTotals.markupPercent
  const total = subtotal + markup
  const t = { ...rawTotals, mat, subtotal, total }

  const showMaterialsCol = includeMaterials && t.mat > 0
  const activeCols = showMaterialsCol ? COL_WITH_MAT : COL_NO_MAT
  const groupLabelWidth = pct(100 - activeCols.total)

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.h1}>{header.title}</Text>

          {/* ✅ Mantiene TODAS las líneas con el mismo formato */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Fecha:</Text>
            <Text style={styles.metaValue}>{header.date}</Text>
          </View>

          {header.client && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Cliente:</Text>
              <Text style={styles.metaValue}>{header.client}</Text>
            </View>
          )}

          {header.address && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Dirección de la obra:</Text>
              <Text style={styles.metaValue}>{header.address}</Text>
            </View>
          )}

          {header.timeEstimate && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tiempo estimado de obra:</Text>
              <Text style={styles.metaValue}>{header.timeEstimate}</Text>
            </View>
          )}
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.trHead} wrap={false}>
            <View style={[styles.thCell, styles.cell, { width: pct(activeCols.item) }]}>
              <Text style={[styles.thText, styles.thLeft]}>Ítem</Text>
            </View>

            <View style={[styles.thCell, styles.cell, { width: pct(activeCols.qty) }]}>
              <Text style={[styles.thText, styles.thCenter]}>Cant.</Text>
            </View>

            <View style={[styles.thCell, styles.cell, { width: pct(activeCols.unit) }]}>
              <Text style={[styles.thText, styles.thCenter]}>Unidad</Text>
            </View>

            {showMaterialsCol && (
              <View style={[styles.thCell, styles.cell, { width: pct(COL_WITH_MAT.mat) }]}>
                <Text style={[styles.thText, styles.thRight]}>{'Sub.\nMateriales'}</Text>
              </View>
            )}

            <View style={[styles.thCell, styles.cell, { width: pct(activeCols.labor) }]}>
              <Text style={[styles.thText, styles.thRight]}>
                {showMaterialsCol ? 'Sub.\nMano de Obra' : 'Sub. Mano de Obra'}
              </Text>
            </View>

            <View style={[styles.thCell, styles.cell, { width: pct(activeCols.total) }]}>
              <Text style={[styles.thText, styles.thRight]}>Subtotal</Text>
            </View>
          </View>

          {Object.entries(groups).map(([parent, group]) => {
            const groupSubtotal = group.reduce((acc, it) => {
              const line = lines[it.id]!
              const qty = qtyOf(line)
              const { puLabor } = getUnitPrices(it, line)
              const sub = includeMaterials ? lineSubtotal(it, line) : qty * puLabor
              return acc + sub
            }, 0)

            return (
              <React.Fragment key={parent}>
                <View style={[styles.tr, { backgroundColor: '#fafafa' }]} wrap={false}>
                  <Text style={[styles.td, styles.cell, { width: groupLabelWidth, fontWeight: 700 }]}>{parent}</Text>
                  <Text style={[styles.td, styles.cell, styles.num, { width: pct(activeCols.total), fontWeight: 700 }]}>
                    {fmt(groupSubtotal)}
                  </Text>
                </View>

                {group.map(it => {
                  const line = lines[it.id]!
                  const qty = qtyOf(line)
                  const { puMaterials, puLabor } = getUnitPrices(it, line)

                  const subMat = includeMaterials ? qty * puMaterials : 0
                  const subLab = qty * puLabor
                  const sub = includeMaterials ? lineSubtotal(it, line) : subLab

                  return (
                    <View key={it.id} style={styles.tr} wrap={false}>
                      <Text style={[styles.td, styles.cell, { width: pct(activeCols.item) }]}>
                        <Text style={styles.itemText}>{it.chapter}</Text>
                      </Text>

                      <Text style={[styles.td, styles.cell, { width: pct(activeCols.qty), textAlign: 'center' }]}>
                        {line.quantity || '0'}
                      </Text>

                      <Text style={[styles.td, styles.cell, { width: pct(activeCols.unit), textAlign: 'center' }]}>
                        {it.unit}
                      </Text>

                      {showMaterialsCol && (
                        <Text style={[styles.td, styles.cell, styles.num, { width: pct(COL_WITH_MAT.mat) }]}>
                          {subMat > 0 ? fmt(subMat) : '-'}
                        </Text>
                      )}

                      <Text style={[styles.td, styles.cell, styles.num, { width: pct(activeCols.labor) }]}>
                        {subLab > 0 ? fmt(subLab) : '-'}
                      </Text>

                      <Text style={[styles.td, styles.cell, styles.num, { width: pct(activeCols.total) }]}>
                        {fmt(sub)}
                      </Text>
                    </View>
                  )
                })}
              </React.Fragment>
            )
          })}
        </View>

        {/* Totals */}
        <View style={styles.totals} wrap={false}>
          {showMaterialsCol && (
            <View style={styles.row}>
              <Text>Materiales</Text>
              <Text>{fmt(t.mat)}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text>Mano de Obra</Text>
            <Text>{fmt(t.mo)}</Text>
          </View>

          {t.subtotal !== t.total && (
            <View style={styles.row}>
              <Text>Subtotal</Text>
              <Text>{fmt(t.subtotal)}</Text>
            </View>
          )}

          {t.markupPercent > 0 && (
            <View style={styles.row}>
              <Text>Ajuste de obra</Text>
              <Text>{(t.markupPercent * 100).toFixed(0)}%</Text>
            </View>
          )}

          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={{ fontWeight: 700 }}>Total</Text>
            <Text style={{ fontWeight: 700 }}>{fmt(t.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerWrap} wrap={false}>
          {footer.customLabel && (
            <View
              style={{
                marginBottom: 10,
                padding: 8,
                borderTop: '1px solid #eee',
                borderBottom: '1px solid #eee',
                backgroundColor: '#fafafa'
              }}
            >
              <Text style={{ color: '#666', fontSize: 9, textAlign: 'center', fontStyle: 'italic' }}>
                {footer.customLabel}
              </Text>
            </View>
          )}
          <Text style={styles.small}>
            {footer.issuer && `Emitido por: ${footer.issuer}`}
            {footer.address && ` | Domicilio: ${footer.address}`}
            {footer.contact && ` | Contacto: ${footer.contact}`}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

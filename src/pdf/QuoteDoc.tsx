import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Item, LineDraft } from '@/types'
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

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 12 },
  h1: { fontSize: 18, fontWeight: 700 },
  meta: { color: '#666', marginTop: 4 },
  table: { marginTop: 12, borderWidth: 1, borderColor: '#ddd' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
  th: { padding: 6, fontWeight: 700, backgroundColor: '#f7f7f7', flexGrow: 1 },
  td: { padding: 6, flexGrow: 1 },
  right: { textAlign: 'right' },
  totals: { marginTop: 12, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' }
})

export interface QuoteDocProps {
  title: string
  items: Item[]
  lines: Record<string, LineDraft>
  markupPercent: string
  includeMaterials: boolean
}

export default function QuoteDoc({ title, items, lines, markupPercent, includeMaterials }: QuoteDocProps) {
  const chosen = items.filter(i => lines[i.id])
  const groups = groupByParent(chosen, lines)

  const rawTotals = totals(chosen, lines, markupPercent)
  const mo = rawTotals.mo
  const mat = includeMaterials ? rawTotals.mat : 0
  const subtotal = mo + mat
  const markup = subtotal * rawTotals.markupPercent
  const total = subtotal + markup

  const t = {
    ...rawTotals,
    mat,
    subtotal,
    total
  }

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.h1}>Presupuesto</Text>
          <Text style={styles.meta}>
            {title} · {new Date().toLocaleDateString('es-AR')}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { flexBasis: '36%' }]}>Ítem</Text>
            <Text style={[styles.th, { flexBasis: '10%' }]}>Cant.</Text>
            <Text style={[styles.th, { flexBasis: '10%' }]}>Unidad</Text>
            {includeMaterials && <Text style={[styles.th, { flexBasis: '16%' }, styles.right]}>Sub. Materiales</Text>}
            <Text style={[styles.th, { flexBasis: '16%' }, styles.right]}>Sub. Mano de Obra</Text>
            <Text style={[styles.th, { flexBasis: '12%' }, styles.right]}>Subtotal</Text>
          </View>

          {Object.entries(groups).map(([parent, group]) => {
            // subtotal de grupo dinámico
            const groupSubtotal = group.reduce((acc, it) => {
              const line = lines[it.id]!
              const qty = Number(line.quantity || 0)
              const sub = includeMaterials ? lineSubtotal(it, line) : qty * (it.pu_labor ?? 0)
              return acc + sub
            }, 0)

            return (
              <React.Fragment key={parent}>
                {/* Encabezado de grupo */}
                <View style={[styles.tr, { backgroundColor: '#fafafa' }]}>
                  <Text style={[styles.th, { flexBasis: '88%' }]}>{parent}</Text>
                  <Text style={[styles.th, styles.right, { flexBasis: '12%' }]}>{fmt(groupSubtotal)}</Text>
                </View>

                {/* Filas de ítems */}
                {group.map(it => {
                  const line = lines[it.id]!
                  const qty = Number(line.quantity || 0)
                  const subMat = qty * (it.pu_materials ?? 0)
                  const subLab = qty * (it.pu_labor ?? 0)
                  const sub = includeMaterials ? lineSubtotal(it, line) : subLab

                  return (
                    <View key={it.id} style={styles.tr}>
                      <Text style={[styles.td, { flexBasis: '36%' }]}>{it.chapter}</Text>
                      <Text style={[styles.td, { flexBasis: '10%' }]}>{line.quantity || '0'}</Text>
                      <Text style={[styles.td, { flexBasis: '10%' }]}>{it.unit}</Text>
                      {includeMaterials && (
                        <Text style={[styles.td, styles.right, { flexBasis: '16%' }]}>
                          {subMat ? fmt(subMat) : '-'}
                        </Text>
                      )}
                      <Text style={[styles.td, styles.right, { flexBasis: '16%' }]}>{subLab ? fmt(subLab) : '-'}</Text>
                      <Text style={[styles.td, styles.right, { flexBasis: '12%' }]}>{fmt(sub)}</Text>
                    </View>
                  )
                })}
              </React.Fragment>
            )
          })}
        </View>

        <View style={styles.totals}>
          {includeMaterials && (
            <View style={styles.row}>
              <Text>Materiales</Text>
              <Text>{fmt(t.mat)}</Text>
            </View>
          )}
          {includeMaterials && (
            <View style={styles.row}>
              <Text>Mano de Obra</Text>
              <Text>{fmt(t.mo)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>{fmt(t.subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Ajuste de obra</Text>
            <Text>{(t.markupPercent * 100).toFixed(0)}%</Text>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={{ fontWeight: 700 }}>Total</Text>
            <Text style={{ fontWeight: 700 }}>{fmt(t.total)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

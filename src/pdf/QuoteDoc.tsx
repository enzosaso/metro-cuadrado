import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Item, LineDraft } from '@/types'
import { lineSubtotal, totals, fmt } from '@/lib/calc'

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
}

export default function QuoteDoc({ title, items, lines, markupPercent }: QuoteDocProps) {
  const chosen = items.filter(i => lines[i.id])
  const t = totals(chosen, lines, markupPercent)

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.h1}>Metro Cuadrado — Presupuesto</Text>
          <Text style={styles.meta}>
            {title} · {new Date().toLocaleDateString('es-AR')}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { flexBasis: '52%' }]}>Ítem</Text>
            <Text style={[styles.th, { flexBasis: '12%' }]}>Cant.</Text>
            <Text style={[styles.th, { flexBasis: '12%' }]}>Unidad</Text>
            <Text style={[styles.th, { flexBasis: '24%' }, styles.right]}>Subtotal</Text>
          </View>

          {chosen.map(it => {
            const line = lines[it.id]!
            const sub = lineSubtotal(it, line)
            return (
              <View key={it.id} style={styles.tr}>
                <Text style={[styles.td, { flexBasis: '52%' }]}>{it.name}</Text>
                <Text style={[styles.td, { flexBasis: '12%' }]}>{line.quantity || '0'}</Text>
                <Text style={[styles.td, { flexBasis: '12%' }]}>{it.unit}</Text>
                <Text style={[styles.td, { flexBasis: '24%' }, styles.right]}>{fmt(sub)}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.totals}>
          <View style={styles.row}>
            <Text>Materiales</Text>
            <Text>{fmt(t.mat)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Mano de Obra</Text>
            <Text>{fmt(t.mo)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>{fmt(t.subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Markup</Text>
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

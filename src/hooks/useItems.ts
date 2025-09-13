'use client'
import { useEffect, useState } from 'react'
import type { Item } from '@/types'

export function useItems() {
  const [data, setData] = useState<Item[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/items', { cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudo cargar /api/items')
        const json = (await res.json()) as Item[]
        if (alive) setData(json)
      } catch (e: Error | unknown) {
        if (alive) setError(e instanceof Error ? e : new Error('Error al cargar ítems'))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return { data, error, loading }
}

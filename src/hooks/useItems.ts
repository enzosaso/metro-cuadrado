'use client'
import { useQuery } from '@tanstack/react-query'
import type { Item } from '@/types'

const fetchItems = async (): Promise<Array<Item>> => {
  const response = await fetch('/api/items')
  const data = await response.json()
  return data
}

export function useItems() {
  const query = useQuery({
    queryKey: ['items'],
    queryFn: () => fetchItems(),
    refetchOnWindowFocus: false
  })

  return query
}

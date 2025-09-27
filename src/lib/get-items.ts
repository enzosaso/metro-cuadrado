import { queryOptions } from '@tanstack/react-query'

export const itemsOptions = queryOptions({
  queryKey: ['items'],
  queryFn: async () => {
    const response = await fetch('/api/items')

    return response.json()
  }
})

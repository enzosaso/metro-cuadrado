'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { getQueryClient } from '@/lib/get-query-client'

type Props = {
  children: React.ReactNode
}

export default function ProviderWrapper({ children }: Props) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  )
}

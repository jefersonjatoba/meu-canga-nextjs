'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/contexts/AuthContext'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // 5 min — evita refetch desnecessário
            gcTime: 10 * 60 * 1000,     // 10 min — mantém cache em memória
            retry: 1,
            refetchOnWindowFocus: false, // não refaz ao voltar para a aba
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

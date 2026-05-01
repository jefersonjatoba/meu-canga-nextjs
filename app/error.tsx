'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Algo deu errado
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}

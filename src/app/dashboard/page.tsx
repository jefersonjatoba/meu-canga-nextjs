'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-2xl">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">Meu Canga</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Bem-vindo!
          </h2>
          <div className="space-y-4">
            <p className="text-lg text-slate-700">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-lg text-slate-700">
              <strong>ID:</strong> {user.id}
            </p>
            <p className="text-lg text-slate-700">
              <strong>Criado em:</strong> {new Date(user.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">
              ✅ Autenticação funcionando perfeitamente!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

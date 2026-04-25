'use client'

import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { Home, Settings, LogOut } from 'lucide-react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/escala', label: 'Escala', icon: Home },
  { href: '/dashboard/ras', label: 'RAS', icon: Home },
  { href: '/dashboard/lancamentos', label: 'Lançamentos', icon: Home },
  { href: '/dashboard/investimentos', label: 'Investimentos', icon: Home },
  { href: '/dashboard/metas', label: 'Metas', icon: Home },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useUser()
  const { signOut } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-gray dark:bg-precision-black">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-accent-blue border-r-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-light-gray dark:bg-precision-black">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white dark:bg-dark-gray border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <Link href="/dashboard" className="font-bold text-2xl text-accent-blue block mb-8">
          Meu Canga
        </Link>

        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-gray transition-colors"
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom menu */}
        <div className="absolute bottom-6 left-6 right-6 border-t pt-4">
          <Link
            href="/dashboard/configuracoes"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-gray transition-colors mb-2"
          >
            <Settings size={20} />
            <span className="text-sm font-medium">Configurações</span>
          </Link>

          <button
            onClick={async () => { await signOut(); router.push('/auth/login') }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-error/10 text-error transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-dark-gray border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-bold text-precision-black dark:text-light-gray">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-precision-black dark:text-light-gray">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

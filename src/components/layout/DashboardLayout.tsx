'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

export interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
}

export function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useUser()
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShouldRedirect(true)
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (shouldRedirect) return null

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const sidebarWidth = collapsed ? 68 : 256

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Sidebar
        onSignOut={handleSignOut}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      {/* Main area shifted by sidebar width */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Sticky header */}
        <header className="sticky top-0 z-[200] flex items-center justify-between h-16 px-6 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800">
          {/* Left: page title */}
          <div>
            {pageTitle && (
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {pageTitle}
              </h1>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              type="button"
              aria-label="Buscar"
              className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Search size={16} />
            </button>

            {/* Notifications */}
            <button
              type="button"
              aria-label="Notificações"
              className="relative h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-blue" aria-hidden />
            </button>

            <ThemeToggle size="sm" />

            {/* User avatar or loading skeleton */}
            <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isLoading
                  ? "bg-gray-300 dark:bg-gray-700"
                  : "bg-accent-blue"
              )}>
                {!isLoading && (
                  <span className="text-white text-xs font-bold uppercase">
                    {user?.name?.charAt(0) ?? 'U'}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-right leading-tight">
                {isLoading ? (
                  <>
                    <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                      {user?.name ?? 'Usuário'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate max-w-[120px]">
                      {user?.email ?? ''}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}

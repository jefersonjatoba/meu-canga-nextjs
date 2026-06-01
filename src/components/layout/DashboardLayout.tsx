'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Search, Menu } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

export interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
}

export function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated } = useUser()
  const { signOut } = useAuth()
  useInactivityTimeout()

  // Desktop: sidebar collapsed state
  const [collapsed, setCollapsed] = useState(false)
  // Mobile: drawer open state
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobileOpen(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (!isLoading && !isAuthenticated) return null

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  // Desktop sidebar width (only applied on lg+)
  const sidebarWidth = collapsed ? 68 : 256

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F]">
      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar — hidden on mobile unless drawer open ── */}
      <div
        className={cn(
          // Mobile: fixed drawer sliding from left
          'fixed left-0 top-0 h-full z-[200]',
          'transition-transform duration-300 ease-in-out',
          // Mobile: translate off-screen by default, slide in when open
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar
          onSignOut={handleSignOut}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onMobileClose={() => setMobileOpen(false)}
          isMobileOpen={mobileOpen}
        />
      </div>

      {/* ── Main area — full width on mobile, shifted on desktop ── */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300 lg:ml-[var(--sidebar-w)]"
        style={{ '--sidebar-w': `${sidebarWidth}px` } as React.CSSProperties}
      >
        {/* Sticky header */}
        <header className="sticky top-0 z-[150] flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-white/[0.06]">
          {/* Left: hamburger (mobile) + page title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>

            {pageTitle && (
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {pageTitle}
              </h1>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search — hidden on smallest screens */}
            <button
              type="button"
              aria-label="Buscar"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors"
            >
              <Search size={16} />
            </button>

            {/* Notifications */}
            <button
              type="button"
              aria-label="Notificações"
              className="relative h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-blue" aria-hidden />
            </button>

            <ThemeToggle size="sm" />

            {/* User avatar */}
            <div className="flex items-center gap-2 ml-1 pl-2 sm:ml-2 sm:pl-3 border-l border-gray-200 dark:border-white/[0.08]">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isLoading
                  ? "bg-gray-300 dark:bg-white/[0.07]"
                  : "bg-accent-blue"
              )}>
                {!isLoading && (
                  <span className="text-white text-xs font-bold uppercase">
                    {user?.name?.charAt(0) ?? 'U'}
                  </span>
                )}
              </div>
              {/* Name/email — only on md+ */}
              <div className="hidden md:block text-right leading-tight">
                {isLoading ? (
                  <>
                    <div className="h-4 w-20 bg-gray-300 dark:bg-white/[0.07] rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-gray-300 dark:bg-white/[0.07] rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                      {user?.name ?? 'Usuário'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                      {user?.email ?? ''}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#0F0F0F]">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-300 dark:bg-white/[0.07] rounded animate-pulse" />
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 sm:h-32 bg-gray-300 dark:bg-white/[0.07] rounded animate-pulse"
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

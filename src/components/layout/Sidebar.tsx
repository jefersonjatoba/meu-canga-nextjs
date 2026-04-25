'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  TrendingUp,
  Target,
  FileBarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/escala', label: 'Escala', icon: CalendarDays },
  { href: '/dashboard/ras', label: 'RAS', icon: Shield },
  { href: '/dashboard/lancamentos', label: 'Lançamentos', icon: Wallet },
  { href: '/dashboard/investimentos', label: 'Investimentos', icon: TrendingUp },
  { href: '/dashboard/metas', label: 'Metas', icon: Target },
]

const bottomItems: NavItem[] = [
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

export interface SidebarProps {
  onSignOut?: () => void
  collapsed?: boolean
  onCollapsedChange?: (v: boolean) => void
}

export function Sidebar({ onSignOut, collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        'fixed left-0 top-0 h-screen z-[200]',
        'flex flex-col',
        'bg-white dark:bg-[#111111]',
        'border-r border-gray-200 dark:border-gray-800',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center px-4 h-16 border-b border-gray-200 dark:border-gray-800', collapsed && 'justify-center')}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
            <span className="text-white text-xs font-bold">MC</span>
          </div>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">MC</span>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-accent-blue transition-colors">
              MeuCanga
            </span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Menu principal">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg px-2.5 py-2.5 gap-3',
                    'text-sm font-medium',
                    'transition-all duration-150',
                    active
                      ? 'bg-accent-blue text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon size={18} className="shrink-0" aria-hidden />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-800 space-y-0.5">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-lg px-2.5 py-2.5 gap-3',
                'text-sm font-medium',
                'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                'transition-colors duration-150',
                collapsed && 'justify-center'
              )}
            >
              <Icon size={18} className="shrink-0" aria-hidden />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            title={collapsed ? 'Sair' : undefined}
            className={cn(
              'w-full flex items-center rounded-lg px-2.5 py-2.5 gap-3',
              'text-sm font-medium',
              'text-error hover:bg-red-50 dark:hover:bg-red-900/20',
              'transition-colors duration-150',
              collapsed && 'justify-center'
            )}
          >
            <LogOut size={18} className="shrink-0" aria-hidden />
            {!collapsed && <span>Sair</span>}
          </button>
        )}

        {/* Collapse toggle */}
        {onCollapsedChange && (
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={cn(
              'w-full flex items-center rounded-lg px-2.5 py-2.5 gap-3',
              'text-sm font-medium',
              'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              'transition-colors duration-150',
              collapsed && 'justify-center'
            )}
          >
            {collapsed ? (
              <ChevronRight size={18} aria-hidden />
            ) : (
              <>
                <ChevronLeft size={18} aria-hidden />
                <span>Recolher</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  )
}

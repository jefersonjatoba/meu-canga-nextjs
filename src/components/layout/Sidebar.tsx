'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  CreditCard,
  Tags,
  Landmark,
  TrendingUp,
  Target,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Repeat2,
  X,
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
  { href: '/dashboard/recorrencias', label: 'Recorrências', icon: Repeat2 },
  { href: '/dashboard/cartoes', label: 'Cartões', icon: CreditCard },
  { href: '/dashboard/contas', label: 'Contas', icon: Landmark },
  { href: '/dashboard/categorias', label: 'Categorias', icon: Tags },
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
  /** Called when the mobile close button is pressed */
  onMobileClose?: () => void
  /** Whether the mobile drawer is currently open */
  isMobileOpen?: boolean
}

export function Sidebar({
  onSignOut,
  collapsed = false,
  onCollapsedChange,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        'h-screen z-[200]',
        'flex flex-col',
        'bg-white dark:bg-[#141414]',
        'border-r border-gray-200 dark:border-white/[0.06]',
        'transition-all duration-300 ease-in-out',
        // On mobile always full width (w-72), on desktop respect collapsed
        'w-72 lg:w-auto',
        collapsed ? 'lg:w-[68px]' : 'lg:w-64'
      )}
    >
      {/* Logo + mobile close button */}
      <div className={cn(
        'flex items-center h-14 sm:h-16 px-4 border-b border-gray-200 dark:border-white/[0.06]',
        collapsed ? 'lg:justify-center' : 'justify-between'
      )}>
        {collapsed ? (
          <>
            {/* Desktop collapsed: icon only */}
            <div className="hidden lg:flex w-8 h-8 rounded-lg bg-accent-blue items-center justify-center">
              <span className="text-white text-xs font-bold">MC</span>
            </div>
            {/* Mobile: always show logo + close */}
            <Link href="/dashboard" className="flex lg:hidden items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-accent-blue transition-colors">
                MeuCanga
              </span>
            </Link>
          </>
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

        {/* Mobile close button */}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Menu principal">
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
                    // Minimum 44px touch target height
                    'flex items-center rounded-lg px-2.5 min-h-[44px] gap-3',
                    'text-sm font-medium',
                    'transition-all duration-150',
                    active
                      ? 'bg-accent-blue text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white',
                    collapsed ? 'lg:justify-center' : ''
                  )}
                >
                  <Icon size={18} className="shrink-0" aria-hidden />
                  {/* Always show label on mobile; respect collapsed on desktop */}
                  <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-white/[0.06] space-y-0.5">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-lg px-2.5 min-h-[44px] gap-3',
                'text-sm font-medium',
                'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                'transition-colors duration-150',
                collapsed ? 'lg:justify-center' : ''
              )}
            >
              <Icon size={18} className="shrink-0" aria-hidden />
              <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
            </Link>
          )
        })}

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            title={collapsed ? 'Sair' : undefined}
            className={cn(
              'w-full flex items-center rounded-lg px-2.5 min-h-[44px] gap-3',
              'text-sm font-medium',
              'text-error hover:bg-red-50 dark:hover:bg-red-900/20',
              'transition-colors duration-150',
              collapsed ? 'lg:justify-center' : ''
            )}
          >
            <LogOut size={18} className="shrink-0" aria-hidden />
            <span className={cn(collapsed && 'lg:hidden')}>Sair</span>
          </button>
        )}

        {/* Collapse toggle — desktop only */}
        {onCollapsedChange && (
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={cn(
              'hidden lg:flex w-full items-center rounded-lg px-2.5 min-h-[44px] gap-3',
              'text-sm font-medium',
              'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]',
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

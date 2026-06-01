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
  Bot,
  Scale,
  Lock,
  Sparkles,
  Zap,
  Users,
  Medal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlan } from '@/hooks/usePlan'
import type { RecursoKey } from '@/lib/plans'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: 'PRO' | 'NOVO'
  proRecurso?: RecursoKey
}

const navItems: NavItem[] = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/escala',        label: 'Escala',        icon: CalendarDays },
  { href: '/dashboard/ras',           label: 'RAS',           icon: Shield },
  { href: '/dashboard/lancamentos',   label: 'Lançamentos',   icon: Wallet },
  { href: '/dashboard/contas',        label: 'Contas',        icon: Landmark },
  { href: '/dashboard/recorrencias',  label: 'Recorrências',  icon: Repeat2 },
  { href: '/dashboard/cartoes',       label: 'Cartões',       icon: CreditCard },
  { href: '/dashboard/investimentos', label: 'Investimentos', icon: TrendingUp,  badge: 'PRO', proRecurso: 'investimentos' },
  { href: '/dashboard/metas',         label: 'Metas',         icon: Target },
  { href: '/dashboard/categorias',    label: 'Categorias',    icon: Tags },
  { href: '/dashboard/agente-ia',     label: 'Agente IA',     icon: Bot,         badge: 'PRO', proRecurso: 'agente_ia' },
  { href: '/dashboard/juridico',      label: 'Base Jurídica', icon: Scale,       badge: 'PRO', proRecurso: 'base_juridica' },
  { href: '/dashboard/indicar',       label: 'Indicar',       icon: Users,       badge: 'NOVO' },
  { href: '/dashboard/conquistas',    label: 'Conquistas',    icon: Medal },
]

const bottomItems: NavItem[] = [
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

export interface SidebarProps {
  onSignOut?: () => void
  collapsed?: boolean
  onCollapsedChange?: (v: boolean) => void
  onMobileClose?: () => void
  isMobileOpen?: boolean
}

export function Sidebar({
  onSignOut,
  collapsed = false,
  onCollapsedChange,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname()
  const { isPro, loading: planLoading } = usePlan()

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
        'w-72 lg:w-auto',
        collapsed ? 'lg:w-[68px]' : 'lg:w-64'
      )}
    >
      {/* Logo + mobile close */}
      <div className={cn(
        'flex items-center h-14 sm:h-16 px-4 border-b border-gray-200 dark:border-white/[0.06]',
        collapsed ? 'lg:justify-center' : 'justify-between'
      )}>
        {collapsed ? (
          <>
            <div className="hidden lg:flex w-8 h-8 rounded-lg bg-accent-blue items-center justify-center">
              <span className="text-white text-xs font-bold">MC</span>
            </div>
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
            const isProOnly = !!item.proRecurso
            const locked = isProOnly && !isPro && !planLoading

            return (
              <li key={item.href}>
                <Link
                  href={locked ? '/dashboard/upgrade' : item.href}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg px-2.5 min-h-[44px] gap-3',
                    'text-sm font-medium',
                    'transition-all duration-150',
                    active
                      ? 'bg-accent-blue text-white shadow-sm'
                      : locked
                      ? 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white',
                    collapsed ? 'lg:justify-center' : ''
                  )}
                >
                  <span className="relative shrink-0">
                    <Icon size={18} aria-hidden />
                    {locked && (
                      <Lock
                        size={9}
                        className="absolute -bottom-0.5 -right-1 text-gray-400 dark:text-gray-500"
                        aria-hidden
                      />
                    )}
                  </span>

                  <span className={cn('flex-1 flex items-center gap-2', collapsed && 'lg:hidden')}>
                    {item.label}
                    {item.badge && !collapsed && (
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                        active
                          ? 'bg-white/20 text-white'
                          : item.badge === 'PRO'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Upgrade CTA — free users only, desktop expanded */}
      {!planLoading && !isPro && !collapsed && (
        <div className="mx-2 mb-2">
          <Link
            href="/dashboard/upgrade"
            className="flex items-center gap-2.5 rounded-xl px-3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-150 group"
          >
            <Zap size={16} className="shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-none">Desbloqueie o PRO</p>
              <p className="text-[10px] opacity-80 mt-0.5 leading-none">R$ 21,90/mês</p>
            </div>
            <Sparkles size={14} className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" aria-hidden />
          </Link>
        </div>
      )}

      {/* PRO badge — pro users, desktop expanded */}
      {!planLoading && isPro && !collapsed && (
        <div className="mx-2 mb-2">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800/50">
            <Sparkles size={14} className="text-indigo-500 shrink-0" aria-hidden />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Plano PRO ativo</span>
          </div>
        </div>
      )}

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

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard, RefreshCw } from 'lucide-react'

const TABS = [
  {
    href: '/dashboard/cartoes',
    label: 'Faturas',
    icon: CreditCard,
    exact: false,
  },
  {
    href: '/dashboard/cartoes/assinaturas',
    label: 'Assinaturas',
    icon: RefreshCw,
    exact: true,
  },
]

export function CartoesNavTabs() {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href || pathname.startsWith(href + '/') : !pathname.startsWith('/dashboard/cartoes/assinaturas')

  return (
    <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800">
      {TABS.map(tab => {
        const active = isActive(tab.href, tab.exact)
        const Icon = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              'inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              active
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600',
            ].join(' ')}
          >
            <Icon size={15} aria-hidden />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = { label: string; href: string; icon: string }
type NavSection = { title: string; items: NavItem[] }

function buildSections(base: string): NavSection[] {
  return [
    {
      title: 'VISÃO GERAL',
      items: [
        { label: 'Dashboard',  href: base,             icon: '▣' },
        { label: 'Receita',    href: `${base}/receita`, icon: '◈' },
      ],
    },
    {
      title: 'USUÁRIOS',
      items: [
        { label: 'Todos os usuários', href: `${base}/usuarios`,   icon: '◉' },
        { label: 'Indicações',        href: `${base}/indicacoes`, icon: '◎' },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { label: 'Logs de atividade', href: `${base}/logs`,    icon: '≡' },
        { label: 'Saúde do sistema',  href: `${base}/sistema`, icon: '◈' },
      ],
    },
  ]
}

interface Props { adminPath: string }

export function AdminSidebar({ adminPath }: Props) {
  const base     = `/${adminPath}`
  const pathname = usePathname()
  const router   = useRouter()
  const sections = buildSections(base)

  // usePathname retorna o caminho original (com o ADMIN_PATH) graças ao rewrite do middleware
  function isActive(href: string) {
    if (href === base) return pathname === base
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    await fetch('/api/hq-auth', { method: 'DELETE' })
    router.push(`${base}/login`)
  }

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-[#0f0f0f] border-r border-white/[0.06] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm tracking-tight">MeuCanga</span>
          <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
            HQ
          </span>
        </div>
        <p className="text-[10px] text-gray-700 mt-0.5 font-mono">Painel de controle</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-[9px] font-bold tracking-widest text-gray-700 uppercase px-2 mb-1">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors',
                      isActive(item.href)
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                    )}
                  >
                    <span className="text-[11px] w-4 text-center opacity-50">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2.5 py-3 border-t border-white/[0.06] space-y-0.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-gray-600 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
        >
          <span className="text-[11px] w-4 text-center">⏻</span>
          <span>Sair do painel</span>
        </button>
      </div>
    </aside>
  )
}

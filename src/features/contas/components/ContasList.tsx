'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { BancoCard } from './BancoCard'
import { CartaoCreditoCard } from './CartaoCreditoCard'
import { InvestimentoCard } from './InvestimentoCard'
import { ContasEmptyState } from './ContasEmptyState'
import type { ContaDTO } from '../types'

interface ContasListProps {
  contas: ContaDTO[]
  loading: boolean
  error: string | null
  onEdit: (conta: ContaDTO) => void
  onDesativar: (conta: ContaDTO) => void
  onExcluir: (conta: ContaDTO) => void
  onNova: () => void
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ emoji, title, count }: { emoji: string; title: string; count: number }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none" aria-hidden>{emoji}</span>
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{title}</h2>
        </div>
        <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/[0.08] text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center tabular-nums">
          {count}
        </span>
      </div>
      <div className="h-px bg-gray-100 dark:bg-white/[0.05]" />
    </div>
  )
}

// ─── Horizontal carousel (desktop) com setas + scrollbar sutil ─────────────────
// Mobile  : grid de 1 coluna (cards empilhados, full-width) — sem scroll horizontal
// sm 640+ : flex row com overflow scroll + setas ao hover + scrollbar sutil

function CardRow({ children, count }: { children: React.ReactNode; count: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  // Usa requestAnimationFrame para evitar conflito com a fase de render do React
  const update = useCallback(() => {
    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      setCanLeft(el.scrollLeft > 4)
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
    })
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update, count])

  const scroll = (dir: 'left' | 'right') =>
    ref.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' })

  const arrowCls =
    'absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full ' +
    'bg-white dark:bg-[#1E1E1E] ' +
    'border border-gray-200 dark:border-white/[0.10] shadow-md ' +
    'items-center justify-center ' +
    'text-gray-500 dark:text-gray-400 ' +
    'hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-300 ' +
    'transition-all duration-150 '

  return (
    <div className="relative group/row overflow-visible">
      {/* Seta esquerda — desktop only */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Anterior"
        className={
          arrowCls + '-left-3.5 ' +
          (canLeft ? 'hidden sm:flex opacity-0 group-hover/row:opacity-100' : 'hidden')
        }
      >
        <ChevronLeft size={13} />
      </button>

      {/* Scroll container — snap mobile, scrollbar desktop */}
      <div
        ref={ref}
        className="
          flex gap-3 overflow-x-auto scroll-smooth
          snap-x snap-mandatory
          pb-2
          [&::-webkit-scrollbar]:h-0 sm:[&::-webkit-scrollbar]:h-[3px]
          [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100
          dark:[&::-webkit-scrollbar-track]:bg-white/[0.04]
          [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-thumb]:bg-white/[0.15]
          [-ms-overflow-style:none]
        "
      >
        {children}
      </div>

      {/* Seta direita — desktop only */}
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Próximo"
        className={
          arrowCls + '-right-3.5 ' +
          (canRight ? 'hidden sm:flex opacity-0 group-hover/row:opacity-100' : 'hidden')
        }
      >
        <ChevronRight size={13} />
      </button>
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
// Mobile   : w-full (ocupa a coluna do grid)
// sm 640+  : 2 colunas  |  lg: 3 colunas  |  xl: 4 colunas

function CardSnap({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      shrink-0 snap-start flex flex-col
      w-[calc(100%-40px)]
      sm:w-[calc(50%-6px)]
      lg:w-[calc(33.333%-8px)]
      xl:w-[calc(25%-9px)]
    ">
      {children}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ContasList({ contas, loading, error, onEdit, onDesativar, onExcluir, onNova }: ContasListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[160px] w-full rounded-xl" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/[0.06] px-4 py-3">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (contas.length === 0) {
    return <ContasEmptyState onNova={onNova} />
  }

  const bancos        = contas.filter(c => ['checking', 'savings', 'wallet', 'custom'].includes(c.tipo))
  const cartoes       = contas.filter(c => c.tipo === 'credit')
  const investimentos = contas.filter(c => c.tipo === 'investment')

  return (
    <div className="space-y-8">

      {bancos.length > 0 && (
        <section>
          <SectionHeader emoji="🏦" title="Contas Bancárias" count={bancos.length} />
          <CardRow count={bancos.length}>
            {bancos.map(conta => (
              <CardSnap key={conta.id}>
                <BancoCard conta={conta} onEdit={onEdit} onDesativar={onDesativar} onExcluir={onExcluir} />
              </CardSnap>
            ))}
          </CardRow>
        </section>
      )}

      {cartoes.length > 0 && (
        <section>
          <SectionHeader emoji="💳" title="Cartões de Crédito" count={cartoes.length} />
          <CardRow count={cartoes.length}>
            {cartoes.map(conta => (
              <CardSnap key={conta.id}>
                <CartaoCreditoCard conta={conta} onEdit={onEdit} onDesativar={onDesativar} onExcluir={onExcluir} />
              </CardSnap>
            ))}
          </CardRow>
        </section>
      )}

      {investimentos.length > 0 && (
        <section>
          <SectionHeader emoji="📈" title="Investimentos" count={investimentos.length} />
          <CardRow count={investimentos.length}>
            {investimentos.map(conta => (
              <CardSnap key={conta.id}>
                <InvestimentoCard conta={conta} onEdit={onEdit} onDesativar={onDesativar} onExcluir={onExcluir} />
              </CardSnap>
            ))}
          </CardRow>
        </section>
      )}

    </div>
  )
}

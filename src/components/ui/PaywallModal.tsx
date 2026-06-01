'use client'

import { useRouter } from 'next/navigation'
import { X, Zap, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { PAYWALL_MSGS, PRECO_MENSAL_CENTS } from '@/lib/plans'
import type { RecursoKey } from '@/lib/plans'
import { cn } from '@/lib/utils'

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export type PaywallTrigger =
  | { tipo: 'limite'; recurso: string; atual?: number; limite?: number }
  | { tipo: 'feature'; recurso: RecursoKey }
  | { tipo: 'contextual'; recurso: string; mensagem: string }

interface PaywallModalProps {
  trigger: PaywallTrigger
  onClose: () => void
}

export function PaywallModal({ trigger, onClose }: PaywallModalProps) {
  const router = useRouter()

  const msg = PAYWALL_MSGS[trigger.recurso] ?? {
    emoji: '🔒',
    titulo: 'Recurso PRO',
    descricao: 'Este recurso está disponível no plano PRO.',
  }

  const isLimite = trigger.tipo === 'limite'

  const handleUpgrade = () => {
    onClose()
    router.push('/dashboard/upgrade')
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

      <div className={cn(
        'relative z-10 w-full max-w-sm rounded-2xl overflow-hidden',
        'bg-white dark:bg-[#1a1a1a]',
        'shadow-2xl shadow-black/40',
        'animate-[fadeIn_150ms_ease-out]'
      )}>
        {/* Header colorido */}
        <div className={cn(
          'px-6 pt-6 pb-5',
          isLimite
            ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/10'
            : 'bg-gradient-to-br from-indigo-500/15 to-purple-500/10'
        )}>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/10 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="text-3xl mb-3">{msg.emoji}</div>
          <h2 id="paywall-title" className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {msg.titulo}
          </h2>

          {isLimite && trigger.tipo === 'limite' && trigger.atual !== undefined && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                {trigger.atual}/{trigger.limite} usados
              </span>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {trigger.tipo === 'contextual'
              ? (trigger as { tipo: 'contextual'; recurso: string; mensagem: string }).mensagem
              : msg.descricao}
          </p>
        </div>

        {/* Corpo */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          {/* Preço âncora */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-white/[0.05] px-4 py-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">MeuCanga PRO</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {fmtBRL(PRECO_MENSAL_CENTS)}<span className="text-xs font-normal text-gray-400">/mês</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">7 dias grátis</p>
              <p className="text-[10px] text-gray-400">cancele quando quiser</p>
            </div>
          </div>

          {/* Destaques rápidos */}
          <div className="space-y-1.5">
            {[
              'Tudo ilimitado — sem tetos mensais',
              'Investimentos, Agente IA e Base Jurídica',
              'Exportação CSV e relatórios anuais',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Sparkles size={12} className="text-amber-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>

          {/* Botões */}
          <button
            onClick={handleUpgrade}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-500/25 mt-1"
          >
            <Zap size={15} />
            Assinar PRO — {fmtBRL(PRECO_MENSAL_CENTS)}/mês
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-1.5"
          >
            <Lock size={12} />
            Continuar no Free
          </button>
        </div>
      </div>
    </div>
  )
}

/* Hook helper para abrir o modal em qualquer componente */
export { usePaywall } from './usePaywall'

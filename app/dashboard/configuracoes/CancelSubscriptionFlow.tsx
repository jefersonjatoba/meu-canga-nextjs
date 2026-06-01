'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle, Pause, HelpCircle, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'idle' | 'perda' | 'pausa' | 'motivo' | 'desconto' | 'confirmado' | 'pausado' | 'descontado'
type Motivo = 'financeiro' | 'pouco_uso' | 'faltam_recursos' | 'outro'

interface Props {
  userId: string
  userName: string
  stats: {
    lancamentos: number
    rasAgendas: number
    metas: number
    recorrencias: number
    contas: number
  }
}

const MOTIVOS: { id: Motivo; label: string }[] = [
  { id: 'financeiro',      label: 'Está pesando no orçamento' },
  { id: 'pouco_uso',       label: 'Não estou usando muito' },
  { id: 'faltam_recursos', label: 'Falta algum recurso que eu preciso' },
  { id: 'outro',           label: 'Outro motivo' },
]

export function CancelSubscriptionFlow({ userName, stats }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [motivo, setMotivo] = useState<Motivo | null>(null)
  const [loading, setLoading] = useState(false)

  const first = userName.split(' ')[0]
  const totalUso = stats.lancamentos + stats.rasAgendas

  async function executarCancelamento() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      if (!res.ok) throw new Error()
      setStep('confirmado')
      router.refresh()
    } catch {
      alert('Erro ao cancelar. Tente novamente ou entre em contato.')
    } finally {
      setLoading(false)
    }
  }

  async function executarPausa() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/pause', { method: 'POST' })
      if (!res.ok) throw new Error()
      setStep('pausado')
      router.refresh()
    } catch {
      alert('Erro ao pausar. Tente novamente ou entre em contato.')
    } finally {
      setLoading(false)
    }
  }

  async function executarDesconto() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/apply-discount', { method: 'POST' })
      if (!res.ok) throw new Error()
      setStep('descontado')
      router.refresh()
    } catch {
      alert('Erro ao aplicar desconto. Tente novamente ou entre em contato.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'confirmado') {
    return (
      <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-4 text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Assinatura cancelada</p>
        <p className="text-xs text-gray-500">Você voltou ao plano Free. Seus dados estão seguros.</p>
      </div>
    )
  }

  if (step === 'pausado') {
    return (
      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/40 px-4 py-4 text-center">
        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-1">✓ Assinatura pausada por 30 dias</p>
        <p className="text-xs text-indigo-600 dark:text-indigo-400">Seu PRO continua ativo. Você não será cobrado durante este período.</p>
      </div>
    )
  }

  if (step === 'descontado') {
    return (
      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-4 py-4 text-center">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">✓ 50% OFF aplicado por 3 meses</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">Seu plano PRO foi estendido. Aproveite!</p>
      </div>
    )
  }

  return (
    <>
      {/* Botão de entrada */}
      {step === 'idle' && (
        <button
          onClick={() => setStep('perda')}
          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors underline underline-offset-2"
        >
          Cancelar assinatura
        </button>
      )}

      {/* Modal backdrop */}
      {step !== 'idle' && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setStep('idle')}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-[#1e1e1e] shadow-2xl overflow-hidden animate-[fadeIn_150ms_ease-out]">
            {/* Fechar */}
            <button
              onClick={() => setStep('idle')}
              className="absolute top-4 right-4 h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>

            {/* ── STEP 1: O que você vai perder ── */}
            {step === 'perda' && (
              <div className="p-6">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  {first}, você vai perder o acesso a:
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Com {totalUso} registros, você já usa o MeuCanga com frequência.
                </p>

                <ul className="space-y-2 mb-5">
                  {[
                    `Seus ${stats.lancamentos} lançamentos registrados continuam — mas novos ficam limitados a 10/mês`,
                    `Seus ${stats.rasAgendas} RAS ficam visíveis — novos limitados a 4/mês`,
                    'Investimentos, Agente IA e Base Jurídica bloqueados',
                    'Exportação CSV e PDFs ilimitados encerrados',
                    'Visão Anual e comparativos mensais desativados',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-red-400 mt-0.5 shrink-0">×</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <button
                    onClick={() => setStep('pausa')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Pause size={14} />
                      Prefiro pausar por 1 mês
                    </span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setStep('motivo')}
                    className="w-full py-2.5 rounded-xl text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Continuar com o cancelamento
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Oferta de Pausa ── */}
            {step === 'pausa' && (
              <div className="p-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <Pause size={18} className="text-indigo-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  Pause sua assinatura
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                  Pause por <strong>30 dias</strong> sem custo adicional. Seus dados ficam seguros e você retoma exatamente de onde parou quando quiser.
                </p>

                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 mb-5 space-y-1.5">
                  {[
                    'Sem cobrança durante a pausa',
                    'Todos os dados preservados',
                    'Reativa com 1 clique quando quiser',
                  ].map((f) => (
                    <p key={f} className="text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                      <span className="text-indigo-400">✓</span> {f}
                    </p>
                  ))}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={executarPausa}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Pausando…' : 'Pausar assinatura por 30 dias'}
                  </button>
                  <button
                    onClick={() => setStep('motivo')}
                    className="w-full py-2.5 rounded-xl text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Prefiro cancelar mesmo assim
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Motivo ── */}
            {step === 'motivo' && (
              <div className="p-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <HelpCircle size={18} className="text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  Por que está cancelando?
                </h3>
                <p className="text-xs text-gray-500 mb-4">Sua resposta nos ajuda a melhorar.</p>

                <div className="space-y-2 mb-5">
                  {MOTIVOS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMotivo(m.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all',
                        motivo === m.id
                          ? 'border-accent-blue bg-accent-blue/10 text-accent-blue font-semibold'
                          : 'border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                      )}
                    >
                      <span className={cn(
                        'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                        motivo === m.id ? 'border-accent-blue bg-accent-blue' : 'border-gray-400'
                      )}>
                        {motivo === m.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      {m.label}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!motivo}
                  onClick={() => setStep(motivo === 'financeiro' ? 'desconto' : 'perda')}
                  className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                >
                  Continuar
                </button>
              </div>
            )}

            {/* ── STEP 4: Oferta de desconto (motivo financeiro) ── */}
            {step === 'desconto' && (
              <div className="p-6">
                <div className="text-3xl mb-3">💛</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  Entendemos, {first}.
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Sabemos que a situação financeira pode apertar. Por isso, queremos te oferecer:
                </p>

                <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-400/30 px-5 py-4 mb-5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Oferta especial</p>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">50% OFF</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">nos próximos 3 meses</p>
                  <p className="text-xs text-gray-500 mt-1">De R$21,90 por <strong className="text-emerald-600">R$10,95/mês</strong></p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={executarDesconto}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Zap size={14} />
                    {loading ? 'Aplicando…' : 'Aceitar 50% OFF por 3 meses'}
                  </button>
                  <button
                    onClick={executarCancelamento}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    {loading ? 'Cancelando…' : 'Cancelar mesmo assim'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

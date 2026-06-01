'use client'

import Link from 'next/link'
import { ArrowRight, Clock, Plus, Shield } from 'lucide-react'
import { formatBRL } from '@/lib/money'

interface RasItem {
  data: string
  horaInicio: string
  local: string
  duracao: number
  status?: string
}

interface RasSummaryCardProps {
  horasMes: number
  valorMesCentavos: number
  proximosRas?: RasItem[]
  rasAReceberCentavos?: number
  rasHorasPendentes?: number
  rasHorasConfirmadas?: number
}

const RAS_MAX_HOURS = 120

export function RasSummaryCard({
  horasMes,
  valorMesCentavos,
  proximosRas = [],
  rasAReceberCentavos = 0,
  rasHorasConfirmadas = 0,
}: RasSummaryCardProps) {
  const percentualHoras = Math.min(Math.max((horasMes / RAS_MAX_HOURS) * 100, 0), 100)
  const horasRestantes = Math.max(RAS_MAX_HOURS - horasMes, 0)
  const temRasAReceber = rasAReceberCentavos > 0
  const proximoRas = proximosRas[0]

  const formatDate = (isoDate: string) => {
    const [, month, day] = isoDate.split('-')
    return `${day}/${month}`
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">RAS do mês</h2>
        </div>
        <Link
          href="/dashboard/ras"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Ver todos <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Horas acumuladas</p>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                {horasMes}h / {RAS_MAX_HOURS}h
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 dark:from-blue-500 dark:to-blue-400"
                style={{ width: `${percentualHoras}%` }}
                aria-hidden
              />
            </div>
            <p className="mt-2 text-[11px] text-blue-700/80 dark:text-blue-300/80">
              {horasRestantes > 0 ? `${horasRestantes}h ainda disponíveis` : 'Meta de horas atingida'}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Valor total projetado</p>
            <p className="mt-1 text-xl font-black tracking-tight tabular-nums text-gray-900 dark:text-gray-100">
              {formatBRL(valorMesCentavos)}
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Leitura rápida da renda extra acumulada no mês.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {temRasAReceber && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-500/20 dark:bg-green-500/10">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-green-700 dark:text-green-400">RAS a receber</p>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-500/20 dark:text-green-400">
                  Pronto para pagamento
                </span>
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums text-green-600 dark:text-green-300">
                {formatBRL(rasAReceberCentavos)}
              </p>
              <p className="mt-1 text-[11px] text-green-700/80 dark:text-green-300/80">
                {rasHorasConfirmadas}h confirmadas ainda sem pagamento integral.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-white/[0.05] dark:bg-white/[0.04]">
            {proximoRas ? (
              <>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Próximo RAS</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(proximoRas.data)} às {proximoRas.horaInicio}
                </p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {proximoRas.local} • {proximoRas.duracao}h
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Próximo RAS</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Nenhum RAS agendado agora.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use a agenda de RAS para complementar a leitura do caixa e do serviço.
          </p>
          <Link
            href="/dashboard/ras"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
          >
            <Plus size={14} aria-hidden />
            Agendar RAS
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { X, Sun, Sunset, Moon, MapPin, CheckCircle2, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useEscalaUpdate, useEscalaDelete } from '@/hooks/useEscala'
import type { Escala, TipoTurno } from '@/types/escala'
import { TURNO_CONFIG, STATUS_CONFIG } from '@/types/escala'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TURNO_ICONS: Record<TipoTurno, React.ReactNode> = {
  MATUTINO: <Sun size={16} aria-hidden />,
  VESPERTINO: <Sunset size={16} aria-hidden />,
  NOTURNO: <Moon size={16} aria-hidden />,
}

interface EscalaDayModalProps {
  date: string | null
  escalas: Escala[]
  open: boolean
  onClose: () => void
  onEdit?: (escala: Escala) => void
}

export function EscalaDayModal({
  date,
  escalas,
  open,
  onClose,
  onEdit,
}: EscalaDayModalProps) {
  const { toast } = useToast()
  const updateMutation = useEscalaUpdate()
  const deleteMutation = useEscalaDelete()

  const handleMarkRealizada = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, input: { status: 'realizada' } })
      toast({ type: 'success', title: 'Escala marcada como realizada' })
    } catch (err) {
      toast({ type: 'error', title: 'Erro', description: err instanceof Error ? err.message : 'Tente novamente' })
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast({ type: 'info', title: 'Escala cancelada' })
    } catch (err) {
      toast({ type: 'error', title: 'Erro', description: err instanceof Error ? err.message : 'Tente novamente' })
    }
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
        />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[401] -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-sm rounded-2xl p-6 shadow-xl',
            'bg-white dark:bg-[#1E1E1E]',
            'border border-gray-200 dark:border-gray-700',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
          aria-describedby="day-modal-desc"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <RadixDialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {date ? formatDate(date) : ''}
              </RadixDialog.Title>
              <p id="day-modal-desc" className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {escalas.length} escala{escalas.length !== 1 ? 's' : ''} neste dia
              </p>
            </div>
            <RadixDialog.Close asChild>
              <button
                aria-label="Fechar"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md p-1"
              >
                <X size={16} />
              </button>
            </RadixDialog.Close>
          </div>

          <div className="space-y-3">
            {escalas.map((escala) => {
              const turno = TURNO_CONFIG[escala.tipoTurno as TipoTurno]
              const statusCfg = STATUS_CONFIG[escala.status]
              const isWorking = updateMutation.isPending || deleteMutation.isPending

              return (
                <div
                  key={escala.id}
                  className={cn(
                    'rounded-xl p-4 border',
                    turno.bgClass,
                    turno.borderClass
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('flex items-center gap-1.5 text-sm font-medium', turno.textClass)}>
                      {TURNO_ICONS[escala.tipoTurno as TipoTurno]}
                      {turno.label}
                      <span className="text-xs opacity-70">{turno.horario}</span>
                    </span>
                    <Badge variant={statusCfg.variant} dot size="sm">
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {escala.localServico && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <MapPin size={11} aria-hidden />
                      {escala.localServico}
                    </p>
                  )}

                  {escala.status === 'agendada' && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => { onEdit?.(escala); onClose() }}
                        disabled={isWorking}
                        className="flex-1 justify-center"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleMarkRealizada(escala.id)}
                        isLoading={updateMutation.isPending}
                        disabled={isWorking}
                        className="flex-1 justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        leftIcon={<CheckCircle2 size={12} />}
                      >
                        Realizada
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleCancel(escala.id)}
                        isLoading={deleteMutation.isPending}
                        disabled={isWorking}
                        className="flex-1 justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        leftIcon={<XCircle size={12} />}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}

            {escalas.length === 0 && (
              <p className="text-sm text-center text-gray-400 py-4">
                Nenhuma escala registrada para este dia.
              </p>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

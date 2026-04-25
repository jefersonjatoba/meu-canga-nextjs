'use client'

import * as React from 'react'
import {
  Sun,
  Sunset,
  Moon,
  Pencil,
  CheckCircle2,
  XCircle,
  MapPin,
  CalendarDays,
} from 'lucide-react'

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
} from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useEscalaUpdate, useEscalaDelete } from '@/hooks/useEscala'
import type { Escala, TipoTurno } from '@/types/escala'
import { TURNO_CONFIG, STATUS_CONFIG } from '@/types/escala'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ─── Turno icon helper ────────────────────────────────────────────────────────

const TURNO_ICONS: Record<TipoTurno, React.ReactNode> = {
  MATUTINO: <Sun size={15} aria-hidden />,
  VESPERTINO: <Sunset size={15} aria-hidden />,
  NOTURNO: <Moon size={15} aria-hidden />,
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EscalaTableProps {
  escalas: Escala[]
  total: number
  page: number
  pageSize: number
  isLoading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onEdit?: (escala: Escala) => void
  className?: string
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={6} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
            <CalendarDays size={28} className="text-gray-400" aria-hidden />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Nenhuma escala encontrada
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Use o formulário ao lado para agendar sua primeira escala.
          </p>
        </div>
      </td>
    </tr>
  )
}

// ─── Row actions ──────────────────────────────────────────────────────────────

interface RowActionsProps {
  escala: Escala
  onEdit?: (e: Escala) => void
}

function RowActions({ escala, onEdit }: RowActionsProps) {
  const { toast } = useToast()
  const updateMutation = useEscalaUpdate()
  const deleteMutation = useEscalaDelete()

  const isWorking = updateMutation.isPending || deleteMutation.isPending

  const handleMarkRealizada = async () => {
    try {
      await updateMutation.mutateAsync({ id: escala.id, input: { status: 'realizada' } })
      toast({ type: 'success', title: 'Escala marcada como realizada' })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Tente novamente',
      })
    }
  }

  const handleCancel = async () => {
    try {
      await deleteMutation.mutateAsync(escala.id)
      toast({ type: 'info', title: 'Escala cancelada' })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Tente novamente',
      })
    }
  }

  const canMarkRealizada = escala.status === 'agendada'
  const canCancel = escala.status === 'agendada'
  const canEdit = escala.status !== 'realizada'

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Ações da escala">
      {canEdit && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onEdit?.(escala)}
          disabled={isWorking}
          aria-label="Editar escala"
          title="Editar"
        >
          <Pencil size={14} aria-hidden />
        </Button>
      )}
      {canMarkRealizada && (
        <Button
          variant="ghost"
          size="xs"
          onClick={handleMarkRealizada}
          isLoading={updateMutation.isPending}
          disabled={isWorking}
          aria-label="Marcar como realizada"
          title="Marcar como realizada"
          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          <CheckCircle2 size={14} aria-hidden />
        </Button>
      )}
      {canCancel && (
        <Button
          variant="ghost"
          size="xs"
          onClick={handleCancel}
          isLoading={deleteMutation.isPending}
          disabled={isWorking}
          aria-label="Cancelar escala"
          title="Cancelar"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <XCircle size={14} aria-hidden />
        </Button>
      )}
    </div>
  )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} aria-hidden>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" circle />
              <Skeleton className="h-4 w-20" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </TableCell>
        </tr>
      ))}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EscalaTable({
  escalas,
  total,
  page,
  pageSize,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onEdit,
  className,
}: EscalaTableProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <Table aria-label="Lista de escalas">
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Turno</TableHead>
            <TableHead>Local</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : escalas.length === 0 ? (
            <EmptyState />
          ) : (
            escalas.map((escala) => {
              const turno = TURNO_CONFIG[escala.tipoTurno as TipoTurno]
              const statusCfg = STATUS_CONFIG[escala.status]

              return (
                <TableRow key={escala.id}>
                  {/* Data */}
                  <TableCell className="font-medium tabular-nums whitespace-nowrap">
                    {formatDate(escala.dataEscala)}
                  </TableCell>

                  {/* Turno */}
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md',
                        turno.bgClass,
                        turno.textClass
                      )}
                    >
                      {TURNO_ICONS[escala.tipoTurno as TipoTurno]}
                      {turno.label}
                    </span>
                  </TableCell>

                  {/* Local */}
                  <TableCell className="max-w-[160px]">
                    {escala.localServico ? (
                      <span className="flex items-center gap-1.5 text-sm truncate" title={escala.localServico}>
                        <MapPin size={12} className="text-gray-400 shrink-0" aria-hidden />
                        {escala.localServico}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={statusCfg.variant} dot>
                      {statusCfg.label}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <RowActions escala={escala} onEdit={onEdit} />
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {!isLoading && total > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
    </div>
  )
}

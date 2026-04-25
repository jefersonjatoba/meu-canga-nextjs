'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sun, Sunset, Moon, X, CalendarPlus, Save } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useEscalaCreate, useEscalaUpdate } from '@/hooks/useEscala'
import {
  createEscalaSchema,
  updateEscalaSchema,
  type CreateEscalaSchema,
} from '@/lib/validations/escala'
import type { Escala, TipoTurno } from '@/types/escala'
import { TURNO_CONFIG } from '@/types/escala'
import { cn } from '@/lib/utils'

// ─── Turno icons ─────────────────────────────────────────────────────────────

const TURNO_ICONS: Record<TipoTurno, React.ReactNode> = {
  MATUTINO: <Sun size={16} aria-hidden />,
  VESPERTINO: <Sunset size={16} aria-hidden />,
  NOTURNO: <Moon size={16} aria-hidden />,
}

const TURNO_OPTIONS = (['MATUTINO', 'VESPERTINO', 'NOTURNO'] as TipoTurno[]).map(
  (t) => ({ value: t, label: `${TURNO_CONFIG[t].label} — ${TURNO_CONFIG[t].horario}` })
)

// ─── Props ────────────────────────────────────────────────────────────────────

interface EscalaFormProps {
  /** When provided, the form is in edit mode */
  editingEscala?: Escala | null
  onSuccess?: (escala: Escala) => void
  onCancel?: () => void
  className?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayBR(): string {
  return new Date()
    .toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/')
    .reverse()
    .join('-')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EscalaForm({
  editingEscala,
  onSuccess,
  onCancel,
  className,
}: EscalaFormProps) {
  const { toast } = useToast()
  const isEditing = !!editingEscala

  const createMutation = useEscalaCreate()
  const updateMutation = useEscalaUpdate()

  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateEscalaSchema>({
    resolver: zodResolver(isEditing ? updateEscalaSchema : createEscalaSchema),
    defaultValues: {
      dataEscala: editingEscala
        ? new Date(editingEscala.dataEscala).toISOString().slice(0, 10)
        : todayBR(),
      tipoTurno: editingEscala?.tipoTurno ?? 'MATUTINO',
      localServico: editingEscala?.localServico ?? '',
    },
  })

  const selectedTurno = useWatch({ control, name: 'tipoTurno' })
  const turnoConfig = selectedTurno ? TURNO_CONFIG[selectedTurno] : null

  // Reset form when editingEscala changes
  React.useEffect(() => {
    if (editingEscala) {
      reset({
        dataEscala: new Date(editingEscala.dataEscala).toISOString().slice(0, 10),
        tipoTurno: editingEscala.tipoTurno,
        localServico: editingEscala.localServico ?? '',
      })
    } else {
      reset({
        dataEscala: todayBR(),
        tipoTurno: 'MATUTINO',
        localServico: '',
      })
    }
  }, [editingEscala, reset])

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEditing && editingEscala) {
        const updated = await updateMutation.mutateAsync({
          id: editingEscala.id,
          input: {
            dataEscala: data.dataEscala,
            tipoTurno: data.tipoTurno,
            localServico: data.localServico || null,
          },
        })
        toast({
          type: 'success',
          title: 'Escala atualizada',
          description: 'As alterações foram salvas com sucesso.',
        })
        onSuccess?.(updated)
      } else {
        const created = await createMutation.mutateAsync({
          dataEscala: data.dataEscala,
          tipoTurno: data.tipoTurno,
          localServico: data.localServico || undefined,
        })
        toast({
          type: 'success',
          title: 'Escala agendada',
          description: 'Sua escala foi registrada com sucesso.',
        })
        reset({ dataEscala: todayBR(), tipoTurno: 'MATUTINO', localServico: '' })
        onSuccess?.(created)
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Erro ao salvar escala',
        description: err instanceof Error ? err.message : 'Tente novamente.',
      })
    }
  })

  return (
    <Card className={cn('h-fit', className)} aria-label={isEditing ? 'Editar escala' : 'Nova escala'}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {isEditing ? (
              <>
                <Save size={18} className="text-accent-blue" aria-hidden />
                Editar Escala
              </>
            ) : (
              <>
                <CalendarPlus size={18} className="text-accent-blue" aria-hidden />
                Nova Escala
              </>
            )}
          </CardTitle>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancelar edição"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {turnoConfig && (
          <div
            className={cn(
              'mt-2 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg w-fit',
              turnoConfig.bgClass,
              turnoConfig.textClass
            )}
            aria-live="polite"
          >
            {TURNO_ICONS[selectedTurno]}
            {turnoConfig.horario}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {/* Data */}
          <Input
            type="date"
            label="Data da Escala"
            required
            error={errors.dataEscala?.message}
            min={todayBR()}
            {...register('dataEscala')}
            aria-describedby={errors.dataEscala ? 'dataEscala-error' : undefined}
          />

          {/* Tipo de Turno */}
          <Controller
            name="tipoTurno"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo de Turno"
                required
                options={TURNO_OPTIONS}
                value={field.value}
                onValueChange={(v) => field.onChange(v as TipoTurno)}
                error={errors.tipoTurno?.message}
                placeholder="Selecione o turno..."
              />
            )}
          />

          {/* Local */}
          <Input
            label="Local de Serviço"
            placeholder="Ex: 1ª CIA, Base Central..."
            error={errors.localServico?.message}
            helper="Opcional — máximo 200 caracteres"
            {...register('localServico')}
          />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              isLoading={isPending}
              loadingText={isEditing ? 'Salvando...' : 'Agendando...'}
              fullWidth
              leftIcon={isEditing ? <Save size={16} /> : <CalendarPlus size={16} />}
            >
              {isEditing ? 'Salvar Alterações' : 'Agendar Escala'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isPending}
                aria-label="Cancelar"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

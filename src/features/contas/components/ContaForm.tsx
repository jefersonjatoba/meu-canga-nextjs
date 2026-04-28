'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toCents, fromCents } from '@/lib/money'
import { MoneyInput } from '@/features/lancamentos/components/MoneyInput'
import { createConta, updateConta } from '../api'
import { TIPOS_CONTA, TIPO_CONTA_LABELS, type ContaDTO, type TipoConta } from '../types'

const COR_PRESETS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280']

const formSchema = z.object({
  nome:          z.string().min(1, 'Nome obrigatório').max(100, 'Nome muito longo'),
  tipo:          z.enum(TIPOS_CONTA as [TipoConta, ...TipoConta[]]),
  banco:         z.string().max(100).optional(),
  cor:           z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  saldoDisplay:  z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ContaFormProps {
  mode?: 'create' | 'edit'
  initialData?: ContaDTO
  onSuccess: () => void
  onCancel: () => void
}

export function ContaForm({ mode = 'create', initialData, onSuccess, onCancel }: ContaFormProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = mode === 'edit' && !!initialData

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          nome:         initialData.nome,
          tipo:         initialData.tipo,
          banco:        initialData.banco ?? '',
          cor:          initialData.cor ?? COR_PRESETS[0],
          saldoDisplay: (fromCents(initialData.saldoCentavos)).toFixed(2).replace('.', ','),
        }
      : {
          nome:         '',
          tipo:         'checking',
          banco:        '',
          cor:          COR_PRESETS[0],
          saldoDisplay: '',
        },
  })

  const cor = watch('cor') ?? COR_PRESETS[0]

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const saldoCentavos = values.saldoDisplay
        ? toCents(values.saldoDisplay.replace(',', '.'))
        : 0

      if (isEdit) {
        await updateConta(initialData.id, {
          nome:  values.nome,
          tipo:  values.tipo,
          banco: values.banco || null,
          cor:   values.cor || null,
        })
      } else {
        await createConta({
          nome:          values.nome,
          tipo:          values.tipo,
          banco:         values.banco || undefined,
          cor:           values.cor || undefined,
          saldoCentavos,
        })
      }
      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar conta')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Nome */}
      <Input
        label="Nome da conta"
        required
        placeholder="Ex.: Nubank, Bradesco, Carteira"
        error={errors.nome?.message}
        {...register('nome')}
      />

      {/* Tipo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo <span className="text-red-500" aria-hidden>*</span>
        </label>
        <select
          {...register('tipo')}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E1E] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TIPOS_CONTA.map(t => (
            <option key={t} value={t}>{TIPO_CONTA_LABELS[t]}</option>
          ))}
        </select>
        {errors.tipo && <p role="alert" className="text-xs text-red-600">{errors.tipo.message}</p>}
      </div>

      {/* Banco + Saldo inicial (2 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Banco / Instituição"
          placeholder="Ex.: Nubank, Itaú (opcional)"
          error={errors.banco?.message}
          {...register('banco')}
        />
        {!isEdit && (
          <Controller
            name="saldoDisplay"
            control={control}
            render={({ field }) => (
              <MoneyInput
                label="Saldo inicial"
                error={errors.saldoDisplay?.message}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        )}
      </div>

      {/* Cor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {COR_PRESETS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('cor', c)}
              className={`w-7 h-7 rounded-full transition-transform ${cor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>

      {apiError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Salvando…">
          {isEdit ? 'Atualizar conta' : 'Criar conta'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toCents } from '@/lib/money'
import { todayBR } from '@/lib/dates'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MoneyInput } from './MoneyInput'
import { createLancamento } from '../api'
import type { ContaOption } from '../api'

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES: Record<string, string[]> = {
  income:  ['Salário', 'RAS', 'Freelance', 'Aluguel Recebido', 'Bônus', 'Outros'],
  expense: ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Serviços', 'Outros'],
  default: ['Aporte', 'Resgate', 'Sobreaviso', 'Transferência', 'Outros'],
}

function categoriesFor(tipo: string): string[] {
  return CATEGORIES[tipo] ?? CATEGORIES.default
}

// ─── Types selectable in this phase ──────────────────────────────────────────

const TIPOS_FORM = [
  { value: 'income',             label: 'Receita' },
  { value: 'expense',            label: 'Despesa' },
  { value: 'investment_aporte',  label: 'Aporte' },
  { value: 'investment_resgate', label: 'Resgate' },
  { value: 'ras',                label: 'RAS' },
] as const

// ─── Client schema ────────────────────────────────────────────────────────────

const formSchema = z.object({
  tipo: z.enum(['income', 'expense', 'ras', 'investment_aporte', 'investment_resgate', 'transfer'] as const),
  contaId:      z.string().min(1, 'Selecione uma conta'),
  descricao:    z.string().min(1, 'Descrição obrigatória').max(255, 'Descrição muito longa'),
  categoria:    z.string().min(1, 'Categoria obrigatória').max(100),
  valorDisplay: z.string()
    .min(1, 'Valor obrigatório')
    .refine(v => {
      const n = parseFloat(v.replace(',', '.'))
      return isFinite(n) && n > 0
    }, 'Valor deve ser maior que zero'),
  data:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  status: z.enum(['confirmada', 'pendente'] as const),
})

type FormValues = z.infer<typeof formSchema>

// ─── Component ────────────────────────────────────────────────────────────────

interface LancamentoFormProps {
  contas: ContaOption[]
  defaultTipo?: 'income' | 'expense'
  onSuccess: () => void
  onCancel: () => void
}

export function LancamentoForm({
  contas,
  defaultTipo = 'income',
  onSuccess,
  onCancel,
}: LancamentoFormProps) {
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo:         defaultTipo,
      contaId:      contas[0]?.id ?? '',
      descricao:    '',
      categoria:    '',
      valorDisplay: '',
      data:         todayBR(),
      status:       'confirmada',
    },
  })

  const tipo = watch('tipo')

  // Reset categoria when tipo changes
  useEffect(() => {
    setValue('categoria', '')
  }, [tipo, setValue])

  // Auto-select first conta if only one
  useEffect(() => {
    if (contas.length === 1) setValue('contaId', contas[0].id)
  }, [contas, setValue])

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const valorCentavos = toCents(values.valorDisplay.replace(',', '.'))
      await createLancamento({
        contaId:      values.contaId,
        descricao:    values.descricao,
        tipo:         values.tipo,
        categoria:    values.categoria,
        valorCentavos,
        data:         values.data,
        status:       values.status,
      })
      reset()
      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar lançamento')
    }
  }

  const cats = categoriesFor(tipo)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Tipo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo <span className="text-red-500" aria-hidden>*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TIPOS_FORM.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue('tipo', t.value, { shouldValidate: true })}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                tipo === t.value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {errors.tipo && (
          <p role="alert" className="text-xs text-red-600">{errors.tipo.message}</p>
        )}
      </div>

      {/* Description + Date (2-col on sm+) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Descrição"
          required
          placeholder="Ex.: Salário PMESP"
          error={errors.descricao?.message}
          {...register('descricao')}
        />
        <Input
          label="Data"
          type="date"
          required
          error={errors.data?.message}
          {...register('data')}
        />
      </div>

      {/* Valor + Categoria (2-col on sm+) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="valorDisplay"
          control={control}
          render={({ field }) => (
            <MoneyInput
              label="Valor"
              required
              error={errors.valorDisplay?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Categoria <span className="text-red-500" aria-hidden>*</span>
          </label>
          <select
            {...register('categoria')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E1E] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione…</option>
            {cats.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.categoria && (
            <p role="alert" className="text-xs text-red-600">{errors.categoria.message}</p>
          )}
        </div>
      </div>

      {/* Conta (hidden if only one) */}
      {contas.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Conta <span className="text-red-500" aria-hidden>*</span>
          </label>
          <select
            {...register('contaId')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E1E] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione…</option>
            {contas.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {errors.contaId && (
            <p role="alert" className="text-xs text-red-600">{errors.contaId.message}</p>
          )}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="status-pendente"
          className="rounded border-gray-300 dark:border-gray-600"
          {...register('status')}
          onChange={(e) => setValue('status', e.target.checked ? 'pendente' : 'confirmada')}
          checked={watch('status') === 'pendente'}
        />
        <label htmlFor="status-pendente" className="text-sm text-gray-600 dark:text-gray-400">
          Marcar como pendente
        </label>
      </div>

      {/* API error */}
      {apiError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Salvando…">
          Salvar lançamento
        </Button>
      </div>
    </form>
  )
}

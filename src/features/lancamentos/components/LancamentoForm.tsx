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
import { createLancamento, updateLancamento } from '../api'
import { listCategorias } from '@/features/categorias/api'
import type { ContaOption, LancamentoAPIItem } from '../api'
import type { CategoriaDTO, TipoCategoria } from '@/features/categorias/types'

const MANUAL_CATEGORY = '__manual__'

const TIPOS_FORM = [
  { value: 'income', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
  { value: 'investment_aporte', label: 'Aporte' },
  { value: 'investment_resgate', label: 'Resgate' },
  { value: 'ras', label: 'RAS' },
] as const

const formSchema = z.object({
  tipo: z.enum(['income', 'expense', 'ras', 'investment_aporte', 'investment_resgate', 'transfer'] as const),
  contaId: z.string().min(1, 'Selecione uma conta'),
  categoriaId: z.string().optional().nullable(),
  descricao: z.string().min(1, 'Descricao obrigatoria').max(255, 'Descricao muito longa'),
  categoria: z.string().min(1, 'Categoria obrigatoria').max(100),
  valorDisplay: z.string()
    .min(1, 'Valor obrigatorio')
    .refine(v => {
      const n = parseFloat(v.replace(',', '.'))
      return isFinite(n) && n > 0
    }, 'Valor deve ser maior que zero'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida'),
  status: z.enum(['confirmada', 'pendente', 'cancelada'] as const),
})

type FormValues = z.infer<typeof formSchema>

interface LancamentoFormProps {
  contas: ContaOption[]
  mode?: 'create' | 'edit'
  initialData?: LancamentoAPIItem
  defaultTipo?: 'income' | 'expense'
  onSuccess: () => void
  onCancel: () => void
}

function centsToDisplay(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

function itemDateToInput(dateStr: string): string {
  return dateStr.slice(0, 10)
}

function categoriaTipoForLancamento(tipo: string): TipoCategoria {
  if (tipo === 'income' || tipo === 'ras') return 'income'
  if (tipo === 'expense') return 'expense'
  return 'both'
}

export function LancamentoForm({
  contas,
  mode = 'create',
  initialData,
  defaultTipo = 'income',
  onSuccess,
  onCancel,
}: LancamentoFormProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const isEdit = mode === 'edit' && !!initialData

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
    defaultValues: isEdit
      ? {
          tipo: initialData.tipo,
          contaId: initialData.conta?.id ?? (contas[0]?.id ?? ''),
          categoriaId: initialData.categoriaId ?? MANUAL_CATEGORY,
          descricao: initialData.descricao,
          categoria: initialData.categoria,
          valorDisplay: centsToDisplay(initialData.valorCentavos),
          data: itemDateToInput(initialData.data),
          status: (initialData.status as 'confirmada' | 'pendente' | 'cancelada') ?? 'confirmada',
        }
      : {
          tipo: defaultTipo,
          contaId: contas[0]?.id ?? '',
          categoriaId: '',
          descricao: '',
          categoria: '',
          valorDisplay: '',
          data: todayBR(),
          status: 'confirmada',
        },
  })

  const tipo = watch('tipo')
  const categoriaId = watch('categoriaId')

  useEffect(() => {
    let cancelled = false
    setLoadingCategorias(true)

    listCategorias()
      .then((items) => {
        if (!cancelled) setCategorias(items)
      })
      .catch((e) => {
        if (!cancelled) setApiError(e instanceof Error ? e.message : 'Erro ao carregar categorias')
      })
      .finally(() => {
        if (!cancelled) setLoadingCategorias(false)
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isEdit) {
      setValue('categoria', '')
      setValue('categoriaId', '')
    }
  }, [tipo, setValue, isEdit])

  useEffect(() => {
    if (contas.length === 1) setValue('contaId', contas[0].id)
  }, [contas, setValue])

  const categoriaTipo = categoriaTipoForLancamento(tipo)
  const categoriasFiltradas = categorias.filter(c => c.tipo === categoriaTipo || c.tipo === 'both')
  const showManualCategoria = categoriaId === MANUAL_CATEGORY || categoriasFiltradas.length === 0

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const selectedCategoria = categorias.find(c => c.id === values.categoriaId)
      const categoria = selectedCategoria?.nome ?? values.categoria
      const categoriaId = selectedCategoria?.id ?? (values.categoriaId === MANUAL_CATEGORY ? null : undefined)
      const valorCentavos = toCents(values.valorDisplay.replace(',', '.'))

      if (isEdit) {
        await updateLancamento(initialData.id, {
          descricao: values.descricao,
          tipo: values.tipo,
          categoriaId,
          categoria,
          valorCentavos,
          data: values.data,
          status: values.status,
        })
      } else {
        await createLancamento({
          contaId: values.contaId,
          descricao: values.descricao,
          tipo: values.tipo,
          categoriaId,
          categoria,
          valorCentavos,
          data: values.data,
          status: values.status,
        })
      }

      reset()
      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar lancamento')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                tipo === t.value
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/[0.10] dark:text-gray-400 dark:hover:bg-white/[0.05]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {errors.tipo && <p role="alert" className="text-xs text-red-600">{errors.tipo.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Descricao"
          required
          placeholder="Ex.: Salario PMESP"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            {...register('categoriaId')}
            disabled={loadingCategorias}
            onChange={(event) => {
              const nextId = event.target.value
              setValue('categoriaId', nextId, { shouldValidate: true })
              const selectedCategoria = categorias.find(c => c.id === nextId)

              if (selectedCategoria) {
                setValue('categoria', selectedCategoria.nome, { shouldValidate: true })
              } else if (nextId !== MANUAL_CATEGORY) {
                setValue('categoria', '', { shouldValidate: true })
              }
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-white/[0.10] dark:bg-[#1C1C1C] dark:text-gray-100"
          >
            <option value="">{loadingCategorias ? 'Carregando...' : 'Selecione...'}</option>
            {categoriasFiltradas.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
            {isEdit && initialData?.categoria && !initialData.categoriaId && (
              <option value={MANUAL_CATEGORY}>{initialData.categoria}</option>
            )}
            <option value={MANUAL_CATEGORY}>Categoria manual</option>
          </select>
          {errors.categoria && <p role="alert" className="text-xs text-red-600">{errors.categoria.message}</p>}
        </div>
      </div>

      {showManualCategoria && (
        <Input
          label="Categoria manual"
          required
          placeholder="Ex.: Alimentacao, Moradia, RAS"
          error={errors.categoria?.message}
          {...register('categoria')}
        />
      )}

      {contas.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Conta <span className="text-red-500" aria-hidden>*</span>
          </label>
          <select
            {...register('contaId')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/[0.10] dark:bg-[#1C1C1C] dark:text-gray-100"
          >
            <option value="">Selecione...</option>
            {contas.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {errors.contaId && <p role="alert" className="text-xs text-red-600">{errors.contaId.message}</p>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="status-pendente"
          className="rounded border-gray-300 dark:border-white/[0.10]"
          {...register('status')}
          onChange={(e) => setValue('status', e.target.checked ? 'pendente' : 'confirmada')}
          checked={watch('status') === 'pendente'}
        />
        <label htmlFor="status-pendente" className="text-sm text-gray-600 dark:text-gray-400">
          Marcar como pendente
        </label>
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Salvando...">
          {isEdit ? 'Atualizar lancamento' : 'Salvar lancamento'}
        </Button>
      </div>
    </form>
  )
}

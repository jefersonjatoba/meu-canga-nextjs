'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toCents } from '@/lib/money'
import { todayBR } from '@/lib/dates'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MoneyInput } from './MoneyInput'
import { createLancamento, updateLancamento } from '../api'
import type { ContaOption, LancamentoAPIItem } from '../api'
import { criarCompraCartao } from '@/features/cartao/api'

// ─── Categorias pré-fixadas ────────────────────────────────────────────────
const CATEGORIAS_RECEITA = [
  '💼 Salário',
  '💡 Renda extra',
  '🏠 Aluguel Recebido',
  '🎯 Bônus',
  '💻 Freelance',
  '📈 Investimentos',
  '🏷️ Outros',
] as const

const CATEGORIAS_DESPESA = [
  '🏠 Moradia',
  '🍔 Alimentação',
  '⛽ Combustível',
  '🏥 Saúde',
  '📱 Telefonia/Internet',
  '💡 Energia/Água',
  '🎮 Lazer',
  '📚 Educação',
  '👕 Vestuário',
  '🚗 Transporte',
  '💳 Cartão/Parcelas',
  '🏷️ Outros',
] as const

type CategoriaNome = string

// ─── Tipos principais (2 cards) ────────────────────────────────────────────
const TIPOS_PRINCIPAIS = [
  {
    value: 'income' as const,
    label: 'Receita',
    emoji: '💰',
    activeClass:
      'border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10',
    activeLabelClass: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'expense' as const,
    label: 'Despesa',
    emoji: '💸',
    activeClass:
      'border-red-400 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10',
    activeLabelClass: 'text-red-700 dark:text-red-300',
  },
] as const

type TipoPrincipal = 'income' | 'expense'

// ─── Zod schema ────────────────────────────────────────────────────────────
const formSchema = z.object({
  tipo: z.enum([
    'income',
    'expense',
    'ras',
    'investment_aporte',
    'investment_resgate',
    'transfer',
  ] as const),
  contaId: z.string().min(1, 'Selecione uma conta'),
  descricao: z.string().min(1, 'Descrição obrigatória').max(255, 'Descrição muito longa'),
  categoria: z.string().max(100).optional(),
  valorDisplay: z
    .string()
    .min(1, 'Valor obrigatório')
    .refine((v) => {
      const n = parseFloat(v.replace(/\./g, '').replace(',', '.'))
      return isFinite(n) && n > 0
    }, 'Valor deve ser maior que zero'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

type FormValues = z.infer<typeof formSchema>

// ─── Props ─────────────────────────────────────────────────────────────────
interface LancamentoFormProps {
  contas: ContaOption[]
  mode?: 'create' | 'edit'
  initialData?: LancamentoAPIItem
  defaultTipo?: 'income' | 'expense'
  onSuccess: () => void
  onCancel: () => void
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function centsToDisplay(centavos: number): string {
  const s = (centavos / 100).toFixed(2)
  const [int, dec] = s.split('.')
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${intFormatted},${dec}`
}

function itemDateToInput(dateStr: string): string {
  return dateStr.slice(0, 10)
}

function tipoToTipoPrincipal(tipo: string): TipoPrincipal {
  if (tipo === 'income') return 'income'
  return 'expense'
}

function getCategoriasForTipo(tipo: TipoPrincipal): readonly CategoriaNome[] {
  if (tipo === 'income') return CATEGORIAS_RECEITA
  if (tipo === 'expense') return CATEGORIAS_DESPESA
  return []
}

// ─── Componente ───────────────────────────────────────────────────────────
export function LancamentoForm({
  contas,
  mode = 'create',
  initialData,
  defaultTipo = 'income',
  onSuccess,
  onCancel,
}: LancamentoFormProps) {
  const isEdit = mode === 'edit' && !!initialData

  // Tipo principal controlado localmente (não no RHF)
  const [tipoPrincipal, setTipoPrincipal] = useState<TipoPrincipal>(
    () => tipoToTipoPrincipal(initialData?.tipo ?? defaultTipo),
  )

  // Categoria: seleção local independente do RHF para facilitar "Outros"
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(() => {
    if (!isEdit || !initialData?.categoria) return ''
    const cats = getCategoriasForTipo(tipoToTipoPrincipal(initialData.tipo))
    return (cats as readonly string[]).includes(initialData.categoria)
      ? initialData.categoria
      : 'Outros'
  })
  const [categoriaCustom, setCategoriaCustom] = useState<string>(() => {
    if (!isEdit) return ''
    const cats = getCategoriasForTipo(tipoToTipoPrincipal(initialData?.tipo ?? 'income'))
    return !(cats as readonly string[]).includes(initialData?.categoria ?? '')
      ? (initialData?.categoria ?? '')
      : ''
  })

  const [parcelar, setParcelar] = useState(false)
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(2)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          tipo: initialData.tipo,
          contaId: initialData.conta?.id ?? (contas[0]?.id ?? ''),
          descricao: initialData.descricao,
          categoria: initialData.categoria ?? '',
          valorDisplay: centsToDisplay(initialData.valorCentavos),
          data: itemDateToInput(initialData.data),
        }
      : {
          tipo: defaultTipo,
          contaId: contas[0]?.id ?? '',
          descricao: '',
          categoria: '',
          valorDisplay: '',
          data: todayBR(),
        },
  })

  const categoriasDisponiveis = getCategoriasForTipo(tipoPrincipal)
  const watchedContaId = useWatch({ control, name: 'contaId' })
  const isCartaoCredito = contas.find(c => c.id === watchedContaId)?.tipo === 'credit'

  // Auto-seleciona conta ao ter apenas 1
  useEffect(() => {
    if (contas.length === 1) setValue('contaId', contas[0].id)
  }, [contas, setValue])

  // Ao trocar tipo principal, reseta seleção de categoria
  function handleTipoPrincipal(tp: TipoPrincipal) {
    setTipoPrincipal(tp)
    setCategoriaSelecionada('')
    setCategoriaCustom('')
    setParcelar(false)
    setValue('categoria', '')
    setValue('tipo', tp, { shouldValidate: true })
  }

  function handleCategoriaSel(nome: string) {
    setCategoriaSelecionada(nome)
    if (nome !== 'Outros') {
      setCategoriaCustom('')
      setValue('categoria', nome, { shouldValidate: true })
    } else {
      setValue('categoria', '', { shouldValidate: true })
    }
  }

  const contasFiltradas = contas

  const onSubmit = async (values: FormValues) => {
    setApiError(null)

    const categoriaFinal =
      categoriaSelecionada === 'Outros'
        ? categoriaCustom.trim()
        : categoriaSelecionada

    if (!categoriaFinal) {
      setApiError('Selecione uma categoria')
      return
    }

    try {
      const valorCentavos = toCents(values.valorDisplay)

      // Parcelamento: credit card expense routed through compras endpoint
      if (!isEdit && isCartaoCredito && tipoPrincipal === 'expense' && parcelar) {
        await criarCompraCartao({
          contaId: values.contaId,
          descricao: values.descricao,
          categoriaId: undefined,
          categoria: categoriaFinal || 'Geral',
          valorTotalCentavos: valorCentavos,
          dataCompra: values.data,
          quantidadeParcelas,
        })
        reset()
        setParcelar(false)
        setQuantidadeParcelas(2)
        onSuccess()
        return
      }

      if (isEdit) {
        await updateLancamento(initialData.id, {
          descricao: values.descricao,
          tipo: values.tipo,
          categoriaId: null,
          categoria: categoriaFinal || 'Geral',
          valorCentavos,
          data: values.data,
          status: 'confirmada',
        })
      } else {
        await createLancamento({
          contaId: values.contaId,
          descricao: values.descricao,
          tipo: values.tipo,
          categoriaId: null,
          categoria: categoriaFinal || 'Geral',
          valorCentavos,
          data: values.data,
          status: 'confirmada',
        }, idempotencyKey)
      }

      reset()
      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar lançamento')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

      {/* ── 1. Tipo de Lançamento (2 cards) ─────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Tipo de Lançamento <span className="text-red-500" aria-hidden>*</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_PRINCIPAIS.map((t) => {
            const isActive = tipoPrincipal === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTipoPrincipal(t.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-2 transition-all ${
                  isActive
                    ? t.activeClass
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-transparent dark:hover:border-white/[0.14] dark:hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-2xl leading-none" aria-hidden>{t.emoji}</span>
                <span className={`text-[11px] font-bold uppercase tracking-wide ${
                  isActive ? t.activeLabelClass : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 2. Banner RAS ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 dark:border-indigo-500/20 dark:bg-indigo-500/[0.07]">
        <span className="text-lg leading-none shrink-0" aria-hidden>🛡️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 leading-tight">
            Precisa lançar um RAS?
          </p>
          <p className="text-[11px] text-indigo-500 dark:text-indigo-400 leading-tight">
            Use o módulo dedicado com calendário e controle completo.
          </p>
        </div>
        <Link
          href="/dashboard/ras"
          onClick={onCancel}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          Ir para RAS →
        </Link>
      </div>

      {/* ── 4. Descrição ────────────────────────────────────────────────── */}
      <Input
        label="Descrição"
        required
        placeholder="Ex.: Salário PMESP, Aluguel, Mercado..."
        error={errors.descricao?.message}
        {...register('descricao')}
      />

      {/* ── 5. Valor ────────────────────────────────────────────────────── */}
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

      {/* ── 6. Tipo de Conta ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo de Conta <span className="text-red-500" aria-hidden>*</span>
        </label>
        <select
          {...register('contaId')}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/[0.10] dark:bg-[#1C1C1C] dark:text-gray-100"
        >
          <option value="">Selecione uma conta...</option>
          {contasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {errors.contaId && (
          <p role="alert" className="text-xs text-red-600">{errors.contaId.message}</p>
        )}
      </div>

      {/* ── 7. Data ─────────────────────────────────────────────────────── */}
      <Input
        label="Data"
        type="date"
        required
        error={errors.data?.message}
        {...register('data')}
      />

      {/* ── 8. Parcelamento (cartão de crédito + despesa) ────────────────── */}
      {isCartaoCredito && tipoPrincipal === 'expense' && !isEdit && (
        <div className={`rounded-xl border px-3.5 py-3 transition-colors ${
          parcelar
            ? 'border-violet-300 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/[0.07]'
            : 'border-gray-200 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]'
        }`}>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={parcelar}
              onChange={e => {
                setParcelar(e.target.checked)
                if (!e.target.checked) setQuantidadeParcelas(2)
              }}
              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-white/20 dark:bg-[#1C1C1C]"
            />
            <span className={`text-sm font-semibold ${parcelar ? 'text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400'}`}>
              💳 Parcelar compra
            </span>
          </label>
          {parcelar && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Número de parcelas
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantidadeParcelas(q => Math.max(2, q - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1C] text-gray-600 dark:text-gray-300 font-bold hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center text-base touch-manipulation"
                  >−</button>
                  <input
                    type="number"
                    min={2}
                    max={360}
                    value={quantidadeParcelas}
                    onChange={e => {
                      const n = Math.max(2, Math.min(360, parseInt(e.target.value) || 2))
                      setQuantidadeParcelas(n)
                    }}
                    className="w-16 text-center rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1C] px-2 py-1.5 text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantidadeParcelas(q => Math.min(360, q + 1))}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1C] text-gray-600 dark:text-gray-300 font-bold hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center text-base touch-manipulation"
                  >+</button>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">vezes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 9. Categoria ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Categoria <span className="text-red-500" aria-hidden>*</span>
          </label>
          <select
            value={categoriaSelecionada}
            onChange={(e) => handleCategoriaSel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/[0.10] dark:bg-[#1C1C1C] dark:text-gray-100"
          >
            <option value="">Selecione uma categoria...</option>
            {categoriasDisponiveis.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {categoriaSelecionada === 'Outros' && (
            <Input
              label="Descreva a categoria"
              required
              placeholder="Ex.: Presente, Pet, Hobby..."
              value={categoriaCustom}
              onChange={(e) => {
                setCategoriaCustom(e.target.value)
                setValue('categoria', e.target.value, { shouldValidate: true })
              }}
            />
          )}
          {apiError === 'Selecione uma categoria' && (
            <p role="alert" className="text-xs text-red-600">Selecione uma categoria</p>
          )}
        </div>

      {/* ── Erro de API ──────────────────────────────────────────────────── */}
      {apiError && apiError !== 'Selecione uma categoria' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      {/* ── Botões ──────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          loadingText="Salvando..."
        >
          {isEdit ? 'Atualizar lançamento' : 'Salvar lançamento'}
        </Button>
      </div>
    </form>
  )
}

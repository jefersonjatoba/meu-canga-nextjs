'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, Landmark, CreditCard, TrendingUp, Layers } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toCents, fromCents } from '@/lib/money'
import { MoneyInput } from '@/features/lancamentos/components/MoneyInput'
import { BANK_OPTIONS, CARD_GRADIENTS, getBankInitials } from '@/lib/bank-config'
import { createConta, updateConta } from '../api'
import type { ContaDTO, TipoConta } from '../types'

// ─── Schema ──────────────────────────────────────────────────────────────────

const UI_TIPOS = ['checking', 'credit', 'custom'] as const
type UiTipo = typeof UI_TIPOS[number]

const formSchema = z.object({
  tipo:           z.enum(UI_TIPOS),
  tipoCustom:     z.string().max(80).optional(),   // campo livre para "Outros"
  banco:          z.string().max(100).optional(),
  nome:           z.string().min(1, 'Campo obrigatório').max(100),
  cor:            z.string().optional(),
  limiteDisplay:  z.string().optional(),
  diaFechamento:  z.coerce.number().int().min(1).max(31).optional(),
  diaVencimento:  z.coerce.number().int().min(1).max(31).optional(),
}).refine(
  d => d.tipo !== 'credit' || (d.diaFechamento != null && d.diaVencimento != null),
  { path: ['diaFechamento'], message: 'Informe fechamento e vencimento' },
)

type FormValues = z.infer<typeof formSchema>

// ─── UI type config ───────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  checking: {
    label:       'Conta Corrente',
    icon:        Landmark,
    nomeLabel:   'Nome da conta',
    nomePlaceholder: 'Ex.: Conta Bradesco, Inter Principal',
    color:       '#3b82f6',
  },
  credit: {
    label:       'Cartão de Crédito',
    icon:        CreditCard,
    nomeLabel:   'Nome do cartão',
    nomePlaceholder: 'Ex.: Nubank Ultravioleta, Itaú Platinum',
    color:       '#8b5cf6',
  },
  custom: {
    label:       'Outros',
    icon:        Layers,
    nomeLabel:   'Nome',
    nomePlaceholder: 'Ex.: Vale Alimentação, Poupança Férias',
    color:       '#f59e0b',
  },
} as const

// Map DB tipo → UI tipo (for editing legacy savings/wallet/investment accounts)
function dbTipoToUi(dbTipo: string): UiTipo {
  if (dbTipo === 'savings' || dbTipo === 'wallet' || dbTipo === 'investment') return 'custom'
  if (UI_TIPOS.includes(dbTipo as UiTipo)) return dbTipo as UiTipo
  return 'checking'
}

// Map UI tipo → DB tipo
function uiTipoToDb(uiTipo: UiTipo): TipoConta {
  return uiTipo === 'custom' ? 'custom' : uiTipo
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BANK_SELECTOR = BANK_OPTIONS.slice(0, 24)
const DEFAULT_GRADIENT = `${CARD_GRADIENTS[0].from},${CARD_GRADIENTS[0].to}`

// ─── Component ────────────────────────────────────────────────────────────────

interface ContaFormProps {
  mode?: 'create' | 'edit'
  initialData?: ContaDTO
  onSuccess: () => void
  onCancel: () => void
}

export function ContaForm({ mode = 'create', initialData, onSuccess, onCancel }: ContaFormProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [showMoreBanks, setShowMoreBanks] = useState(false)
  const [showBankDropdown, setShowBankDropdown] = useState(false)
  const [showColorDropdown, setShowColorDropdown] = useState(false)
  const isEdit = mode === 'edit' && !!initialData

  const { register, control, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          tipo:          dbTipoToUi(initialData.tipo),
          tipoCustom:    ['savings', 'wallet'].includes(initialData.tipo) ? initialData.tipo : (initialData.banco ?? ''),
          banco:         initialData.banco ?? '',
          nome:          initialData.nome,
          cor:           initialData.cor ?? DEFAULT_GRADIENT,
          limiteDisplay: initialData.limiteCentavos
            ? fromCents(initialData.limiteCentavos).toFixed(2).replace('.', ',')
            : '',
          diaFechamento: initialData.diaFechamento ?? undefined,
          diaVencimento: initialData.diaVencimento ?? undefined,
        }
      : {
          tipo:          'checking',
          tipoCustom:    '',
          banco:         '',
          nome:          '',
          cor:           DEFAULT_GRADIENT,
          limiteDisplay: '',
        },
  })

  const tipo  = (useWatch({ control, name: 'tipo' }) ?? 'checking') as UiTipo
  const cor   = useWatch({ control, name: 'cor' }) ?? DEFAULT_GRADIENT
  const banco = useWatch({ control, name: 'banco' }) ?? ''
  const nome  = useWatch({ control, name: 'nome' }) ?? ''

  const cfg       = TYPE_CONFIG[tipo]
  const isCredit  = tipo === 'credit'
  const isCustom  = tipo === 'custom'
  const showBanks = tipo === 'checking'

  const selectedBank = BANK_OPTIONS.find(b => b.label.toLowerCase() === banco.toLowerCase()) ?? null
  const visibleBanks = showMoreBanks ? BANK_SELECTOR : BANK_SELECTOR.slice(0, 12)

  function selectBank(bankLabel: string) {
    setValue('banco', bankLabel)
    setShowBankDropdown(false)
    const currentNome = getValues('nome')
    const wasAutoFilled = BANK_OPTIONS.some(b => b.label.toLowerCase() === currentNome.toLowerCase())
    if (currentNome === '' || wasAutoFilled) {
      setValue('nome', bankLabel, { shouldValidate: true })
    }
  }

  function handleTipoChange(t: UiTipo) {
    setValue('tipo', t)
    setValue('banco', '')
    setValue('nome', '')
    setValue('tipoCustom', '')
  }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const limiteCentavos = values.limiteDisplay
        ? toCents(values.limiteDisplay.replace(',', '.'))
        : null

      const cardFields = isCredit
        ? { limiteCentavos, diaFechamento: values.diaFechamento, diaVencimento: values.diaVencimento }
        : { limiteCentavos: null, diaFechamento: null, diaVencimento: null }

      const dbTipo = uiTipoToDb(values.tipo)

      // For "Outros", store the custom type description in banco field
      const bancoValue = values.tipo === 'custom'
        ? (values.tipoCustom || null)
        : (values.banco || null)

      if (isEdit) {
        await updateConta(initialData.id, {
          nome:  values.nome,
          tipo:  dbTipo,
          banco: bancoValue,
          cor:   values.cor || null,
          ...cardFields,
        })
      } else {
        await createConta({
          nome:  values.nome,
          tipo:  dbTipo,
          banco: bancoValue ?? undefined,
          cor:   values.cor || undefined,
          ...cardFields,
        })
      }
      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar conta')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

      {/* ── Tipo — 4 cards ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tipo <span className="text-red-500" aria-hidden>*</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {UI_TIPOS.map(t => {
            const c = TYPE_CONFIG[t]
            const Icon = c.icon
            const selected = tipo === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTipoChange(t)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  selected
                    ? 'border-gray-300 bg-gray-100 dark:border-white/20 dark:bg-white/[0.07]'
                    : 'border-gray-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] opacity-60 hover:opacity-100'
                }`}
                aria-pressed={selected}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${c.color}${selected ? '25' : '18'}` }}
                >
                  <Icon size={15} style={{ color: c.color }} />
                </div>
                <span className={`text-sm font-medium leading-tight ${selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {c.label}
                </span>
                {selected && (
                  <Check size={13} className="ml-auto text-green-500 dark:text-green-400 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Redirect investimentos ─────────────────────────────────────────── */}
      <Link
        href="/dashboard/investimentos"
        className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 transition-all hover:bg-emerald-500/[0.08] hover:border-emerald-500/30"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/20">
          <TrendingUp size={15} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Quer cadastrar um investimento?</p>
          <p className="text-xs text-gray-600 dark:text-gray-500">Use o módulo dedicado com posição, histórico e rentabilidade.</p>
        </div>
        <span className="text-xs font-semibold text-emerald-400 shrink-0">Ir para Investimentos →</span>
      </Link>

      {/* ── "Outros" — campo livre de tipo ─────────────────────────────────── */}
      {isCustom && (
        <Input
          label="Qual tipo de conta?"
          placeholder="Ex.: Poupança, Carteira, Vale Alimentação"
          error={errors.tipoCustom?.message}
          {...register('tipoCustom')}
        />
      )}

      {/* ── Banco — dropdown colapsável (Conta Corrente) ──────────────────── */}
      {showBanks && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Banco / Instituição
          </label>

          {selectedBank ? (
            /* Banco selecionado — chip com botão de trocar */
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-white/[0.10] bg-white dark:bg-[#1C1C1C]">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${selectedBank.color}20`, border: `1.5px solid ${selectedBank.color}40` }}
              >
                {selectedBank.logo
                  ? <Image src={selectedBank.logo} alt="" width={18} height={18} className="object-contain p-0.5" />
                  : <span className="text-[9px] font-bold" style={{ color: selectedBank.color }}>{getBankInitials(selectedBank.label)}</span>
                }
              </div>
              <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 font-medium">{selectedBank.label}</span>
              <button
                type="button"
                onClick={() => { setValue('banco', ''); setValue('nome', ''); setShowBankDropdown(false) }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              >
                Trocar
              </button>
            </div>
          ) : (
            <>
              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setShowBankDropdown(v => !v)}
                className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/[0.10] bg-white dark:bg-[#1C1C1C] text-sm text-gray-400 dark:text-gray-500 transition-colors hover:border-gray-400 dark:hover:border-white/20 hover:text-gray-600 dark:hover:text-gray-400"
              >
                <span>Selecionar banco...</span>
                <ChevronDown size={14} className={`transition-transform ${showBankDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown com grid de bancos */}
              {showBankDropdown && (
                <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#1A1A1A] p-3 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {visibleBanks.map(b => (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => selectBank(b.label)}
                        title={b.label}
                        className="w-11 h-11 rounded-xl transition-all relative flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 hover:opacity-100 opacity-70"
                        style={{
                          backgroundColor: `${b.color}18`,
                          border: `1.5px solid ${b.color}40`,
                        }}
                        aria-label={b.label}
                      >
                        {b.logo
                          ? <Image src={b.logo} alt={b.label} width={28} height={28} className="object-contain p-1" />
                          : <span className="text-[10px] font-bold" style={{ color: b.color }}>{getBankInitials(b.label)}</span>
                        }
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMoreBanks(v => !v)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showMoreBanks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showMoreBanks ? 'Ver menos' : 'Ver mais bancos'}
                  </button>
                </div>
              )}

              {/* Input manual */}
              <Input
                placeholder="Ou digite o nome do banco manualmente"
                error={errors.banco?.message}
                {...register('banco')}
              />
            </>
          )}
        </div>
      )}

      {/* ── Cartão de crédito — instituição (opcional) ─────────────────────── */}
      {isCredit && (
        <Input
          label="Emissor (opcional)"
          placeholder="Ex.: Nubank, Itaú, Santander"
          error={errors.banco?.message}
          {...register('banco')}
        />
      )}

      {/* ── Nome — label dinâmica por tipo ─────────────────────────────────── */}
      <div>
        <Input
          label={cfg.nomeLabel}
          required
          placeholder={cfg.nomePlaceholder}
          error={errors.nome?.message}
          {...register('nome')}
        />
        {nome === '' && showBanks && !selectedBank && (
          <p className="text-[11px] text-gray-500 mt-1">
            Selecione um banco acima para preencher automaticamente.
          </p>
        )}
      </div>

      {/* ── Cartão de crédito — configurações ──────────────────────────────── */}
      {isCredit && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-0.5">Configurações do cartão</h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">Necessário para calcular fatura e vencimento.</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Fechamento"
              type="number"
              min={1}
              max={31}
              required
              placeholder="Dia 10"
              error={errors.diaFechamento?.message}
              {...register('diaFechamento', { valueAsNumber: true })}
            />
            <Input
              label="Vencimento"
              type="number"
              min={1}
              max={31}
              required
              placeholder="Dia 20"
              error={errors.diaVencimento?.message}
              {...register('diaVencimento', { valueAsNumber: true })}
            />
            <Controller
              name="limiteDisplay"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  label="Limite"
                  error={errors.limiteDisplay?.message}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Cor do cartão</p>

            {/* Trigger — mostra a cor selecionada */}
            <button
              type="button"
              onClick={() => setShowColorDropdown(v => !v)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/[0.10] bg-white dark:bg-[#1C1C1C] transition-colors hover:border-gray-400 dark:hover:border-white/20"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-md shrink-0"
                  style={{ background: `linear-gradient(135deg, ${cor.split(',')[0]}, ${cor.split(',')[1]})` }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {CARD_GRADIENTS.find(g => `${g.from},${g.to}` === cor)?.label ?? 'Personalizado'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showColorDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown com todas as opções */}
            {showColorDropdown && (
              <div className="mt-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#1A1A1A] p-3">
                <div className="flex gap-2 flex-wrap">
                  {CARD_GRADIENTS.map((g, i) => {
                    const value = `${g.from},${g.to}`
                    const selected = cor === value
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setValue('cor', value); setShowColorDropdown(false) }}
                        title={g.label}
                        className={`w-9 h-9 rounded-lg transition-all ${
                          selected
                            ? 'ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#1A1A1A] ring-gray-400 dark:ring-white/40 scale-110'
                            : 'hover:scale-105 opacity-70 hover:opacity-100'
                        }`}
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                        aria-label={g.label}
                        aria-pressed={selected}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Erro da API ────────────────────────────────────────────────────── */}
      {apiError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Salvando…">
          {isEdit ? 'Atualizar' : 'Criar conta'}
        </Button>
      </div>
    </form>
  )
}

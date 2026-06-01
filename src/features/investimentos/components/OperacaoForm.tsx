'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { criarOperacaoInvestimento } from '../api'
import type { InvestimentoAtivoDetalheDTO, InvestimentoOperacaoTipo } from '../types'
import type { CotacaoDTO } from '../hooks/useCotacoes'
import { useCotacao, temCotacao } from '../hooks/useCotacoes'
import { formatBRL } from '@/lib/money'

type ContaOption = { id: string; nome: string; tipo: string }

interface OperacaoFormProps {
  ativo:     InvestimentoAtivoDetalheDTO
  contas:    ContaOption[]
  onSuccess: (ativo: InvestimentoAtivoDetalheDTO) => void
  onCancel:  () => void
}

const TIPOS_RENDA_VARIAVEL = ['acao', 'fii', 'cripto', 'etf', 'bdr']

export function OperacaoForm({ ativo, contas, onSuccess, onCancel }: OperacaoFormProps) {
  const isRendaVariavel = TIPOS_RENDA_VARIAVEL.includes(ativo.tipo)
  const hasCotacao      = temCotacao(ativo.tipo)

  // Busca cotação para o ticker deste ativo
  const { cotacao, loading: cotacaoLoading } = useCotacao(hasCotacao ? ativo.ticker : null)

  const [tipo, setTipo]                       = useState<InvestimentoOperacaoTipo>(
    isRendaVariavel ? 'compra' : 'aporte',
  )
  const [quantidadeDecimal, setQuantidadeDecimal] = useState('')
  const [precoUnitario, setPrecoUnitario]         = useState('')
  const [valor, setValor]                         = useState('')
  const [taxa, setTaxa]                           = useState('')
  const [contaId, setContaId]                     = useState('')
  const [dataOperacao, setDataOperacao]           = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Auto-preenche preço unitário quando cotação carrega (apenas compra de renda variável)
  useEffect(() => {
    if (cotacao && isRendaVariavel && tipo === 'compra' && !precoUnitario) {
      const timer = window.setTimeout(() => {
        setPrecoUnitario(formatCotacaoParaInput(cotacao))
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [cotacao, isRendaVariavel, tipo, precoUnitario])

  const isCompraOuAporte = tipo === 'compra' || tipo === 'aporte'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const taxasCentavos = parseMoneyCentavos(taxa) ?? 0
      let quantidadeDecimalFinal: string
      let precoUnitarioCentavos: number
      let valorTotalCentavos: number

      if (isRendaVariavel) {
        const quantidadeNum = parseFloat(quantidadeDecimal.replace(',', '.'))
        if (!quantidadeDecimal || !Number.isFinite(quantidadeNum) || quantidadeNum <= 0) {
          setError('Informe uma quantidade válida.')
          setSubmitting(false)
          return
        }
        const preco = parseMoneyCentavos(precoUnitario)
        if (!preco || preco <= 0) {
          setError('Informe um preço unitário válido.')
          setSubmitting(false)
          return
        }
        quantidadeDecimalFinal = quantidadeDecimal.trim().replace(',', '.')
        precoUnitarioCentavos  = preco
        valorTotalCentavos     = Math.round(quantidadeNum * preco)
      } else {
        const valorCentavos = parseMoneyCentavos(valor)
        if (!valorCentavos || valorCentavos <= 0) {
          setError('Informe um valor válido.')
          setSubmitting(false)
          return
        }

        if (tipo === 'aporte') {
          quantidadeDecimalFinal = '1'
          precoUnitarioCentavos  = valorCentavos
          valorTotalCentavos     = valorCentavos
        } else {
          const precoMedio = ativo.posicao.precoMedioCentavos
          if (precoMedio <= 0) {
            setError('Posição sem preço médio. Registre um aporte antes de resgatar.')
            setSubmitting(false)
            return
          }
          const quantidadeNum    = valorCentavos / precoMedio
          quantidadeDecimalFinal = quantidadeNum.toFixed(8).replace(/\.?0+$/, '') || '0'
          precoUnitarioCentavos  = precoMedio
          valorTotalCentavos     = valorCentavos
        }
      }

      if (valorTotalCentavos <= 0) {
        setError('Valor total deve ser maior que zero.')
        setSubmitting(false)
        return
      }

      const updated = await criarOperacaoInvestimento(ativo.id, {
        tipo,
        quantidadeDecimal: quantidadeDecimalFinal,
        precoUnitarioCentavos,
        valorTotalCentavos,
        taxasCentavos,
        contaId: contaId || null,
        dataOperacao,
      })
      onSuccess(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível registrar a operação')
    } finally {
      setSubmitting(false)
    }
  }

  const tiposOptions: [InvestimentoOperacaoTipo, string][] = isRendaVariavel
    ? [['compra', 'Compra'], ['venda', 'Venda']]
    : [['aporte', 'Aporte'], ['resgate', 'Resgate']]

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* ── Tipo (Compra/Venda ou Aporte/Resgate) ── */}
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-white/[0.06] dark:bg-[#151515]">
        {tiposOptions.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTipo(value)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              tipo === value
                ? isCompraOuAporte
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-[#1C1C1C] dark:text-emerald-400'
                  : 'bg-white text-amber-600 shadow-sm dark:bg-[#1C1C1C] dark:text-amber-400'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Banner de cotação (renda variável) ── */}
      {hasCotacao && (
        <CotacaoBanner cotacao={cotacao} loading={cotacaoLoading} ticker={ativo.ticker} />
      )}

      {/* ── Campos ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isRendaVariavel ? (
          <>
            <Field label="Quantidade">
              <input
                value={quantidadeDecimal}
                onChange={(e) => setQuantidadeDecimal(e.target.value)}
                placeholder="10"
                className={inputClassName}
                required
              />
            </Field>
            <Field label="Preço unitário (R$)">
              <input
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(e.target.value)}
                placeholder={cotacao ? (cotacao.precoCentavos / 100).toFixed(2) : '0,00'}
                className={inputClassName}
                required
              />
            </Field>
          </>
        ) : (
          <Field label="Valor (R$)" className="sm:col-span-2">
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={inputClassName}
              required
            />
          </Field>
        )}

        <Field label="Taxa (R$)">
          <input
            value={taxa}
            onChange={(e) => setTaxa(e.target.value)}
            placeholder="0,00"
            className={inputClassName}
          />
        </Field>

        <Field label="Data">
          <input
            type="date"
            value={dataOperacao}
            onChange={(e) => setDataOperacao(e.target.value)}
            className={inputClassName}
            required
          />
        </Field>

        <Field label="Conta (opcional)" className="sm:col-span-2">
          <select
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
            className={inputClassName}
          >
            <option value="">Sem conta associada</option>
            {contas.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* ── Info preço médio (resgate de renda fixa) ── */}
      {!isRendaVariavel && tipo === 'resgate' && ativo.posicao.precoMedioCentavos > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Preço médio atual: {formatBRL(ativo.posicao.precoMedioCentavos)}
        </p>
      )}

      {/* ── Prévia do total (renda variável) ── */}
      {isRendaVariavel && quantidadeDecimal && precoUnitario && (
        <PreviewTotal quantidadeDecimal={quantidadeDecimal} precoUnitario={precoUnitario} />
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={submitting} loadingText="Registrando...">
          Registrar operação
        </Button>
      </div>
    </form>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CotacaoBanner({
  cotacao,
  loading,
  ticker,
}: {
  cotacao:  CotacaoDTO | null
  loading:  boolean
  ticker:   string
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/[0.06] dark:bg-[#151515]">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        <span className="text-xs text-gray-400">Buscando cotação de {ticker}…</span>
      </div>
    )
  }

  if (!cotacao) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/[0.07]">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Cotação de <strong>{ticker}</strong> não encontrada. Verifique o ticker ou insira o preço manualmente.
        </p>
      </div>
    )
  }

  const variacao      = cotacao.variacaoPercent
  const variacaoClass = variacao == null
    ? 'text-gray-500'
    : variacao >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'

  return (
    <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-500/20 dark:bg-blue-500/[0.07]">
      <div>
        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
          Cotação {ticker} — B3
        </p>
        {cotacao.nome && (
          <p className="text-[11px] text-blue-500 dark:text-blue-400">{cotacao.nome}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
          {formatBRL(cotacao.precoCentavos)}
        </p>
        {variacao != null && (
          <p className={`text-[11px] font-semibold ${variacaoClass}`}>
            {variacao >= 0 ? '+' : ''}{variacao.toFixed(2)}% hoje
          </p>
        )}
      </div>
    </div>
  )
}

function PreviewTotal({
  quantidadeDecimal,
  precoUnitario,
}: {
  quantidadeDecimal: string
  precoUnitario:     string
}) {
  const qtd   = parseFloat(quantidadeDecimal.replace(',', '.'))
  const preco = parseMoneyCentavos(precoUnitario)
  if (!Number.isFinite(qtd) || qtd <= 0 || !preco || preco <= 0) return null

  const total = Math.round(qtd * preco)
  return (
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Total estimado: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatBRL(total)}</span>
    </p>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label:     string
  children:  React.ReactNode
  className?: string
}) {
  return (
    <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className ?? ''}`}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/[0.08] dark:bg-[#1C1C1C] dark:text-gray-100'

function parseMoneyCentavos(value: string): number | null {
  if (!value) return null
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed     = parseFloat(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

function formatCotacaoParaInput(cotacao: CotacaoDTO): string {
  return (cotacao.precoCentavos / 100).toFixed(2).replace('.', ',')
}

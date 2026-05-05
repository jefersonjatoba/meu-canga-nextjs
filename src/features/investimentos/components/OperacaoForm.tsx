'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { criarOperacaoInvestimento } from '../api'
import type { InvestimentoAtivoDetalheDTO, InvestimentoOperacaoTipo } from '../types'

interface OperacaoFormProps {
  ativo: InvestimentoAtivoDetalheDTO
  onSuccess: (ativo: InvestimentoAtivoDetalheDTO) => void
  onCancel: () => void
}

export function OperacaoForm({ ativo, onSuccess, onCancel }: OperacaoFormProps) {
  const [tipo, setTipo] = useState<InvestimentoOperacaoTipo>('compra')
  const [quantidadeDecimal, setQuantidadeDecimal] = useState('')
  const [precoUnitario, setPrecoUnitario] = useState('')
  const [taxa, setTaxa] = useState('')
  const [dataOperacao, setDataOperacao] = useState(() => new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const precoUnitarioCentavos = parseMoneyInput(precoUnitario)
    const taxasCentavos = parseMoneyInput(taxa) ?? 0
    const quantidade = parseQuantity(quantidadeDecimal)

    if (!quantidadeDecimal || quantidade == null || quantidade <= 0) {
      setSubmitting(false)
      setError('Informe uma quantidade valida.')
      return
    }
    if (!precoUnitarioCentavos || precoUnitarioCentavos <= 0) {
      setSubmitting(false)
      setError('Informe um preco valido.')
      return
    }

    const valorTotalCentavos = Math.round(quantidade * precoUnitarioCentavos)
    if (valorTotalCentavos <= 0) {
      setSubmitting(false)
      setError('Valor total da operacao deve ser maior que zero.')
      return
    }

    try {
      const updated = await criarOperacaoInvestimento(ativo.id, {
        tipo,
        quantidadeDecimal: quantidadeDecimal.trim().replace(',', '.'),
        precoUnitarioCentavos,
        valorTotalCentavos,
        taxasCentavos,
        dataOperacao,
      })
      onSuccess(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nao foi possivel registrar a operacao')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-[#151515]">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {ativo.nome} ({ativo.ticker})
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          A operacao atualiza apenas a posicao de investimentos.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-white/[0.06] dark:bg-[#151515]">
        {(['compra', 'venda'] as const).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => setTipo(option)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              tipo === option
                ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1C1C1C] dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {option === 'compra' ? 'Compra' : 'Venda'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Quantidade">
          <input
            value={quantidadeDecimal}
            onChange={(event) => setQuantidadeDecimal(event.target.value)}
            placeholder="10.5"
            className={inputClassName}
            required
          />
        </Field>

        <Field label="Preco unitario">
          <input
            type="number"
            min="0"
            step="0.01"
            value={precoUnitario}
            onChange={(event) => setPrecoUnitario(event.target.value)}
            placeholder="0,00"
            className={inputClassName}
            required
          />
        </Field>

        <Field label="Taxa">
          <input
            type="number"
            min="0"
            step="0.01"
            value={taxa}
            onChange={(event) => setTaxa(event.target.value)}
            placeholder="0,00"
            className={inputClassName}
          />
        </Field>

        <Field label="Data">
          <input
            type="date"
            value={dataOperacao}
            onChange={(event) => setDataOperacao(event.target.value)}
            className={inputClassName}
            required
          />
        </Field>
      </div>

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
          Registrar operacao
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClassName = 'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/[0.08] dark:bg-[#1C1C1C] dark:text-gray-100'

function parseMoneyInput(value: string): number | null {
  if (!value) return null
  const parsed = Number(value.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

function parseQuantity(value: string): number | null {
  if (!value) return null
  const parsed = Number(value.replace(',', '.'))
  if (!Number.isFinite(parsed)) return null
  return parsed
}

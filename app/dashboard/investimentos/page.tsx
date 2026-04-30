'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import {
  criarAtivoInvestimento,
  listarAtivosInvestimento,
  obterAtivoInvestimento,
} from '@/features/investimentos/api'
import { AtivoDetalheModal } from '@/features/investimentos/components/AtivoDetalheModal'
import { AtivosList } from '@/features/investimentos/components/AtivosList'
import { InvestimentosHeader } from '@/features/investimentos/components/InvestimentosHeader'
import { OperacaoModal } from '@/features/investimentos/components/OperacaoModal'
import type { InvestimentoAtivoDetalheDTO } from '@/features/investimentos/types'

export default function InvestimentosPage() {
  const { toast } = useToast()
  const [ativos, setAtivos] = useState<InvestimentoAtivoDetalheDTO[]>([])
  const [precosAtuais, setPrecosAtuais] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [detalheTarget, setDetalheTarget] = useState<InvestimentoAtivoDetalheDTO | null>(null)
  const [operacaoTarget, setOperacaoTarget] = useState<InvestimentoAtivoDetalheDTO | null>(null)

  const loadAtivos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const base = await listarAtivosInvestimento()
      const detalhes = await Promise.all(base.map(ativo => obterAtivoInvestimento(ativo.id)))
      setAtivos(detalhes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar investimentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAtivos()
  }, [loadAtivos])

  const summary = useMemo(() => {
    return ativos.reduce(
      (acc, ativo) => {
        const precoAtualCentavos = precosAtuais[ativo.id]
        if (precoAtualCentavos == null) return acc

        const valorAtualCentavos = Math.round(Number(ativo.posicao.quantidadeAtual) * precoAtualCentavos)
        acc.patrimonioCentavos += valorAtualCentavos
        acc.resultadoCentavos += valorAtualCentavos - ativo.posicao.custoTotalCentavos
        return acc
      },
      { patrimonioCentavos: 0, resultadoCentavos: 0 },
    )
  }, [ativos, precosAtuais])

  const handleAtivoCreated = async () => {
    setCreateOpen(false)
    await loadAtivos()
    toast({
      type: 'success',
      title: 'Ativo criado',
      description: 'Agora voce pode registrar compras e vendas.',
    })
  }

  const handleAtivoUpdated = (updated: InvestimentoAtivoDetalheDTO) => {
    setAtivos(current => current.map(ativo => ativo.id === updated.id ? updated : ativo))
    setDetalheTarget(current => current?.id === updated.id ? updated : current)
    setOperacaoTarget(current => current?.id === updated.id ? updated : current)
  }

  const handleOperacaoSuccess = (updated: InvestimentoAtivoDetalheDTO) => {
    handleAtivoUpdated(updated)
    toast({
      type: 'success',
      title: 'Operacao registrada',
      description: 'A posicao do ativo foi recalculada.',
    })
  }

  const handleCancelSuccess = (updated: InvestimentoAtivoDetalheDTO) => {
    handleAtivoUpdated(updated)
    toast({
      type: 'success',
      title: 'Operacao cancelada',
      description: 'O historico foi preservado e a posicao foi recalculada.',
    })
  }

  return (
    <div className="space-y-5">
      <InvestimentosHeader
        totalAtivos={ativos.length}
        patrimonioCentavos={summary.patrimonioCentavos}
        resultadoCentavos={summary.resultadoCentavos}
        onNovoAtivo={() => setCreateOpen(true)}
      />

      <AtivosList
        ativos={ativos}
        loading={loading}
        error={error}
        precosAtuais={precosAtuais}
        onPrecoAtualChange={(ativoId, value) => {
          setPrecosAtuais(current => ({ ...current, [ativoId]: value }))
        }}
        onNovoAtivo={() => setCreateOpen(true)}
        onDetalhe={setDetalheTarget}
        onOperacao={setOperacaoTarget}
      />

      <CriarAtivoDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleAtivoCreated}
      />

      <AtivoDetalheModal
        ativo={detalheTarget}
        precoAtualCentavos={detalheTarget ? precosAtuais[detalheTarget.id] ?? null : null}
        open={!!detalheTarget}
        onOpenChange={(open) => { if (!open) setDetalheTarget(null) }}
        onUpdated={handleCancelSuccess}
      />

      <OperacaoModal
        ativo={operacaoTarget}
        open={!!operacaoTarget}
        onOpenChange={(open) => { if (!open) setOperacaoTarget(null) }}
        onSuccess={handleOperacaoSuccess}
      />
    </div>
  )
}

function CriarAtivoDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [nome, setNome] = useState('')
  const [ticker, setTicker] = useState('')
  const [tipo, setTipo] = useState('acao')
  const [moeda, setMoeda] = useState('BRL')
  const [corretora, setCorretora] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await criarAtivoInvestimento({
        nome,
        ticker,
        tipo,
        moeda,
        corretora: corretora || null,
      })
      setNome('')
      setTicker('')
      setTipo('acao')
      setMoeda('BRL')
      setCorretora('')
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nao foi possivel criar o ativo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Adicionar ativo</DialogTitle>
          <DialogDescription>
            Cadastre o ativo antes de registrar compras ou vendas.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className={inputClassName}
                placeholder="Itausa"
                required
              />
            </Field>
            <Field label="Ticker">
              <input
                value={ticker}
                onChange={(event) => setTicker(event.target.value.toUpperCase())}
                className={inputClassName}
                placeholder="ITSA4"
                required
              />
            </Field>
            <Field label="Tipo">
              <select value={tipo} onChange={(event) => setTipo(event.target.value)} className={inputClassName}>
                <option value="acao">Acao</option>
                <option value="fii">FII</option>
                <option value="renda_fixa">Renda fixa</option>
                <option value="cripto">Cripto</option>
                <option value="fundo">Fundo</option>
                <option value="outro">Outro</option>
              </select>
            </Field>
            <Field label="Moeda">
              <input
                value={moeda}
                onChange={(event) => setMoeda(event.target.value.toUpperCase())}
                className={inputClassName}
                placeholder="BRL"
                required
              />
            </Field>
            <Field label="Corretora">
              <input
                value={corretora}
                onChange={(event) => setCorretora(event.target.value)}
                className={inputClassName}
                placeholder="Opcional"
              />
            </Field>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting} loadingText="Criando...">
              Criar ativo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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

const inputClassName = 'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-[#1E1E1E] dark:text-gray-100'

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
import { listContas } from '@/features/lancamentos/api'
import { AtivoDetalheModal } from '@/features/investimentos/components/AtivoDetalheModal'
import { AtivosList } from '@/features/investimentos/components/AtivosList'
import { InvestimentosHeader } from '@/features/investimentos/components/InvestimentosHeader'
import { OperacaoModal } from '@/features/investimentos/components/OperacaoModal'
import { useCotacoes, temCotacao } from '@/features/investimentos/hooks/useCotacoes'
import { AtivoSearchInput } from '@/features/investimentos/components/AtivoSearchInput'
import type { InvestimentoAtivoDetalheDTO } from '@/features/investimentos/types'
import type { ContaOption } from '@/features/lancamentos/api'

export default function InvestimentosPage() {
  const { toast } = useToast()
  const [ativos, setAtivos] = useState<InvestimentoAtivoDetalheDTO[]>([])
  const [contas, setContas] = useState<ContaOption[]>([])
  const [precosManual, setPrecosManual] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [detalheTarget, setDetalheTarget] = useState<InvestimentoAtivoDetalheDTO | null>(null)
  const [operacaoTarget, setOperacaoTarget] = useState<InvestimentoAtivoDetalheDTO | null>(null)

  // Tickers de renda variável — usados para buscar cotações
  const tickersComCotacao = useMemo(
    () => ativos.filter(a => temCotacao(a.tipo)).map(a => a.ticker),
    [ativos],
  )
  const { cotacoes, loading: cotacoesLoading } = useCotacoes(tickersComCotacao)

  const loadAtivos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [base, todasContas] = await Promise.all([
        listarAtivosInvestimento(),
        listContas(),
      ])
      const detalhes = await Promise.all(base.map(ativo => obterAtivoInvestimento(ativo.id)))
      setAtivos(detalhes)
      setContas(todasContas.filter(c => c.tipo !== 'credit' && c.tipo !== 'investment'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar investimentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Migração única: cancela lançamentos órfãos criados antes do fix de 2025-05
    const MIGRATION_KEY = 'inv-reconciliated-v1'
    if (typeof window !== 'undefined' && !localStorage.getItem(MIGRATION_KEY)) {
      fetch('/api/investimentos/reconciliar', { method: 'POST' })
        .then(() => localStorage.setItem(MIGRATION_KEY, '1'))
        .catch(() => {})
    }
    const timer = window.setTimeout(() => {
      loadAtivos()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadAtivos])

  // Preço efetivo por ativo: manual override > cotação automática > nulo
  const precosEfetivos = useMemo(() => {
    const map: Record<string, number | null> = {}
    for (const ativo of ativos) {
      const manual  = precosManual[ativo.id] ?? null
      const cotacao = cotacoes[ativo.ticker.toUpperCase()]?.precoCentavos ?? null
      map[ativo.id] = manual ?? cotacao
    }
    return map
  }, [ativos, precosManual, cotacoes])

  // Patrimônio, resultado e variação do dia calculados a partir dos preços efetivos
  const summary = useMemo(() => {
    return ativos.reduce(
      (acc, ativo) => {
        acc.custoTotalCentavos += ativo.posicao.custoTotalCentavos

        const precoAtualCentavos = precosEfetivos[ativo.id]
        if (precoAtualCentavos == null) return acc

        const quantidade          = Number(ativo.posicao.quantidadeAtual)
        const valorAtualCentavos  = Math.round(quantidade * precoAtualCentavos)
        acc.patrimonioCentavos   += valorAtualCentavos
        acc.resultadoCentavos    += valorAtualCentavos - ativo.posicao.custoTotalCentavos

        // Variação do dia em R$ = valorAtual × (variacaoPercent / 100)
        const variacaoPercent = cotacoes[ativo.ticker.toUpperCase()]?.variacaoPercent
        if (variacaoPercent != null) {
          acc.variacaoHojeCentavos += Math.round(valorAtualCentavos * variacaoPercent / 100)
        }

        return acc
      },
      { custoTotalCentavos: 0, patrimonioCentavos: 0, resultadoCentavos: 0, variacaoHojeCentavos: 0 },
    )
  }, [ativos, precosEfetivos, cotacoes])

  const handleAtivoCreated = async () => {
    setCreateOpen(false)
    await loadAtivos()
    toast({
      type: 'success',
      title: 'Ativo criado',
      description: 'Agora você pode registrar compras e vendas.',
    })
  }

  const handleAtivoUpdated = (updated: InvestimentoAtivoDetalheDTO) => {
    setAtivos(current => current.map(ativo => ativo.id === updated.id ? updated : ativo))
    setDetalheTarget(current => current?.id === updated.id ? updated : current)
    setOperacaoTarget(current => current?.id === updated.id ? updated : current)
  }

  const handleAtivoDeleted = (ativoId: string) => {
    setAtivos(current => current.filter(a => a.id !== ativoId))
    setDetalheTarget(null)
    toast({ type: 'success', title: 'Ativo excluído', description: 'O ativo foi removido permanentemente.' })
  }

  const handleOperacaoSuccess = (updated: InvestimentoAtivoDetalheDTO) => {
    handleAtivoUpdated(updated)
    toast({
      type: 'success',
      title: 'Operação registrada',
      description: 'A posição do ativo foi recalculada.',
    })
  }

  const handleCancelSuccess = (updated: InvestimentoAtivoDetalheDTO) => {
    handleAtivoUpdated(updated)
    toast({
      type: 'success',
      title: 'Operação cancelada',
      description: 'O histórico foi preservado e a posição foi recalculada.',
    })
  }

  return (
    <div className="space-y-5">
      <InvestimentosHeader
        totalAtivos={ativos.length}
        custoTotalCentavos={summary.custoTotalCentavos}
        patrimonioCentavos={summary.patrimonioCentavos}
        resultadoCentavos={summary.resultadoCentavos}
        variacaoHojeCentavos={summary.variacaoHojeCentavos}
        cotacoesLoading={cotacoesLoading}
        onNovoAtivo={() => setCreateOpen(true)}
      />

      <AtivosList
        ativos={ativos}
        loading={loading}
        cotacoesLoading={cotacoesLoading}
        error={error}
        cotacoes={cotacoes}
        precosManual={precosManual}
        precosEfetivos={precosEfetivos}
        patrimonioCentavos={summary.patrimonioCentavos}
        onPrecoManualChange={(ativoId, value) => {
          setPrecosManual(current => ({ ...current, [ativoId]: value }))
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
        precoAtualCentavos={detalheTarget ? precosEfetivos[detalheTarget.id] ?? null : null}
        open={!!detalheTarget}
        onOpenChange={(open) => { if (!open) setDetalheTarget(null) }}
        onUpdated={handleCancelSuccess}
        onDeleted={handleAtivoDeleted}
      />

      <OperacaoModal
        ativo={operacaoTarget}
        contas={contas}
        open={!!operacaoTarget}
        onOpenChange={(open) => { if (!open) setOperacaoTarget(null) }}
        onSuccess={handleOperacaoSuccess}
      />
    </div>
  )
}

const TIPO_ATIVO_CONFIG = {
  acao:       { label: 'Ação',        tickerLabel: 'Ticker',    tickerPh: 'ITSA4',    corretoraLabel: 'Corretora',             corretoraPh: 'XP, Rico, Clear…',          nomePh: 'Itaúsa' },
  fii:        { label: 'FII',         tickerLabel: 'Ticker',    tickerPh: 'HGLG11',   corretoraLabel: 'Corretora',             corretoraPh: 'XP, Rico, Clear…',          nomePh: 'CSHG Logística' },
  etf:        { label: 'ETF',         tickerLabel: 'Ticker',    tickerPh: 'BOVA11',   corretoraLabel: 'Corretora',             corretoraPh: 'XP, Rico, Clear…',          nomePh: 'iShares Ibovespa' },
  bdr:        { label: 'BDR',         tickerLabel: 'Ticker',    tickerPh: 'AAPL34',   corretoraLabel: 'Corretora',             corretoraPh: 'XP, Rico, Clear…',          nomePh: 'Apple' },
  cripto:     { label: 'Cripto',      tickerLabel: 'Símbolo',   tickerPh: 'BTC',      corretoraLabel: 'Exchange / Custódia',   corretoraPh: 'Binance, Coinbase, Foxbit…', nomePh: 'Bitcoin' },
  renda_fixa: { label: 'Renda Fixa',  tickerLabel: null,        tickerPh: '',          corretoraLabel: 'Banco / Corretora',     corretoraPh: 'Nubank, XP, Tesouro Direto…', nomePh: 'CDB Nubank 100% CDI' },
  fundo:      { label: 'Fundo',       tickerLabel: null,        tickerPh: '',          corretoraLabel: 'Gestora / Corretora',   corretoraPh: 'XP, BTG, Itaú…',           nomePh: 'Fundo Multimercado XP' },
  outro:      { label: 'Outro',       tickerLabel: null,        tickerPh: '',          corretoraLabel: 'Corretora / Custodiante', corretoraPh: 'Ex.: Tesouro, Corretora…', nomePh: 'Descrição do ativo' },
} as const

type TipoAtivo = keyof typeof TIPO_ATIVO_CONFIG

function gerarCodigoInterno(nome: string): string {
  return nome.trim().replace(/\s+/g, '').toUpperCase().slice(0, 8) || 'ATIVO'
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
  const [nome, setNome]           = useState('')
  const [ticker, setTicker]       = useState('')
  const [tickerAutoFilled, setTickerAutoFilled] = useState(false) // ticker veio do autocomplete
  const [tipo, setTipo]           = useState<TipoAtivo>('acao')
  const [moeda, setMoeda]         = useState('BRL')
  const [corretora, setCorretora] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const cfg       = TIPO_ATIVO_CONFIG[tipo]
  const temTicker = cfg.tickerLabel !== null

  function handleTipoChange(novoTipo: TipoAtivo) {
    setTipo(novoTipo)
    setNome('')
    setTicker('')
    setTickerAutoFilled(false)
  }

  // Callback quando o usuário seleciona uma sugestão do autocomplete
  function handleSugestaoSelect(s: { ticker: string; nome: string; tipo: string }) {
    setNome(s.nome)
    setTicker(s.ticker)
    setTickerAutoFilled(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!corretora.trim()) {
      setError(`Informe o campo "${cfg.corretoraLabel}"`)
      setSubmitting(false)
      return
    }

    const tickerFinal = temTicker
      ? ticker.trim().toUpperCase()
      : gerarCodigoInterno(nome)

    if (temTicker && !tickerFinal) {
      setError(`Informe o campo "${cfg.tickerLabel}"`)
      setSubmitting(false)
      return
    }

    try {
      await criarAtivoInvestimento({
        nome:      nome.trim(),
        ticker:    tickerFinal,
        tipo,
        moeda:     moeda.trim().toUpperCase() || 'BRL',
        corretora: corretora.trim(),
      })
      setNome('')
      setTicker('')
      setTickerAutoFilled(false)
      setTipo('acao')
      setMoeda('BRL')
      setCorretora('')
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar o ativo')
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
            Cadastre o ativo antes de registrar operações.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Tipo — primeiro para adaptar os demais campos */}
          <Field label="Tipo de ativo" required>
            <select
              value={tipo}
              onChange={(e) => handleTipoChange(e.target.value as TipoAtivo)}
              className={inputClassName}
            >
              <option value="acao">Ação</option>
              <option value="fii">FII — Fundo Imobiliário</option>
              <option value="etf">ETF</option>
              <option value="bdr">BDR</option>
              <option value="cripto">Cripto</option>
              <option value="renda_fixa">Renda Fixa (CDB, LCI, Tesouro…)</option>
              <option value="fundo">Fundo de Investimento</option>
              <option value="outro">Outro</option>
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Nome com autocomplete para renda variável e cripto */}
            <Field
              label="Nome"
              required
              className={temTicker ? '' : 'sm:col-span-2'}
            >
              <AtivoSearchInput
                tipo={tipo}
                value={nome}
                onChange={(v) => {
                  setNome(v)
                  // Se o usuário apagou o nome após um autocomplete, limpa o ticker
                  if (tickerAutoFilled && !v) {
                    setTicker('')
                    setTickerAutoFilled(false)
                  }
                }}
                onSelect={handleSugestaoSelect}
                placeholder={cfg.nomePh}
                required
              />
            </Field>

            {/* Ticker: preenchido automaticamente ou manualmente */}
            {temTicker && (
              <Field label={cfg.tickerLabel!} required>
                <div className="relative">
                  <input
                    value={ticker}
                    onChange={(e) => {
                      setTicker(e.target.value.toUpperCase())
                      setTickerAutoFilled(false)
                    }}
                    className={`${inputClassName}${tickerAutoFilled ? ' border-emerald-400 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/[0.07]' : ''}`}
                    placeholder={cfg.tickerPh}
                    required
                    readOnly={tickerAutoFilled}
                  />
                  {tickerAutoFilled && (
                    <button
                      type="button"
                      title="Editar ticker manualmente"
                      onClick={() => { setTickerAutoFilled(false) }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded text-[10px] font-semibold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                    >
                      editar
                    </button>
                  )}
                </div>
                {tickerAutoFilled && (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    ✓ Preenchido automaticamente
                  </p>
                )}
              </Field>
            )}

            <Field label={cfg.corretoraLabel} required>
              <input
                value={corretora}
                onChange={(e) => setCorretora(e.target.value)}
                className={inputClassName}
                placeholder={cfg.corretoraPh}
                required
              />
            </Field>

            <Field label="Moeda">
              <select
                value={moeda}
                onChange={(e) => setMoeda(e.target.value)}
                className={inputClassName}
              >
                <option value="BRL">BRL — Real</option>
                <option value="USD">USD — Dólar americano</option>
                <option value="EUR">EUR — Euro</option>
                <option value="BTC">BTC — Bitcoin</option>
              </select>
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

function Field({ label, children, className, required }: { label: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className ?? ''}`}>
      {label}{required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClassName = 'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-[#1E1E1E] dark:text-gray-100'

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bot,
  Brain,
  CreditCard,
  Loader2,
  Lock,
  Radar,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { streamAssistenteChat } from '@/features/agente-ia/api'
import type { AgenteIaHistoryItem, AgenteIaMessage, AgenteIaQuickPrompt, AgenteIaSnapshot } from '@/features/agente-ia/types'
import { formatBRL } from '@/lib/money'

interface AgenteIAWorkspaceProps {
  isPro: boolean
  isConfigured: boolean
  userName: string
  snapshot: AgenteIaSnapshot
}

const QUICK_PROMPTS: AgenteIaQuickPrompt[] = [
  {
    id: 'caixa',
    title: 'Caixa do mês',
    prompt: 'Analise meu caixa do mês, destaque riscos e me diga a ordem de ação mais importante agora.',
    tone: 'blue',
  },
  {
    id: 'cartao',
    title: 'Cartão e fatura',
    prompt: 'Meu cartão está pressionando o orçamento? Quero um diagnóstico objetivo entre fatura, limite e saldo operacional.',
    tone: 'violet',
  },
  {
    id: 'metas',
    title: 'Metas e aporte',
    prompt: 'Quanto eu consigo aportar nas metas sem estrangular meu mês? Considere meu saldo, compromissos fixos e cartão.',
    tone: 'emerald',
  },
  {
    id: 'ras',
    title: 'RAS e escala',
    prompt: 'Cruze meu RAS, próxima escala e compromissos do mês. Onde está a maior pressão financeira nas próximas semanas?',
    tone: 'amber',
  },
]

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function parseSseChunk(buffer: string) {
  const parts = buffer.split('\n\n')
  return {
    complete: parts.slice(0, -1),
    rest: parts.at(-1) ?? '',
  }
}

function getToneClasses(tone: AgenteIaQuickPrompt['tone']) {
  switch (tone) {
    case 'violet':
      return 'border-violet-200 bg-violet-50/80 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300'
    case 'emerald':
      return 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
    case 'amber':
      return 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
    default:
      return 'border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
  }
}

function toHistory(messages: AgenteIaMessage[]): AgenteIaHistoryItem[] {
  return messages
    .filter((message) => message.status !== 'error')
    .map(({ role, content }) => ({ role, content }))
}

export function AgenteIAWorkspace({
  isPro,
  isConfigured,
  userName,
  snapshot,
}: AgenteIAWorkspaceProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<AgenteIaMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isStreaming])

  const heroTone = useMemo(() => {
    if (snapshot.saldoOperacionalCentavos < 0) return 'Atenção máxima'
    if (snapshot.faturaAtualCentavos > snapshot.limiteDisponivelCentavos) return 'Cartão em foco'
    return 'Leitura estratégica do mês'
  }, [snapshot])

  const disabledReason = !isPro
    ? 'O Agente IA é um recurso do plano PRO.'
    : !isConfigured
      ? 'O ambiente ainda não recebeu a chave da IA.'
      : null

  async function handleSend(messageText?: string) {
    const message = (messageText ?? draft).trim()
    if (!message || isStreaming || disabledReason) return

    const nextUserMessage: AgenteIaMessage = {
      id: makeId('user'),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      status: 'done',
    }

    const nextAssistantMessage: AgenteIaMessage = {
      id: makeId('assistant'),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'streaming',
    }

    const previousMessages = messages
    setMessages((current) => [...current, nextUserMessage, nextAssistantMessage])
    setDraft('')
    setIsStreaming(true)
    setStreamError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await streamAssistenteChat({
        message,
        history: toHistory(previousMessages),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.error ?? 'Falha ao iniciar o Agente IA')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parsed = parseSseChunk(buffer)
        buffer = parsed.rest

        for (const eventBlock of parsed.complete) {
          const dataLines = eventBlock
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())

          if (dataLines.length === 0) continue

          const payload = JSON.parse(dataLines.join('\n')) as
            | { type: 'delta'; text: string }
            | { type: 'done' }
            | { type: 'error'; message: string }

          if (payload.type === 'delta') {
            setMessages((current) => current.map((item) => (
              item.id === nextAssistantMessage.id
                ? { ...item, content: `${item.content}${payload.text}` }
                : item
            )))
          }

          if (payload.type === 'error') {
            throw new Error(payload.message)
          }

          if (payload.type === 'done') {
            setMessages((current) => current.map((item) => (
              item.id === nextAssistantMessage.id
                ? { ...item, status: 'done' }
                : item
            )))
          }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        setMessages((current) => current.map((item) => (
          item.id === nextAssistantMessage.id
            ? {
                ...item,
                status: 'error',
                content: item.content || 'Resposta interrompida pelo usuário.',
              }
            : item
        )))
      } else {
        const messageError = error instanceof Error ? error.message : 'Erro ao consultar o Agente IA'
        setStreamError(messageError)
        setMessages((current) => current.map((item) => (
          item.id === nextAssistantMessage.id
            ? {
                ...item,
                status: 'error',
                content: item.content || 'Não consegui concluir a análise agora. Tente novamente em instantes.',
              }
            : item
        )))
        toast({
          type: 'error',
          title: 'Agente IA indisponível',
          description: messageError,
        })
      }
    } finally {
      abortRef.current = null
      setIsStreaming(false)
    }
  }

  function stopStream() {
    abortRef.current?.abort()
  }

  return (
    <div className="space-y-6 pb-8">
      <Card className="overflow-hidden border-none bg-gradient-to-br from-[#0B1220] via-[#122033] to-[#162C4B] text-white shadow-xl shadow-blue-900/10">
        <CardContent className="p-0">
          <div className="grid gap-6 px-5 py-6 md:grid-cols-[1.3fr_0.9fr] md:px-7 md:py-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/10 bg-white/10 text-white">PRO</Badge>
                <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">{heroTone}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200/80">
                  Centro de comando financeiro
                </p>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Agente IA que cruza caixa, cartão, RAS, metas e rotina em uma resposta só.
                </h1>
                <p className="max-w-2xl text-sm text-blue-100/80 md:text-base">
                  {userName}, este espaço foi desenhado para responder o que realmente importa no seu mês:
                  pressão financeira, folga de caixa, cartão, metas e impacto da rotina operacional.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-200/70">Saldo operacional</p>
                  <p className="mt-1 text-lg font-semibold">{formatBRL(snapshot.saldoOperacionalCentavos)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-200/70">Fatura atual</p>
                  <p className="mt-1 text-lg font-semibold">{formatBRL(snapshot.faturaAtualCentavos)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-200/70">Limite disponível</p>
                  <p className="mt-1 text-lg font-semibold">{formatBRL(snapshot.limiteDisponivelCentavos)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-200/70">RAS do mês</p>
                  <p className="mt-1 text-lg font-semibold">{snapshot.rasHorasMes}h</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/15 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                  <Radar size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Radar do mês</p>
                  <p className="text-xs text-blue-100/70">{snapshot.periodoLabel}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Wallet size={15} className="text-cyan-200" />
                    Caixa do período
                  </div>
                  <p className="mt-1 text-xs text-blue-100/70">
                    Receitas em {formatBRL(snapshot.totalReceitasCentavos)} contra despesas de {formatBRL(snapshot.totalDespesasCentavos)}.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Target size={15} className="text-emerald-200" />
                    Objetivos ativos
                  </div>
                  <p className="mt-1 text-xs text-blue-100/70">
                    {snapshot.metasAtivas} meta(s) ativas e {snapshot.recorrenciasAtivas} recorrência(s) na pressão mensal.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Brain size={15} className="text-violet-200" />
                    Melhor uso
                  </div>
                  <p className="mt-1 text-xs text-blue-100/70">
                    Peça diagnóstico, ordem de ação, plano de metas, leitura de cartão ou cruzamento entre RAS, escala e caixa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {disabledReason ? (
        <Card className="border-dashed border-gray-300/90 dark:border-white/10">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                {!isPro ? <Lock size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {!isPro ? 'Recurso PRO bloqueado' : 'Agente IA indisponível neste ambiente'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{disabledReason}</p>
              </div>
            </div>
            {!isPro ? (
              <Link href="/dashboard/upgrade">
                <Button leftIcon={<Sparkles size={16} />}>Desbloquear Agente IA</Button>
              </Link>
            ) : (
              <Button variant="outline" disabled leftIcon={<Bot size={16} />}>
                Configure ANTHROPIC_API_KEY
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-accent-blue" />
                <CardTitle className="text-xl">Perguntas de alto valor</CardTitle>
              </div>
              <CardDescription>
                Atalhos para puxar o tipo de análise que mais gera clareza ao abrir o app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => void handleSend(prompt.prompt)}
                  disabled={Boolean(disabledReason) || isStreaming}
                  className={`w-full rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${getToneClasses(prompt.tone)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{prompt.title}</span>
                    <Sparkles size={15} />
                  </div>
                  <p className="mt-2 text-sm opacity-90">{prompt.prompt}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Como o agente pensa</CardTitle>
              <CardDescription>
                Ele responde com contexto real do seu sistema, não como um chat genérico.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <TrendingUp size={16} className="text-accent-blue" />
                  Planejamento do mês
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Saldo operacional, receitas, despesas, compromissos fixos e leitura de caixa.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <CreditCard size={16} className="text-violet-500" />
                  Cartão e limite
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Fatura atual, limite usado, limite disponível e peso do cartão sobre o mês.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Target size={16} className="text-emerald-500" />
                  Metas e recorrências
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Metas ativas, recorrências, despesas fixas e ritmo de aporte sem ilusão contábil.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <ShieldAlert size={16} className="text-amber-500" />
                  RAS e rotina
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Cruza RAS, escala futura e pressão financeira para orientar sua próxima decisão.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-gray-200/80 bg-gray-50/70 pb-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl">Conversa com contexto real</CardTitle>
                <CardDescription>
                  Respostas curtas, práticas e orientadas ao seu mês financeiro.
                </CardDescription>
              </div>
              {isStreaming ? (
                <Button variant="outline" size="sm" onClick={stopStream} leftIcon={<X size={15} />}>
                  Parar resposta
                </Button>
              ) : (
                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  Contexto vivo do app
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex min-h-[620px] flex-col p-0">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-6 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue">
                    <Bot size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Comece com uma pergunta que mude sua próxima decisão.
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    O Agente IA já enxerga seu caixa, cartão, RAS, metas e recorrências do período.
                  </p>
                </div>
              ) : null}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-3xl px-4 py-3 shadow-sm md:max-w-[82%] ${
                      message.role === 'user'
                        ? 'bg-accent-blue text-white'
                        : 'border border-gray-200 bg-white text-gray-900 dark:border-white/[0.08] dark:bg-[#1A1A1A] dark:text-gray-100'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                      {message.role === 'user' ? 'Você' : 'Agente IA'}
                      {message.status === 'streaming' ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : null}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.content || '...'}</p>
                    {message.status === 'error' ? (
                      <p className="mt-2 text-xs font-medium text-amber-500">
                        Essa resposta não foi concluída. Você pode reenviar a pergunta.
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}

              {streamError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  {streamError}
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-200/80 bg-gray-50/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/[0.08] dark:bg-[#181818]">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void handleSend()
                    }
                  }}
                  placeholder="Ex.: Meu cartão está me sufocando ou ainda cabe uma meta nova neste mês?"
                  className="min-h-[96px] w-full resize-none border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                  disabled={Boolean(disabledReason) || isStreaming}
                />
                <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 dark:border-white/[0.06] md:flex-row md:items-center md:justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Responde com base no seu contexto financeiro atual. Evite dados sigilosos desnecessários.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMessages([])
                        setDraft('')
                        setStreamError(null)
                      }}
                      disabled={messages.length === 0 || isStreaming}
                    >
                      Limpar conversa
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleSend()}
                      disabled={!draft.trim() || Boolean(disabledReason) || isStreaming}
                      leftIcon={<Send size={15} />}
                    >
                      Enviar análise
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

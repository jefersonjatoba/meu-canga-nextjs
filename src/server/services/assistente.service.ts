import { currentMonthBR, toISODateBR } from '@/lib/dates'
import { formatBRL } from '@/lib/money'
import { prisma } from '@/lib/prisma'
import { getDashboardSummaryForUser } from '@/server/services/dashboard.service'
import type { AgenteIaHistoryItem } from '@/features/agente-ia/types'

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6'
const MAX_HISTORY_ITEMS = 10
const MAX_MESSAGE_CHARS = 4000
const MAX_HISTORY_CHARS = 1200

type AnthropicMessage = {
  role: 'user' | 'assistant'
  content: string
}

export class AssistenteIaError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'AssistenteIaError'
  }
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

function getAnthropicConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    throw new AssistenteIaError('ANTHROPIC_API_KEY não configurada', 503)
  }

  return {
    apiKey,
    model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
  }
}

function cleanText(value: string, maxChars: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxChars)
}

export function normalizeChatHistory(history: AgenteIaHistoryItem[]): AnthropicMessage[] {
  const sanitized = history
    .filter((item): item is AgenteIaHistoryItem => item.role === 'user' || item.role === 'assistant')
    .map((item) => ({
      role: item.role,
      content: cleanText(item.content, MAX_HISTORY_CHARS),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_ITEMS)

  const merged: AnthropicMessage[] = []
  for (const item of sanitized) {
    const previous = merged.at(-1)
    if (previous && previous.role === item.role) {
      previous.content = `${previous.content}\n\n${item.content}`.slice(0, MAX_HISTORY_CHARS * 2)
      continue
    }
    merged.push(item)
  }

  return merged
}

function formatContaType(tipo: string): string {
  switch (tipo) {
    case 'checking': return 'conta corrente'
    case 'savings': return 'poupança'
    case 'wallet': return 'carteira'
    case 'investment': return 'investimento'
    case 'custom': return 'conta personalizada'
    case 'credit': return 'cartão de crédito'
    default: return tipo
  }
}

function buildAssistantSystemPrompt(context: string) {
  return [
    'Você é o Agente IA do MeuCanga.',
    'Atue como consultor financeiro sênior especializado em policiais e profissionais de segurança pública no Brasil.',
    'Responda sempre em português brasileiro, com clareza, objetividade e tom profissional.',
    'Use apenas os dados fornecidos no contexto desta sessão. Se faltar dado, diga isso claramente.',
    'Nunca invente números, lançamentos, saldo, metas ou regras de negócio.',
    'Diferencie explicitamente: saldo em conta, gasto no cartão, fatura, previsto, realizado, RAS e metas.',
    'Quando houver risco, priorize orientação prática e ordem de ação.',
    'Prefira no máximo 4 blocos curtos ou bullets objetivos.',
    'Se o assunto tocar decisão jurídica, tributária ou trabalhista sensível, deixe claro que a resposta é informativa e recomende apoio profissional.',
    '',
    'Contexto financeiro atual do usuário:',
    context,
  ].join('\n')
}

function formatDateLike(value: Date | string): string {
  return typeof value === 'string' ? value : toISODateBR(value)
}

export async function buildFinancialAssistantContext(userId: string, mes?: string): Promise<string> {
  const periodo = mes ?? currentMonthBR()

  const [summary, contas, metas, recorrencias] = await Promise.all([
    getDashboardSummaryForUser(userId, { mes: periodo }),
    prisma.conta.findMany({
      where: { userId, ativa: true },
      orderBy: [{ tipo: 'asc' }, { createdAt: 'desc' }],
      take: 10,
      select: {
        nome: true,
        tipo: true,
        saldoCentavos: true,
        limiteCentavos: true,
        diaFechamento: true,
        diaVencimento: true,
      },
    }),
    prisma.meta.findMany({
      where: { userId, status: 'ativa' },
      orderBy: [{ dataAlvo: 'asc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        descricao: true,
        valorAlvoCentavos: true,
        valorAtualCentavos: true,
        dataAlvo: true,
      },
    }),
    prisma.recorrencia.findMany({
      where: { userId, ativa: true },
      orderBy: [{ valorCentavos: 'desc' }, { createdAt: 'desc' }],
      take: 10,
      select: {
        descricao: true,
        tipo: true,
        valorCentavos: true,
        frequencia: true,
        diaVencimento: true,
        proximaExecucao: true,
      },
    }),
  ])

  const contasLines = contas.length > 0
    ? contas.map((conta) => {
        if (conta.tipo === 'credit') {
          const limite = conta.limiteCentavos != null ? formatBRL(conta.limiteCentavos) : 'não informado'
          return `- ${conta.nome}: ${formatContaType(conta.tipo)}, limite ${limite}, fechamento dia ${conta.diaFechamento ?? '-'}, vencimento dia ${conta.diaVencimento ?? '-'}`
        }
        return `- ${conta.nome}: ${formatContaType(conta.tipo)}, saldo configurado ${formatBRL(conta.saldoCentavos)}`
      }).join('\n')
    : '- Nenhuma conta ativa cadastrada'

  const metasLines = metas.length > 0
    ? metas.map((meta) => {
        const percentual = meta.valorAlvoCentavos > 0
          ? Math.round((meta.valorAtualCentavos / meta.valorAlvoCentavos) * 100)
          : 0
        const dataAlvo = meta.dataAlvo ? toISODateBR(meta.dataAlvo) : 'sem prazo'
        return `- ${meta.descricao}: ${formatBRL(meta.valorAtualCentavos)} de ${formatBRL(meta.valorAlvoCentavos)} (${percentual}%), alvo ${dataAlvo}`
      }).join('\n')
    : '- Nenhuma meta ativa'

  const recorrenciasLines = recorrencias.length > 0
    ? recorrencias.map((recorrencia) => {
        const proxima = recorrencia.proximaExecucao ? toISODateBR(recorrencia.proximaExecucao) : 'sem próxima data'
        return `- ${recorrencia.descricao}: ${recorrencia.tipo === 'income' ? 'receita' : 'despesa'} ${formatBRL(recorrencia.valorCentavos)}, ${recorrencia.frequencia.toLowerCase()}, dia ${recorrencia.diaVencimento}, próxima ${proxima}`
      }).join('\n')
    : '- Nenhuma recorrência ativa'

  const lancamentosLines = summary.lancamentosRecentes.length > 0
    ? summary.lancamentosRecentes
        .slice(0, 8)
        .map((item) => `- ${item.descricao}: ${formatBRL(item.valorCentavos)} em ${typeof item.data === 'string' ? item.data : toISODateBR(item.data)} (${item.tipo})`)
        .join('\n')
    : '- Sem lançamentos recentes no período'

  const proximosRasLines = (summary.proximosRas?.length ?? 0) > 0
    ? summary.proximosRas!.map((ras) => `- ${ras.data} às ${ras.horaInicio}, ${ras.duracao}h em ${ras.local}`).join('\n')
    : '- Nenhum RAS futuro no radar'

  const proximaEscalaLine = summary.proximaEscala
    ? `${summary.proximaEscala.data} às ${summary.proximaEscala.horaInicio}, ${summary.proximaEscala.tipoTurno}, local ${summary.proximaEscala.localServico ?? 'não informado'}, em ${summary.proximaEscala.diasAte} dia(s)`
    : 'Nenhuma escala futura mapeada'

  return [
    `Período analisado: ${summary.periodoLabel}`,
    `Saldo operacional: ${formatBRL(summary.saldoOperacionalCentavos)}`,
    `Receitas do período: ${formatBRL(summary.totalReceitasCentavos)}`,
    `Despesas do período: ${formatBRL(summary.totalDespesasCentavos)}`,
    `Taxa de poupança: ${summary.taxaPoupancaPercentual.toFixed(1)}%`,
    `Patrimônio investido: ${formatBRL(summary.patrimonioInvestidoCentavos)}`,
    `Compromissos fixos previstos: ${formatBRL((summary.recorrenciasPrevistasMesCentavos ?? 0) + (summary.assinaturasPrevistasMesCentavos ?? 0))}`,
    `Recorrências vencidas: ${summary.recorrenciasVencidasCount ?? 0}`,
    `Assinaturas vencidas: ${summary.assinaturasVencidasCount ?? 0}`,
    `RAS do mês: ${summary.totalRasHoras ?? 0}h`,
    `RAS a receber: ${formatBRL(summary.rasAReceberCentavos ?? 0)}`,
    `Horas RAS confirmadas sem pagamento integral: ${summary.rasHorasConfirmadas ?? 0}h`,
    `Cartão - limite usado: ${formatBRL(summary.cartao.limiteUsadoCentavos)}`,
    `Cartão - limite disponível: ${formatBRL(summary.cartao.limiteDisponivelCentavos)}`,
    `Cartão - faturas abertas: ${formatBRL(summary.cartao.valorFaturasAbertasCentavos)}`,
    `Próxima fatura: ${summary.cartao.proximaFatura ? `${summary.cartao.proximaFatura.competencia} no valor de ${formatBRL(summary.cartao.proximaFatura.totalCentavos)} com vencimento em ${formatDateLike(summary.cartao.proximaFatura.dataVencimento)}` : 'nenhuma'}`,
    `Próxima escala: ${proximaEscalaLine}`,
    'Contas ativas:',
    contasLines,
    'Metas ativas:',
    metasLines,
    'Recorrências ativas:',
    recorrenciasLines,
    'Lançamentos recentes:',
    lancamentosLines,
    'Próximos RAS:',
    proximosRasLines,
  ].join('\n')
}

function createSseEvent(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
}

function createAnthropicProxyStream(upstream: Response): ReadableStream<Uint8Array> {
  const reader = upstream.body?.getReader()
  if (!reader) {
    throw new AssistenteIaError('Resposta da IA sem corpo de streaming', 502)
  }

  const decoder = new TextDecoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = ''
      let sentDone = false

      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(createSseEvent(payload))
      }

      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() ?? ''

          for (const chunk of chunks) {
            const dataLines = chunk
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim())

            if (dataLines.length === 0) continue

            const raw = dataLines.join('\n')
            if (!raw || raw === '[DONE]') continue

            const payload = JSON.parse(raw) as {
              type?: string
              delta?: { type?: string; text?: string }
              error?: { message?: string }
            }

            if (payload.type === 'content_block_delta' && payload.delta?.type === 'text_delta' && payload.delta.text) {
              send({ type: 'delta', text: payload.delta.text })
            } else if (payload.type === 'message_stop') {
              sentDone = true
              send({ type: 'done' })
            } else if (payload.type === 'error') {
              sentDone = true
              send({
                type: 'error',
                message: payload.error?.message ?? 'Falha ao gerar resposta da IA',
              })
            }
          }
        }

        if (!sentDone) {
          send({ type: 'done' })
        }
      } catch (error) {
        send({
          type: 'error',
          message: error instanceof Error ? error.message : 'Falha ao transmitir resposta da IA',
        })
      } finally {
        controller.close()
      }
    },
    async cancel() {
      await reader.cancel()
    },
  })
}

export async function createFinancialAssistantStream(input: {
  userId: string
  userName?: string | null
  message: string
  history: AgenteIaHistoryItem[]
  mes?: string
}): Promise<ReadableStream<Uint8Array>> {
  const message = cleanText(input.message, MAX_MESSAGE_CHARS)
  if (message.length < 2) {
    throw new AssistenteIaError('Digite uma mensagem com pelo menos 2 caracteres.')
  }

  const { apiKey, model } = getAnthropicConfig()
  const context = await buildFinancialAssistantContext(input.userId, input.mes)
  const system = buildAssistantSystemPrompt(
    [
      input.userName ? `Usuário: ${input.userName}` : null,
      context,
    ].filter(Boolean).join('\n'),
  )

  const messages: AnthropicMessage[] = [
    ...normalizeChatHistory(input.history),
    { role: 'user', content: message },
  ]

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.4,
      stream: true,
      system,
      messages,
    }),
  })

  if (!upstream.ok) {
    const bodyText = await upstream.text()
    throw new AssistenteIaError(
      bodyText || 'Falha ao consultar o provedor de IA',
      upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
    )
  }

  return createAnthropicProxyStream(upstream)
}

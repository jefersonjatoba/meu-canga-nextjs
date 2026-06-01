import type { AgenteIaHistoryItem } from './types'

export interface StreamAssistenteChatInput {
  message: string
  history: AgenteIaHistoryItem[]
  mes?: string
  signal?: AbortSignal
}

export async function streamAssistenteChat(input: StreamAssistenteChatInput) {
  return fetch('/api/assistente/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: input.message,
      history: input.history,
      mes: input.mes,
    }),
    signal: input.signal,
  })
}

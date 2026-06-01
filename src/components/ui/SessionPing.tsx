'use client'

import { useEffect } from 'react'

// Componente invisível: dispara POST /api/ping quando o dashboard carrega
// Atualiza lastSeenAt e streak do usuário no banco
export function SessionPing() {
  useEffect(() => {
    fetch('/api/ping', { method: 'POST' }).catch(() => {})
  }, [])

  return null
}

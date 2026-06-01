'use client'

import { useState, useCallback } from 'react'
import type { PaywallTrigger } from './PaywallModal'

export function usePaywall() {
  const [trigger, setTrigger] = useState<PaywallTrigger | null>(null)

  const openPaywall = useCallback((t: PaywallTrigger) => setTrigger(t), [])
  const closePaywall = useCallback(() => setTrigger(null), [])

  return { trigger, openPaywall, closePaywall }
}

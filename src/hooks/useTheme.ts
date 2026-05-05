'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'meu-canga-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.setAttribute('data-theme', resolved)
}

/**
 * Read the stored theme synchronously (safe only client-side).
 * Returns the stored value or 'dark' as fallback.
 */
function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark'
}

export function useTheme() {
  // Lazy initializer reads localStorage on first render (client only).
  // This eliminates a render cycle where theme/resolvedTheme were always
  // 'dark' before the hydration useEffect ran, causing the toggle to appear
  // to do nothing on the very first click after a fresh page load.
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const stored = readStoredTheme()
    return stored === 'system' ? getSystemTheme() : stored
  })

  // Apply correct class on first mount (covers SSR→client hand-off).
  useEffect(() => {
    applyTheme(resolvedTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Watch system preference when theme === 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyTheme(resolved)
    }

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)

    const resolved = next === 'system' ? getSystemTheme() : next
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  const toggle = useCallback(() => {
    // Read resolvedTheme directly from state closure — always up-to-date
    // because toggle is re-created whenever resolvedTheme changes.
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return { theme, resolvedTheme, setTheme, toggle }
}

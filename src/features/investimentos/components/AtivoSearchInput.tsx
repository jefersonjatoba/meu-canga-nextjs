'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useAtivoSearch } from '../hooks/useAtivoSearch'
import type { AtivoSugestao } from '../hooks/useAtivoSearch'

interface AtivoSearchInputProps {
  tipo:         string
  value:        string
  onChange:     (nome: string) => void
  onSelect:     (sugestao: AtivoSugestao) => void
  placeholder?: string
  required?:    boolean
}

const TIPO_LABEL: Record<string, string> = {
  acao:      'AÇÃO',
  fii:       'FII',
  etf:       'ETF',
  bdr:       'BDR',
  cripto:    'CRIPTO',
}

export function AtivoSearchInput({
  tipo,
  value,
  onChange,
  onSelect,
  placeholder = 'Digite o nome ou ticker…',
  required,
}: AtivoSearchInputProps) {
  const { sugestoes, buscando } = useAtivoSearch(value, tipo)

  const [aberto, setAberto]           = useState(false)
  const [focusIdx, setFocusIdx]       = useState(-1)
  const inputRef                      = useRef<HTMLInputElement>(null)
  const listRef                       = useRef<HTMLUListElement>(null)
  const containerRef                  = useRef<HTMLDivElement>(null)

  // Abre dropdown quando há sugestões e o campo tem foco
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAberto(sugestoes.length > 0)
      setFocusIdx(-1)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [sugestoes])

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto || sugestoes.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusIdx(i => Math.min(i + 1, sugestoes.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault()
      handleSelect(sugestoes[focusIdx])
    } else if (e.key === 'Escape') {
      setAberto(false)
      setFocusIdx(-1)
    }
  }

  function handleSelect(s: AtivoSugestao) {
    onSelect(s)
    setAberto(false)
    setFocusIdx(-1)
    inputRef.current?.blur()
  }

  // Rola o item focado para dentro da visão
  useEffect(() => {
    if (focusIdx >= 0 && listRef.current) {
      const item = listRef.current.children[focusIdx] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusIdx])

  const semAutoComplete = ['renda_fixa', 'fundo', 'outro'].includes(tipo)
  const listboxId = `ativo-search-listbox-${tipo}`

  if (semAutoComplete) {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={inputClassName}
      />
    )
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input com ícone de busca */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          ref={inputRef}
          value={value}
          onChange={e => { onChange(e.target.value); setAberto(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={`${inputClassName} pl-9 pr-8`}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={aberto}
          aria-haspopup="listbox"
          role="combobox"
        />
        {buscando && (
          <Loader2
            size={13}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
            aria-hidden
          />
        )}
      </div>

      {/* Dropdown de sugestões */}
      {aberto && sugestoes.length > 0 && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-[#1C1C1C]"
          style={{ maxHeight: 280 }}
        >
          {sugestoes.map((s, idx) => {
            const isFocused = idx === focusIdx
            return (
              <li
                key={s.ticker}
                role="option"
                aria-selected={isFocused}
                onMouseDown={e => { e.preventDefault(); handleSelect(s) }}
                onMouseEnter={() => setFocusIdx(idx)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
                  isFocused
                    ? 'bg-blue-50 dark:bg-blue-500/[0.12]'
                    : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                }`}
              >
                {/* Ticker badge */}
                <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-700 dark:bg-white/[0.08] dark:text-gray-300">
                  {s.ticker}
                </span>

                {/* Nome */}
                <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                  {s.nome}
                </span>

                {/* Tipo */}
                {TIPO_LABEL[s.tipo] && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {TIPO_LABEL[s.tipo]}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-[#1E1E1E] dark:text-gray-100'

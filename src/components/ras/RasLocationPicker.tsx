'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  RAS_LOCALS_BPM,
  RAS_LOCALS_SPECIAL,
  RAS_LOCALS_UPP,
} from '@/types/ras'

const LOCAL_GROUPS = [
  { label: 'BPM', options: RAS_LOCALS_BPM as readonly string[] },
  { label: 'Especiais', options: RAS_LOCALS_SPECIAL as readonly string[] },
  { label: 'UPP', options: RAS_LOCALS_UPP as readonly string[] },
]

interface RasLocationPickerProps {
  value: string
  onChange: (local: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  /** Use native select instead of custom dropdown (better for mobile) */
  native?: boolean
}

export function RasLocationPicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'Selecione o local...',
  native = false,
}: RasLocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return LOCAL_GROUPS
    const q = search.toLowerCase().trim()
    return LOCAL_GROUPS.map((g) => ({
      ...g,
      options: g.options.filter((o) => o.toLowerCase().includes(q)),
    })).filter((g) => g.options.length > 0)
  }, [search])

  const totalFiltered = filteredGroups.reduce((s, g) => s + g.options.length, 0)

  // Native select for simpler usage / mobile
  if (native) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg px-3 py-2.5 text-sm',
          'bg-white dark:bg-[#1E1E1E]',
          'text-gray-900 dark:text-gray-100',
          'border border-gray-300 dark:border-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
          'transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <option value="">{placeholder}</option>
        {LOCAL_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    )
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen((o) => !o)
        }}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg px-3 py-2 text-left flex items-center gap-2',
          'border text-sm transition-colors',
          'bg-white dark:bg-gray-900',
          open
            ? 'border-blue-500 dark:border-blue-600'
            : 'border-gray-300 dark:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed',
          !value ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
        )}
      >
        <MapPin size={14} className="shrink-0 text-gray-500 dark:text-gray-400" />
        <span className="flex-1 truncate">{value || placeholder}</span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-gray-500 dark:text-gray-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          style={{
            maxHeight: 340,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar unidade..."
                className="w-full pl-7 pr-7 py-1.5 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 outline-none focus:border-blue-500 dark:focus:border-blue-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {totalFiltered === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                Nenhuma unidade encontrada
              </div>
            ) : (
              filteredGroups.map((g) => (
                <div key={g.label}>
                  <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">
                    {g.label}
                  </div>
                  {g.options.map((local) => (
                    <button
                      key={local}
                      type="button"
                      onClick={() => {
                        onChange(local)
                        setOpen(false)
                        setSearch('')
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs transition-colors',
                        local === value
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      {local}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RasLocationPicker

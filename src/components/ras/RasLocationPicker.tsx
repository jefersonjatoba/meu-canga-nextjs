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
          'w-full rounded-lg px-3 py-2 text-white bg-[#0f0f1a] border border-white/15 text-sm',
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
          open
            ? 'border-blue-500/60 bg-[#0f0f1a]'
            : 'border-white/15 bg-[#0f0f1a]',
          disabled && 'opacity-50 cursor-not-allowed',
          !value ? 'text-gray-400' : 'text-white'
        )}
      >
        <MapPin size={14} className="shrink-0 text-gray-500" />
        <span className="flex-1 truncate">{value || placeholder}</span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-gray-500 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-xl"
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.12)',
            maxHeight: 340,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar unidade..."
                className="w-full pl-7 pr-7 py-1.5 rounded-lg text-sm text-white placeholder:text-gray-600 bg-black/30 border border-white/10 outline-none focus:border-blue-500/50"
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
              <div className="py-6 text-center text-xs text-gray-500">
                Nenhuma unidade encontrada
              </div>
            ) : (
              filteredGroups.map((g) => (
                <div key={g.label}>
                  <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                          ? 'text-blue-300 bg-blue-500/15'
                          : 'text-gray-300 hover:bg-white/06 hover:text-white'
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

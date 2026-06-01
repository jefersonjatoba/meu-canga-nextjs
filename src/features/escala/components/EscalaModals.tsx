'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bell, CalendarDays, Check, ChevronDown, Clock, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import {
  type EscalaConfig,
  type EscalaEntry,
  type TipoEscala,
  type TipoTurno,
  LOCAIS_BPM,
  LOCAIS_CPP,
  LOCAIS_ESPECIAL,
  LOCAIS_UPP,
  TIPO_TURNO_META,
  calcularDias,
  formatarMesAno,
  todaySP,
} from '@/lib/escala'
import {
  aplicarCiclo,
  aplicarPadrao,
  createEscala,
  deleteAllData,
  saveConfig,
  updateEscala,
} from '../api'
import type { EscalaConfigFormData, EscalaFormData } from '../types'

type LocalTab = 'bpm' | 'especial' | 'upp' | 'cpp'

const TIPO_TURNO_OPTIONS = Object.entries(TIPO_TURNO_META).map(([value, meta]) => ({
  value,
  label: `${meta.emoji} ${meta.label}`,
}))

const TIPO_ESCALA_OPTIONS = [
  { value: '24x72', label: '24×72' },
  { value: '24x48', label: '24×48' },
  { value: '12x24-12x72', label: '12×24 + 12×72' },
  { value: '12x24-12x48', label: '12×24 + 12×48' },
  { value: '12x36-folgao', label: '12×36 Folgão' },
]

const HORA_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: `${String(i).padStart(2, '0')}:00`,
  label: `${String(i).padStart(2, '0')}h`,
}))

const NONE_LOCAL = '__none__'
const FIELD_LABEL_CLASS = 'text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none'

function calcHoraFim(tipo: TipoEscala, horaInicio: string): string {
  const h = parseInt(horaInicio.split(':')[0], 10)
  if (tipo === '24x72' || tipo === '24x48') return horaInicio
  return `${String((h + 12) % 24).padStart(2, '0')}:00`
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className={FIELD_LABEL_CLASS}>{children}</p>
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200/80 bg-gray-50/80 p-3.5 dark:border-white/[0.08] dark:bg-white/[0.03] sm:p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm dark:bg-black/20 dark:text-gray-300">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

function SummaryChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white/90 px-3 py-2 dark:border-white/[0.08] dark:bg-black/10">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-300">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ModeActionCard({
  title,
  description,
  accentClassName,
  active,
}: {
  title: string
  description: string
  accentClassName: string
  active?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        active
          ? 'border-blue-300 bg-blue-50/80 dark:border-blue-500/40 dark:bg-blue-500/10'
          : 'border-gray-200 bg-white dark:border-white/[0.08] dark:bg-black/10'
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('mt-1 h-2.5 w-2.5 rounded-full shrink-0', accentClassName)} />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
  helper,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  helper?: string
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    try {
      inputRef.current?.showPicker()
    } catch {
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <button
          type="button"
          onClick={openPicker}
          className="self-start text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required ? <span className="ml-1 text-error" aria-hidden>*</span> : null}
        </button>
      ) : null}
      <div
        onClick={openPicker}
        className={cn(
          'flex w-full items-center rounded-xl border bg-white px-3.5 py-2.5',
          'border-gray-300 dark:border-gray-600 dark:bg-[#1E1E1E]',
          'cursor-pointer transition-all duration-200',
          'focus-within:border-accent-blue focus-within:ring-2 focus-within:ring-accent-blue focus-within:ring-offset-0'
        )}
      >
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="flex-1 cursor-pointer border-0 bg-transparent text-sm text-gray-900 outline-none dark:text-gray-100"
        />
      </div>
      {helper ? <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p> : null}
    </div>
  )
}

export function LocalPickerField({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<LocalTab>('bpm')
  const [search, setSearch] = useState('')

  const selected = value === NONE_LOCAL ? '' : value

  const filteredBPM = search ? LOCAIS_BPM.filter((l) => l.toLowerCase().includes(search.toLowerCase())) : LOCAIS_BPM
  const filteredEsp = search ? LOCAIS_ESPECIAL.filter((l) => l.toLowerCase().includes(search.toLowerCase())) : LOCAIS_ESPECIAL
  const filteredUPP = search ? LOCAIS_UPP.filter((l) => l.toLowerCase().includes(search.toLowerCase())) : LOCAIS_UPP
  const filteredCPP = search ? LOCAIS_CPP.filter((l) => l.toLowerCase().includes(search.toLowerCase())) : LOCAIS_CPP

  const pick = (v: string) => {
    onValueChange(v)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="flex w-full flex-col gap-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm transition-all duration-200',
          'bg-white dark:bg-[#1E1E1E]',
          open
            ? 'rounded-b-none border-blue-500 border-b-transparent ring-2 ring-blue-500/20'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600',
          selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
        )}
      >
        <span className="truncate">{selected || 'Selecionar unidade...'}</span>
        <ChevronDown size={15} className={cn('shrink-0 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="overflow-hidden rounded-b-2xl border border-t-0 border-blue-500 bg-white shadow-lg dark:bg-[#1E1E1E]">
          <div className="border-b border-gray-100 px-3 pb-2 pt-2.5 dark:border-gray-700/60">
            <input
              autoFocus
              type="text"
              placeholder="Buscar unidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100"
            />
          </div>

          {!search ? (
            <div className="border-b border-gray-100 px-2 py-2 dark:border-gray-700/60">
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:min-w-max">
                {([
                  ['bpm', '🏢 Batalhões'],
                  ['especial', '⭐ Especial'],
                  ['upp', '🛡 UPPs'],
                  ['cpp', '🚓 CPP'],
                ] as [LocalTab, string][]).map(([currentTab, label]) => (
                  <button
                    key={currentTab}
                    type="button"
                    onClick={() => setTab(currentTab)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150',
                      tab === currentTab
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="max-h-[320px] overflow-y-auto p-2 sm:max-h-[240px]">
            {search ? (
              <div className="space-y-0.5">
                {[...filteredBPM, ...filteredEsp, ...filteredUPP, ...filteredCPP].length === 0 ? (
                  <p className="py-4 text-center text-xs text-gray-400">Nenhuma unidade encontrada</p>
                ) : (
                  [...filteredBPM, ...filteredEsp, ...filteredUPP, ...filteredCPP].map((local) => (
                    <button
                      key={local}
                      type="button"
                      onClick={() => pick(local)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100',
                        selected === local
                          ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                      )}
                    >
                      {local}
                      {selected === local ? <Check size={12} className="ml-2 inline text-blue-500" /> : null}
                    </button>
                  ))
                )}
              </div>
            ) : tab === 'bpm' ? (
              <div className="space-y-1">
                {filteredBPM.map((local) => {
                  const match = local.match(/^(\d+)º BPM\s*-\s*(.+)$/)
                  const num = match?.[1] ?? local
                  const place = match?.[2] ?? ''
                  return (
                    <button
                      key={local}
                      type="button"
                      onClick={() => pick(local)}
                      title={local}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-100',
                        selected === local
                          ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-6 min-w-[32px] shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-bold',
                          selected === local
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        )}
                      >
                        {num}º
                      </span>
                      <span className="truncate">{place}</span>
                      {selected === local ? <Check size={12} className="ml-auto shrink-0 text-blue-500" /> : null}
                    </button>
                  )
                })}
              </div>
            ) : tab === 'especial' ? (
              <div className="flex flex-wrap gap-1.5">
                {filteredEsp.map((local) => (
                  <button
                    key={local}
                    type="button"
                    onClick={() => pick(local)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-medium transition-all duration-100',
                      selected === local
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-purple-900/20'
                    )}
                  >
                    {local}
                  </button>
                ))}
              </div>
            ) : tab === 'upp' ? (
              <div className="space-y-1">
                {filteredUPP.map((local) => (
                  <button
                    key={local}
                    type="button"
                    onClick={() => pick(local)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100',
                      selected === local
                        ? 'bg-green-50 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                    )}
                  >
                    {local}
                    {selected === local ? <Check size={12} className="ml-2 inline text-green-500" /> : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCPP.map((local) => (
                  <button
                    key={local}
                    type="button"
                    onClick={() => pick(local)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100',
                      selected === local
                        ? 'bg-amber-50 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                    )}
                  >
                    {local}
                    {selected === local ? <Check size={12} className="ml-2 inline text-amber-500" /> : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected ? (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-3 py-2 dark:border-gray-700/60 dark:bg-gray-800/30">
              <span className="truncate text-xs text-gray-500">
                Selecionado: <strong className="text-gray-700 dark:text-gray-300">{selected}</strong>
              </span>
              <button
                type="button"
                onClick={() => pick(NONE_LOCAL)}
                className="ml-2 shrink-0 text-xs font-medium text-red-500 hover:text-red-600"
              >
                Limpar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function ShiftModal({
  open,
  onClose,
  initialData,
  editId,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  initialData?: Partial<EscalaFormData>
  editId?: string
  onSaved: (escala?: EscalaEntry) => void | Promise<void>
}) {
  const today = todaySP()
  const [form, setForm] = useState<EscalaFormData>({
    data: initialData?.data ?? today,
    horaInicio: initialData?.horaInicio ?? '07:00',
    horaFim: initialData?.horaFim ?? '19:00',
    tipo: initialData?.tipo ?? 'plantao',
    local: initialData?.local ?? '',
    observacao: initialData?.observacao ?? '',
    alarmeAtivo: initialData?.alarmeAtivo ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedTipoMeta = TIPO_TURNO_META[form.tipo]
  const turnoLabel = `${form.horaInicio} - ${form.horaFim}`
  const localLabel = form.local?.trim() ? form.local : 'Sem local definido'

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      setForm({
        data: initialData?.data ?? today,
        horaInicio: initialData?.horaInicio ?? '07:00',
        horaFim: initialData?.horaFim ?? '19:00',
        tipo: initialData?.tipo ?? 'plantao',
        local: initialData?.local ?? '',
        observacao: initialData?.observacao ?? '',
        alarmeAtivo: initialData?.alarmeAtivo ?? true,
      })
      setError('')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialData, open, today])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = editId ? await updateEscala(editId, form) : await createEscala(form)
      await onSaved(saved)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Sparkles size={12} />
            {editId ? 'Ajuste rápido' : 'Novo lançamento operacional'}
          </div>
          <DialogTitle>{editId ? 'Editar turno' : 'Adicionar turno'}</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cadastre um serviço de forma rápida, com horário, unidade e alerta no mesmo fluxo.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <SummaryChip
              icon={<CalendarDays size={14} />}
              label="Data"
              value={form.data || 'Selecione'}
            />
            <SummaryChip
              icon={<Clock size={14} />}
              label="Janela"
              value={turnoLabel}
            />
            <SummaryChip
              icon={<MapPin size={14} />}
              label="Local"
              value={localLabel}
            />
          </div>

          <FormSection
            icon={<CalendarDays size={17} />}
            title="Quando acontece"
            description="Defina a data, o tipo de serviço e a janela do turno."
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <FieldLabel>Data *</FieldLabel>
                  <DateField
                    label=""
                    value={form.data}
                    onChange={(value) => setForm((current) => ({ ...current, data: value }))}
                    required
                  />
                </div>
                <Select
                  label="Tipo de serviço *"
                  labelClassName={FIELD_LABEL_CLASS}
                  options={TIPO_TURNO_OPTIONS}
                  value={form.tipo}
                  onValueChange={(value) => setForm((current) => ({ ...current, tipo: value as TipoTurno }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Hora início *"
                  labelClassName={FIELD_LABEL_CLASS}
                  options={HORA_OPTIONS}
                  value={form.horaInicio}
                  onValueChange={(value) => setForm((current) => ({ ...current, horaInicio: value }))}
                  required
                />
                <Select
                  label="Hora fim *"
                  labelClassName={FIELD_LABEL_CLASS}
                  options={HORA_OPTIONS}
                  value={form.horaFim}
                  onValueChange={(value) => setForm((current) => ({ ...current, horaFim: value }))}
                  required
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2.5 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  {selectedTipoMeta?.emoji} {selectedTipoMeta?.label} programado para {form.data || 'uma data a definir'}, das {form.horaInicio} às {form.horaFim}.
                </p>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={<MapPin size={17} />}
            title="Onde e com qual contexto"
            description="Associe o turno a uma unidade e registre uma observação curta, se precisar."
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <FieldLabel>Local do serviço</FieldLabel>
                <LocalPickerField
                  value={form.local || NONE_LOCAL}
                  onValueChange={(value) => setForm((current) => ({ ...current, local: value === NONE_LOCAL ? '' : value }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <FieldLabel>
                  Observação <span className="normal-case font-normal">({form.observacao.length}/200)</span>
                </FieldLabel>
                <textarea
                  value={form.observacao}
                  onChange={(e) => setForm((current) => ({ ...current, observacao: e.target.value.slice(0, 200) }))}
                  rows={3}
                  placeholder="Observações opcionais..."
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={<Bell size={17} />}
            title="Lembrete operacional"
            description="Ative o alerta para não deixar o próximo serviço passar batido."
          >
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/[0.08] dark:bg-black/10">
              <button
                type="button"
                role="switch"
                aria-checked={form.alarmeAtivo}
                onClick={() => setForm((current) => ({ ...current, alarmeAtivo: !current.alarmeAtivo }))}
                className={cn(
                  'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
                  form.alarmeAtivo ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                    form.alarmeAtivo ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  )}
                />
              </button>
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                  <Bell size={13} className={form.alarmeAtivo ? 'text-blue-500' : 'text-gray-400'} />
                  Notificação 12h antes do serviço
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  O aviso será enviado via email e push quando disponível.
                </p>
              </div>
            </label>
          </FormSection>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <AlertTriangle size={16} className="shrink-0 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={saving} loadingText="Salvando...">
              {editId ? 'Salvar alterações' : 'Adicionar turno'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ConfigModal({
  open,
  onClose,
  currentConfig,
  currentAno,
  currentMes,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  currentConfig: EscalaConfig | null
  currentAno: number
  currentMes: number
  onSaved: () => void | Promise<void>
}) {
  const [form, setForm] = useState<EscalaConfigFormData>({
    tipo: currentConfig?.tipo ?? '24x72',
    horaInicio: currentConfig?.horaInicio ?? '07:00',
    horaFim: currentConfig?.horaFim ?? '07:00',
    inicioCiclo: currentConfig?.inicioCiclo ?? todaySP(),
    local: currentConfig?.local ?? '',
    alarmeAtivo: currentConfig?.alarmeAtivo ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [applyingCycle, setApplyingCycle] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const computedHoraFim = calcHoraFim(form.tipo, form.horaInicio)
  const localLabel = form.local?.trim() ? form.local : 'Selecione o local'

  const previewDays = useMemo(() => {
    if (!form.inicioCiclo) return []
    try {
      const [ano, mes, dia] = form.inicioCiclo.split('-').map(Number)
      return calcularDias(form.tipo as TipoEscala, new Date(ano, mes - 1, dia), currentAno, currentMes)
    } catch {
      return []
    }
  }, [currentAno, currentMes, form.inicioCiclo, form.tipo])

  useEffect(() => {
    if (!open) return
    const tipo = currentConfig?.tipo ?? '24x72'
    const horaInicio = currentConfig?.horaInicio ?? '07:00'
    const timer = window.setTimeout(() => {
      setForm({
        tipo,
        horaInicio,
        horaFim: currentConfig?.horaFim ?? calcHoraFim(tipo, horaInicio),
        inicioCiclo: currentConfig?.inicioCiclo ?? todaySP(),
        local: currentConfig?.local ?? '',
        alarmeAtivo: currentConfig?.alarmeAtivo ?? true,
      })
      setError('')
      setConfirmDelete(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [currentConfig, open])

  const validateLocal = () => {
    if (!form.local || form.local === NONE_LOCAL) {
      setError('Selecione o local do serviço')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLocal()) return
    if (previewDays.length === 0) {
      setError('Nenhum dia de plantão calculado. Verifique a data de início do ciclo.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveConfig(form)
      await aplicarPadrao({
        dias: previewDays,
        ano: currentAno,
        mes: currentMes,
        horaInicio: form.horaInicio,
        horaFim: computedHoraFim,
        local: form.local,
        alarmeAtivo: form.alarmeAtivo,
      })
      await onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyCycle = async () => {
    if (!validateLocal()) return
    setApplyingCycle(true)
    setError('')
    try {
      await saveConfig(form)
      await aplicarCiclo({
        dataInicio: form.inicioCiclo,
        tipo: form.tipo as TipoEscala,
        horaInicio: form.horaInicio,
        horaFim: computedHoraFim,
        local: form.local,
        alarmeAtivo: form.alarmeAtivo,
      })
      await onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar ciclo')
    } finally {
      setApplyingCycle(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    try {
      await deleteAllData()
      await onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover dados')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Sparkles size={12} />
            Padrão operacional
          </div>
          <DialogTitle>Configurar escala</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Defina o ciclo principal, valide os dias calculados e escolha com clareza se quer aplicar só neste mês ou expandir até dezembro.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <SummaryChip
              icon={<ShieldCheck size={14} />}
              label="Escala"
              value={form.tipo}
            />
            <SummaryChip
              icon={<Clock size={14} />}
              label="Janela"
              value={`${form.horaInicio} - ${computedHoraFim}`}
            />
            <SummaryChip
              icon={<MapPin size={14} />}
              label="Local"
              value={localLabel}
            />
          </div>

          <FormSection
            icon={<ShieldCheck size={17} />}
            title="Padrão da escala"
            description="Essa é a base do ciclo usada para montar automaticamente seus plantões."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                label="Tipo de escala *"
                labelClassName={FIELD_LABEL_CLASS}
                options={TIPO_ESCALA_OPTIONS}
                value={form.tipo}
                onValueChange={(value) => setForm((current) => ({ ...current, tipo: value as TipoEscala }))}
                required
              />
              <div className="flex flex-col gap-1">
                <FieldLabel>Início do ciclo *</FieldLabel>
                <DateField
                  label=""
                  value={form.inicioCiclo}
                  onChange={(value) => setForm((current) => ({ ...current, inicioCiclo: value }))}
                  required
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Select
                label="Hora início *"
                labelClassName={FIELD_LABEL_CLASS}
                options={HORA_OPTIONS}
                value={form.horaInicio}
                onValueChange={(value) => setForm((current) => ({ ...current, horaInicio: value, horaFim: calcHoraFim(current.tipo, value) }))}
                required
              />
              <div className="flex flex-col gap-1">
                <FieldLabel>
                  Hora fim <span className="normal-case font-normal">(automático)</span>
                </FieldLabel>
                <div className="flex h-[42px] items-center rounded-xl border border-gray-200 bg-white px-3.5 dark:border-gray-700 dark:bg-gray-800/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{computedHoraFim}</span>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={<MapPin size={17} />}
            title="Operação e alerta"
            description="Vincule o local principal da escala e escolha se o lembrete deve ficar ativo."
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <FieldLabel>Local do serviço *</FieldLabel>
                <LocalPickerField
                  value={form.local || NONE_LOCAL}
                  onValueChange={(value) => setForm((current) => ({ ...current, local: value === NONE_LOCAL ? '' : value }))}
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/[0.08] dark:bg-black/10">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.alarmeAtivo}
                  onClick={() => setForm((current) => ({ ...current, alarmeAtivo: !current.alarmeAtivo }))}
                  className={cn(
                    'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
                    form.alarmeAtivo ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                      form.alarmeAtivo ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    )}
                  />
                </button>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    <Bell size={13} className={form.alarmeAtivo ? 'text-blue-500' : 'text-gray-400'} />
                    Notificação 12h antes do serviço
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    O alerta acompanha a escala principal e pode ser usado tanto no mês atual quanto no ciclo estendido.
                  </p>
                </div>
              </label>
            </div>
          </FormSection>

          <FormSection
            icon={<Clock size={17} />}
            title="Aplicação do ciclo"
            description="Revise os dias deste mês e decida se a configuração vale só para o calendário atual ou para o ciclo completo."
          >
            <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <ModeActionCard
                title="Aplicar ao mês atual"
                description={`Cria ou sincroniza apenas os plantões de ${formatarMesAno(currentAno, currentMes)} com base neste padrão.`}
                accentClassName="bg-blue-500"
                active
              />
              <ModeActionCard
                title="Expandir até dezembro"
                description="Usa a mesma configuração para projetar o ciclo completo até o fim do ano, mantendo a visão mensal consistente."
                accentClassName="bg-violet-500"
              />
            </div>

            {previewDays.length > 0 ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-800/50 dark:bg-blue-900/20">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                  Dias calculados — {formatarMesAno(currentAno, currentMes)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {previewDays.map((day) => (
                    <span
                      key={day}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white"
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  {previewDays.length} dia{previewDays.length !== 1 ? 's' : ''} de plantão neste mês
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-black/10 dark:text-gray-400">
                Ajuste o tipo e a data de início do ciclo para visualizar os plantões calculados.
              </div>
            )}

            <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                Dica: use <strong>Aplicar ao mês</strong> quando quiser corrigir ou atualizar somente o calendário visível. Use <strong>Até dezembro</strong> quando o padrão já estiver fechado e você quiser projetar o restante do ano.
              </p>
            </div>
          </FormSection>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <AlertTriangle size={16} className="shrink-0 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          ) : null}

          <DialogFooter className="gap-2 pt-1">
            {currentConfig ? (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                isLoading={deleting}
                loadingText="Removendo..."
                className="sm:mr-auto"
              >
                {confirmDelete ? 'Confirmar exclusão?' : 'Remover todos os dados'}
              </Button>
            ) : null}
            <DialogClose asChild>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="secondary"
              onClick={handleApplyCycle}
              isLoading={applyingCycle}
              loadingText="Aplicando até dez..."
              className="sm:min-w-[170px]"
            >
              Até dezembro
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              loadingText={`Aplicando ${previewDays.length} dia${previewDays.length !== 1 ? 's' : ''}...`}
              className="sm:min-w-[170px]"
            >
              Aplicar ao mês
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

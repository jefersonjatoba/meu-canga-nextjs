'use client'

import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Settings, X, Trash2, Edit2 } from 'lucide-react'
import { calculateCycleDays, calcularProgressoPlantao } from '@/lib/escala-calculations'
import { CYCLE_LABELS, CYCLE_TYPES, type TipoCiclo } from '@/types/escala'
import { RAS_LOCALS_BPM, RAS_LOCALS_SPECIAL, RAS_LOCALS_UPP } from '@/types/ras'

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const TODOS_OS_LOCAIS = [
  { label: 'Batalhões', options: RAS_LOCALS_BPM },
  { label: 'Unidades Especiais', options: RAS_LOCALS_SPECIAL },
  { label: 'UPPs', options: RAS_LOCALS_UPP },
  { label: 'CPP', options: ['CPP - Coordenadoria de Polícia de Proximidade'] },
]

const TIPOS_PLANTAO = [
  { value: 'plantao', label: '🏥 Plantão' },
  { value: 'sobreaviso', label: '📟 Sobreaviso' },
  { value: 'extra', label: '⭐ Extra' },
  { value: 'folga', label: '🌴 Folga' },
  { value: 'ferias', label: '🏖 Férias' },
]

function currentMesBR(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).slice(0, 7)
}

function getTodayBR(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function isoFmt(iso: string): string {
  const [y, m, d] = iso.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return `${DAYS[date.getDay()]}, ${d} ${MONTHS[Number(m)]}`
}

function diasAte(iso: string): number {
  const h = new Date()
  h.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(iso + 'T00:00:00').getTime() - h.getTime()) / 86400000)
}

// Componente Calendar (memoizado para evitar re-renders desnecessários)
const Calendar = React.memo(function Calendar({ mes, escalas, previewDays, onPrevMonth, onNextMonth, configTipo }: { mes: string; escalas: any[]; previewDays: number[]; onPrevMonth: () => void; onNextMonth: () => void; configTipo?: string }) {
  const [ano, m] = mes.split('-').map(Number)
  const hoje = getTodayBR()

  const firstWD = new Date(ano, m - 1, 1).getDay()
  const diasMes = new Date(ano, m, 0).getDate()

  // Memoizar mapa de escalas e progressos usando lógica idêntica ao v1
  const escalasMap = useMemo(() => {
    const map: Record<string, { escala: any; progresso: { pct: number; status: string } }> = {}
    escalas.forEach((escala) => {
      const isoDate = escala.dataEscala.split('T')[0]
      if (!map[isoDate]) {
        // Usa tipoConfig da configuração ativa, com fallback para "plantao" (24h)
        const tipoParaCalculo = configTipo || escala.tipoTurno || 'plantao'
        const horaInicio = escala.horaInicio || '07:00'
        map[isoDate] = {
          escala,
          progresso: calcularProgressoPlantao(isoDate, horaInicio, tipoParaCalculo),
        }
      }
    })
    return map
  }, [escalas, configTipo, hoje])

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-4 py-3 flex items-center justify-between">
        <button onClick={onPrevMonth} className="p-2 hover:bg-blue-700 rounded">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <h3 className="text-white font-bold text-base">{MONTHS[m]} {ano}</h3>
        <button onClick={onNextMonth} className="p-2 hover:bg-blue-700 rounded">
          <ChevronRight size={18} className="text-white" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        {DAYS.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-bold text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
        {Array(firstWD).fill(0).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-100 dark:bg-gray-800 h-20" />
        ))}

        {Array.from({ length: diasMes }).map((_, i) => {
          const day = i + 1
          const iso = `${ano}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = iso === hoje
          const escalaInfo = escalasMap[iso]
          const isFromEscala = !!escalaInfo
          const isFromCycle = previewDays.includes(day)
          const escalaDodia = escalaInfo?.escala
          const progresso = escalaInfo?.progresso || { pct: 0, status: 'futuro' }

          return (
            <div
              key={iso}
              className={`p-2 h-20 flex flex-col items-center justify-center text-sm font-medium cursor-pointer transition-colors relative ${
                isToday
                  ? 'bg-blue-600 text-white'
                  : isFromEscala
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                    : isFromCycle
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="font-bold">{day}</span>
              {isFromEscala && <span className="text-xs mt-1">✅</span>}
              {isFromCycle && !isFromEscala && <span className="text-xs mt-1">📅</span>}
              {escalaDodia && progresso.pct > 0 && (
                <div className="w-full h-1 bg-gray-300 rounded mt-1 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      progresso.status === 'em_progresso' ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(progresso.pct, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

// Modal para Editar/Criar Plantão
function ModalPlantao({
  isOpen,
  editingData,
  onClose,
  onSave,
  hoje,
}: {
  isOpen: boolean
  editingData?: any
  onClose: () => void
  onSave: (data: any) => void
  hoje: string
}) {
  const defaultForm = {
    data: hoje,
    tipo: 'plantao',
    horaInicio: '07:00',
    horaFim: '19:00',
    local: '',
    localManual: '',
    observacao: '',
    alarmeAtivo: true,
  }
  const [formData, setFormData] = useState(editingData || defaultForm)

  // Resetar formulário quando editingData ou isOpen mudar — igual ao v1
  useEffect(() => {
    setFormData(editingData || defaultForm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingData, isOpen])

  return isOpen ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingData ? '✏️ Editar Plantão' : '➕ Novo Plantão'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            >
              {TIPOS_PLANTAO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horário de início</label>
            <input
              type="time"
              value={formData.horaInicio}
              onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horário de término</label>
            <input
              type="time"
              value={formData.horaFim}
              onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Local</label>
          <select
            value={formData.local}
            onChange={(e) => setFormData({ ...formData, local: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">— Selecione —</option>
            {TODOS_OS_LOCAIS.map((grupo) => (
              <optgroup key={grupo.label} label={grupo.label}>
                {grupo.options.map((local) => (
                  <option key={local} value={local}>
                    {local}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="outro">📝 Outros</option>
          </select>
        </div>

        {formData.local === 'outro' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especificar local</label>
            <input
              type="text"
              value={formData.localManual}
              onChange={(e) => setFormData({ ...formData, localManual: e.target.value })}
              placeholder="Digite o local..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observação</label>
          <input
            type="text"
            value={formData.observacao}
            onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            placeholder="Ex: Escala trocada..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="alarme"
            checked={formData.alarmeAtivo}
            onChange={(e) => setFormData({ ...formData, alarmeAtivo: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="alarme" className="text-sm text-gray-700 dark:text-gray-300">
            🔔 Notificação 12h antes
          </label>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ✅ Salvar
          </button>
        </div>
      </div>
    </div>
  ) : null
}

// Componente interno que usa useSearchParams (precisa de Suspense boundary)
function EscalaPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Inicializar mês diretamente de searchParams — sem useState(null)
  const mesFromURL = searchParams.get('mes') || currentMesBR()
  const [mes, setMes] = useState<string>(mesFromURL)

  const [escalas, setEscalas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showPlantaoModal, setShowPlantaoModal] = useState(false)
  const [editingPlantao, setEditingPlantao] = useState<any>(null)

  // Config modal state
  const [tipoCiclo, setTipoCiclo] = useState<TipoCiclo | ''>('')
  const [dataInicio, setDataInicio] = useState('')
  const [horaInicio, setHoraInicio] = useState('07:00')
  const [horaFim, setHoraFim] = useState('19:00')
  const [localConfig, setLocalConfig] = useState('')
  const [localManualConfig, setLocalManualConfig] = useState('')
  const [alarmeConfig, setAlarmeConfig] = useState(true)
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  const [savedCycleConfig, setSavedCycleConfig] = useState<{
    tipo: TipoCiclo
    dataInicio: string
    horaInicio: string
    horaFim: string
    localServico?: string
  } | null>(null)

  // Sincronizar mês quando searchParams mudar (navegação prev/next)
  useEffect(() => {
    const newMes = searchParams.get('mes') || currentMesBR()
    setMes(newMes)
  }, [searchParams])

  // Carregar configuração de ciclo salva na API
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/escala/config')
        const data = await res.json()
        if (data.success && data.data?.config) {
          const c = data.data.config
          setSavedCycleConfig({
            tipo: c.tipo as TipoCiclo,
            dataInicio: c.inicioCiclo,
            horaInicio: c.horaInicio,
            horaFim: c.horaFim,
            localServico: c.localServico || undefined,
          })
          setTipoCiclo(c.tipo as TipoCiclo)
          setDataInicio(c.inicioCiclo)
          setHoraInicio(c.horaInicio)
          setHoraFim(c.horaFim)
          setLocalConfig(c.localServico || '')
          setAlarmeConfig(c.alarmeAtivo)
        }
      } catch { /* config opcional */ }
    }
    loadConfig()
  }, [])

  const hoje = getTodayBR()
  const [ano, mesNum] = mes ? mes.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]

  // Navegação de meses
  const handlePrevMonth = useCallback(() => {
    if (!mes) return
    const [y, m] = mes.split('-').map(Number)
    const newMes = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
    router.push(`?mes=${newMes}`)
  }, [mes, router])

  const handleNextMonth = useCallback(() => {
    if (!mes) return
    const [y, m] = mes.split('-').map(Number)
    const newMes = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
    router.push(`?mes=${newMes}`)
  }, [mes, router])

  // Carregar escalas — mes sempre é string válida agora
  React.useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/escala?mes=${mes}`)
        const data = await res.json()
        if (data.success) setEscalas(data.data.escalas || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [mes])

  // Calcular dias de ciclo
  const previewDays = useMemo(() => {
    if (!tipoCiclo || !dataInicio || !mes) return []
    try {
      const startDate = new Date(dataInicio)
      return calculateCycleDays(tipoCiclo as TipoCiclo, startDate, ano, mesNum)
    } catch {
      return []
    }
  }, [tipoCiclo, dataInicio, ano, mesNum, mes])

  // Proximos plantões - memoizado para evitar re-renders desnecessários
  const proximos = useMemo(() => {
    const agora = new Date()
    agora.setHours(0, 0, 0, 0)
    return escalas
      .filter((e) => {
        const data = new Date(e.dataEscala)
        data.setHours(0, 0, 0, 0)
        return data >= agora
      })
      .sort((a, b) => new Date(a.dataEscala).getTime() - new Date(b.dataEscala).getTime())
      .slice(0, 1)
  }, [escalas])

  // Salvar novo plantão
  const handleSavePlantao = async (data: any) => {
    try {
      const res = await fetch('/api/escala/marcar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: data.data,
          hora_inicio: data.horaInicio,
          hora_fim: data.horaFim,
          tipo: data.tipo,
          local: data.local === 'outro' ? data.localManual : data.local,
          observacao: data.observacao,
          alarme_ativo: data.alarmeAtivo,
        }),
      })
      if (res.ok) {
        // Recarregar escalas
        const res2 = await fetch(`/api/escala?mes=${mes}`)
        const data2 = await res2.json()
        if (data2.success) setEscalas(data2.data.escalas || [])
        setShowPlantaoModal(false)
        setEditingPlantao(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Apagar plantão
  const handleDeletePlantao = async (data: string, hora: string) => {
    if (!confirm('Tem certeza que deseja apagar este plantão?')) return
    try {
      const res = await fetch('/api/escala/desmarcar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, hora_inicio: hora }),
      })
      if (res.ok) {
        setEscalas(escalas.filter((e) => !(e.dataEscala.split('T')[0] === data && e.horaInicio === hora)))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📅 Escala Ordinária</h1>
          {savedCycleConfig && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✅ Ciclo: {CYCLE_LABELS[savedCycleConfig.tipo]} • Início: {new Date(savedCycleConfig.dataInicio).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Settings size={16} />
          ⚙️ Configurar
        </button>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2">
          {mes && <Calendar mes={mes} escalas={escalas} previewDays={previewDays} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} configTipo={savedCycleConfig?.tipo} />}
        </div>

        {/* Coluna Direita */}
        <div className="space-y-4">
          {/* Escala Ativa */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="font-bold text-gray-900 dark:text-white mb-3">🗓 Escala Ativa</div>
            {savedCycleConfig ? (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-bold mr-2">
                      {CYCLE_LABELS[savedCycleConfig.tipo]}
                    </span>
                    {savedCycleConfig.horaInicio} → {savedCycleConfig.horaFim}
                  </div>
                  {savedCycleConfig.localServico && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">📍 {savedCycleConfig.localServico}</div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Ciclo iniciado em {new Date(savedCycleConfig.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    ✏️ Reconfigurar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Tem certeza? Isso vai deletar a configuração e TODOS os plantões agendados.')) return
                      if (!confirm('ÚLTIMA confirmação: Você realmente quer deletar tudo?')) return
                      try {
                        await fetch('/api/escala/config', { method: 'DELETE' })
                        setSavedCycleConfig(null)
                        setTipoCiclo('')
                        setDataInicio('')
                        setEscalas([])
                      } catch { alert('Erro ao deletar') }
                    }}
                    className="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100"
                    title="Deletar escala e todos os plantões"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma escala configurada</p>
            )}
          </div>

          {/* Próximo Plantão */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="font-bold text-gray-900 dark:text-white mb-3">⏰ Próximo</div>
            {proximos.length > 0 ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {diasAte(proximos[0].dataEscala) === 0
                    ? 'HOJE 🔥'
                    : diasAte(proximos[0].dataEscala) === 1
                      ? 'Amanhã'
                      : `Em ${diasAte(proximos[0].dataEscala)}d`}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">{isoFmt(proximos[0].dataEscala.split('T')[0])}</div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum plantão</p>
            )}
          </div>

          {/* Estatísticas */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="font-bold text-gray-900 dark:text-white mb-3">📊 Mês</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Total</div>
                <div className="font-bold text-2xl text-gray-900 dark:text-white">{escalas.length}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Próx.</div>
                <div className="font-bold text-2xl text-blue-600">{proximos.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Plantões */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-gray-900 dark:text-white">📋 Plantões do Mês</div>
          <button
            onClick={() => {
              setEditingPlantao(null)
              setShowPlantaoModal(true)
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ➕ Novo
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {escalas.length > 0 ? (
            escalas.map((e: any) => (
              <div
                key={`${e.id}-${e.dataEscala}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-sm border-l-3 border-blue-500"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {isoFmt(e.dataEscala.split('T')[0])}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {e.horaInicio || '07:00'}h — {e.localServico || 'Local não definido'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingPlantao(e)
                      setShowPlantaoModal(true)
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleDeletePlantao(
                        e.dataEscala.split('T')[0],
                        e.horaInicio || '07:00'
                      )
                    }
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                    title="Apagar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">Nenhum plantão cadastrado</p>
          )}
        </div>
      </div>

      {/* Modal Plantão */}
      <ModalPlantao
        isOpen={showPlantaoModal}
        editingData={editingPlantao}
        onClose={() => {
          setShowPlantaoModal(false)
          setEditingPlantao(null)
        }}
        onSave={handleSavePlantao}
        hoje={hoje}
      />

      {/* Modal Configurar Ciclo */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">⚙️ Configurar Escala</h2>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
              Escolha o tipo de escala e a data de início — os dias de trabalho do mês serão preenchidos automaticamente.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Escala</label>
                  <select
                    value={tipoCiclo}
                    onChange={(e) => setTipoCiclo(e.target.value as TipoCiclo)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">— Selecione —</option>
                    {CYCLE_TYPES.map((type) => (
                      <option key={type} value={type}>{CYCLE_LABELS[type]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data de início do ciclo</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Horário de início</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Horário de término</label>
                  <input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Local de Serviço</label>
                <select
                  value={localConfig}
                  onChange={(e) => setLocalConfig(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">— Selecione um local —</option>
                  {TODOS_OS_LOCAIS.map((grupo) => (
                    <optgroup key={grupo.label} label={grupo.label}>
                      {grupo.options.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="outro">📝 Outros (digitar manualmente)</option>
                </select>
              </div>

              {localConfig === 'outro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Especificar local</label>
                  <input
                    type="text"
                    value={localManualConfig}
                    onChange={(e) => setLocalManualConfig(e.target.value)}
                    placeholder="Digite o local..."
                    maxLength={120}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="alarme-config"
                  checked={alarmeConfig}
                  onChange={(e) => setAlarmeConfig(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <label htmlFor="alarme-config" className="text-sm text-gray-700 dark:text-gray-300">
                  🔔 Notificação 12h antes do serviço
                </label>
              </div>

              {tipoCiclo && dataInicio && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    📋 Dias calculados para {MONTHS[mesNum]} {ano}:
                  </h3>
                  <div className="flex flex-wrap gap-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    {previewDays.map((d) => (
                      <span key={d} className="bg-blue-600 text-white rounded px-2 py-0.5 text-xs font-bold">{d}</span>
                    ))}
                    {previewDays.length === 0 && <span className="text-xs text-gray-500">Nenhum dia calculado</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {previewDays.length} dias de trabalho neste mês
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!tipoCiclo || !dataInicio) return
                    const localFinal = localConfig === 'outro' ? localManualConfig : localConfig
                    if (!localFinal.trim()) {
                      alert('Selecione ou digite um local de serviço')
                      return
                    }
                    setSalvandoConfig(true)
                    try {
                      // 1. Salvar config na API
                      await fetch('/api/escala/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          tipo: tipoCiclo,
                          hora_inicio: horaInicio,
                          hora_fim: horaFim,
                          inicio_ciclo: dataInicio,
                          local: localFinal,
                          alarme_ativo: alarmeConfig,
                        }),
                      })

                      // 2. Criar registros de escala para cada dia calculado
                      const [y, mo] = mes.split('-')
                      let erros = 0
                      for (const day of previewDays) {
                        const iso = `${y}-${mo}-${String(day).padStart(2, '0')}`
                        try {
                          const r = await fetch('/api/escala/marcar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              data: iso,
                              hora_inicio: horaInicio,
                              hora_fim: horaFim,
                              tipo: 'plantao',
                              local: localFinal,
                              observacao: tipoCiclo,
                              alarme_ativo: alarmeConfig,
                            }),
                          })
                          if (!r.ok) erros++
                        } catch { erros++ }
                      }

                      // 3. Atualizar estado local
                      setSavedCycleConfig({
                        tipo: tipoCiclo as TipoCiclo,
                        dataInicio,
                        horaInicio,
                        horaFim,
                        localServico: localFinal,
                      })

                      // 4. Recarregar escalas
                      const res = await fetch(`/api/escala?mes=${mes}`)
                      const data = await res.json()
                      if (data.success) setEscalas(data.data.escalas || [])

                      setShowConfigModal(false)
                      if (erros > 0) alert(`⚠️ ${erros} dias com erro ao salvar`)
                    } finally {
                      setSalvandoConfig(false)
                    }
                  }}
                  disabled={!tipoCiclo || !dataInicio || salvandoConfig}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvandoConfig ? `Salvando ${previewDays.length} dias…` : '✅ Aplicar ao mês'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Página Principal — envolve EscalaPageInner em Suspense para permitir useSearchParams
export default function EscalaPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <EscalaPageInner />
    </Suspense>
  )
}

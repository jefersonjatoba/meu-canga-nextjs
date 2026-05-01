// ─── Types ────────────────────────────────────────────────────────────────────

export type TipoEscala =
  | '24x72'
  | '24x48'
  | '12x24-12x72'
  | '12x24-12x48'
  | '12x36-folgao'

export type TipoTurno = 'plantao' | 'sobreaviso' | 'extra' | 'ferias' | 'folga'

export interface EscalaEntry {
  id: string
  userId: string
  data: string // ISO date string (YYYY-MM-DD)
  horaInicio: string
  horaFim: string
  tipo: TipoTurno
  local?: string | null
  observacao?: string | null
  alarmeAtivo: boolean
  alarmeEnviado: boolean
  createdAt: string
  updatedAt: string
}

export interface EscalaConfig {
  id: string
  userId: string
  tipo: TipoEscala
  horaInicio: string
  horaFim: string
  inicioCiclo: string // ISO date string
  local?: string | null
  alarmeAtivo: boolean
  updatedAt: string
}

// ─── Work Location Constants ───────────────────────────────────────────────────

// EXATAMENTE igual ao v1 (modules/ras/ras.config.js) — não há 13º BPM
export const LOCAIS_BPM = [
  '1º BPM - São Gonçalo',
  '2º BPM - Botafogo',
  '3º BPM - Méier',
  '4º BPM - São Cristóvão',
  '5º BPM - Gamboa (Centro)',
  '6º BPM - Tijuca',
  '7º BPM - São Gonçalo',
  '8º BPM - Campos',
  '9º BPM - Rocha Miranda',
  '10º BPM - Barra do Piraí',
  '11º BPM - Nova Friburgo',
  '12º BPM - Niterói',
  '14º BPM - Bangu',
  '15º BPM - Duque de Caxias',
  '16º BPM - Olaria',
  '17º BPM - Ilha do Governador',
  '18º BPM - Jacarepaguá',
  '19º BPM - Copacabana',
  '20º BPM - Mesquita',
  '21º BPM - São João de Meriti',
  '22º BPM - Bonsucesso',
  '23º BPM - Leblon',
  '24º BPM - Queimados',
  '25º BPM - Cabo Frio',
  '26º BPM - Petrópolis',
  '27º BPM - Santa Cruz',
  '28º BPM - Volta Redonda',
  '29º BPM - Itaperuna',
  '30º BPM - Teresópolis',
  '31º BPM - Recreio',
  '32º BPM - Macaé',
  '33º BPM - Angra',
  '34º BPM - Magé',
  '35º BPM - Itaboraí',
  '36º BPM - Pádua',
  '37º BPM - Resende',
  '38º BPM - Três Rios',
  '39º BPM - Belford Roxo',
  '40º BPM - Campo Grande',
  '41º BPM - Irajá',
  '42º BPM - Araruama',
  '43º BPM - Pavuna',
  '44º BPM - Nova Iguaçu',
  '45º BPM - Jacarezinho',
  '46º BPM - Campos Guarus',
  '47º BPM - Barra da Tijuca',
]

export const LOCAIS_ESPECIAL = [
  'BOPE', 'BPChq', 'RECOM', 'BPVE', 'BAC',
  'GAM', 'BPRv', 'GPFer', 'CPAM', 'BPtur', 'BEPE',
]

export const LOCAIS_UPP = [
  '01 UPP 2ºBPM - SANTA MARTA',
  '01 UPP 22ºBPM - ADEUS BAIANA',
  '02 UPP 5ºBPM - PROVIDÊNCIA',
  '03 UPP 19ºBPM - PAVÃO',
  '03 UPP 19ºBPM - TABAJARAS',
  '04 UPP 19ºBPM - BABILONIA',
  '05 UPP 23ºBPM - ROCINHA',
  '06 UPP 3ºBPM - SÃO JOÃO',
  '07 UPP 3ºBPM - JACAREZINHO',
  '08 UPP 3ºBPM - LINS',
  '09 UPP 4ºBPM - TURANO',
  '10 UPP 6ºBPM - BOREL',
  '11 UPP 6ºBPM - MACACOS',
  '12 UPP 16ºBPM - COMPLEXO DO ALEMÃO',
  '13 UPP 16ºBPM - COMPLEXO DA PENHA',
  '15 UPP 22ºBPM - MANGUINHOS',
  '16 UPP 4ºBPM - MANGUEIRA',
]

export const LOCAIS_CPP = [
  'CPP - Coordenadoria de Polícia de Proximidade',
]

// Flat list for select options
export const TODOS_LOCAIS = [
  ...LOCAIS_BPM,
  ...LOCAIS_ESPECIAL,
  ...LOCAIS_UPP,
  ...LOCAIS_CPP,
]

// ─── Shift type metadata ───────────────────────────────────────────────────────

export const TIPO_TURNO_META: Record<
  TipoTurno,
  { label: string; emoji: string; color: string; badgeVariant: string }
> = {
  plantao:    { label: 'Plantão',    emoji: '🚔', color: 'blue',   badgeVariant: 'primary' },
  sobreaviso: { label: 'Sobreaviso', emoji: '📱', color: 'amber',  badgeVariant: 'warning' },
  extra:      { label: 'Extra',      emoji: '➕', color: 'purple', badgeVariant: 'default' },
  ferias:     { label: 'Férias',     emoji: '🏖', color: 'green',  badgeVariant: 'success' },
  folga:      { label: 'Folga',      emoji: '💤', color: 'gray',   badgeVariant: 'default' },
}

export const TIPO_ESCALA_META: Record<TipoEscala, { label: string; defaultHoraInicio: string; defaultHoraFim: string }> = {
  '24x72':        { label: '24x72 (1 dia trabalha, 3 folga)',           defaultHoraInicio: '07:00', defaultHoraFim: '07:00' },
  '24x48':        { label: '24x48 (1 dia trabalha, 2 folga)',           defaultHoraInicio: '07:00', defaultHoraFim: '07:00' },
  '12x24-12x72':  { label: '12x24 + 12x72 (2 dias trabalha, 3 folga)', defaultHoraInicio: '07:00', defaultHoraFim: '19:00' },
  '12x24-12x48':  { label: '12x24 + 12x48 (2 dias trabalha, 2 folga)', defaultHoraInicio: '07:00', defaultHoraFim: '19:00' },
  '12x36-folgao': { label: '12x36 Folgão (semanas alternadas)',         defaultHoraInicio: '07:00', defaultHoraFim: '19:00' },
}

// ─── Business Logic: Shift Pattern Calculation ────────────────────────────────

/**
 * Returns the days (as day-of-month numbers) in a given month/year
 * where the officer should work based on their schedule pattern.
 */
export function calcularDias(
  tipo: TipoEscala,
  inicioCiclo: Date,
  ano: number,
  mes: number // 1-indexed
): number[] {
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const workDays: number[] = []

  // Normalize inicioCiclo to midnight local time
  const cicloBase = new Date(
    inicioCiclo.getFullYear(),
    inicioCiclo.getMonth(),
    inicioCiclo.getDate()
  )

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const current = new Date(ano, mes - 1, dia)
    const diffMs = current.getTime() - cicloBase.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    // Negative diff means before the cycle started — skip
    if (diffDays < 0) continue

    let works = false

    switch (tipo) {
      case '24x72':
        // 4-day cycle: works day 0
        works = diffDays % 4 === 0
        break

      case '24x48':
        // 3-day cycle: works day 0
        works = diffDays % 3 === 0
        break

      case '12x24-12x72':
        // 5-day cycle: works days 0 and 1
        works = diffDays % 5 === 0 || diffDays % 5 === 1
        break

      case '12x24-12x48':
        // 4-day cycle: works days 0 and 1
        works = diffDays % 4 === 0 || diffDays % 4 === 1
        break

      case '12x36-folgao': {
        // Alternating weeks: week A = Mon/Wed/Fri, week B = Tue/Thu/Sat
        // Week parity based on ISO week number difference from ciclo start
        const weekOfCiclo = getISOWeek(cicloBase)
        const weekOfCurrent = getISOWeek(current)
        const weekYearOfCiclo = getISOWeekYear(cicloBase)
        const weekYearOfCurrent = getISOWeekYear(current)

        // Total weeks since cycle start
        const totalWeeks =
          (weekYearOfCurrent - weekYearOfCiclo) * 53 +
          weekOfCurrent -
          weekOfCiclo

        const isWeekA = totalWeeks % 2 === 0
        const dow = current.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

        if (isWeekA) {
          works = dow === 1 || dow === 3 || dow === 5 // Mon, Wed, Fri
        } else {
          works = dow === 2 || dow === 4 || dow === 6 // Tue, Thu, Sat
        }
        break
      }
    }

    if (works) workDays.push(dia)
  }

  return workDays
}

// ISO week helpers
function getISOWeek(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  )
}

function getISOWeekYear(date: Date): number {
  const d = new Date(date)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  return d.getFullYear()
}

// ─── Business Logic: Progress Calculation ─────────────────────────────────────

export interface ProgressoResult {
  pct: number
  status: 'futuro' | 'em_progresso' | 'concluido'
}

/**
 * Calculates the progress of a shift in São Paulo timezone.
 * data: "YYYY-MM-DD"
 */
export function calcularProgresso(
  data: string,
  horaInicio: string,
  horaFim: string
): ProgressoResult {
  // Get current time in São Paulo timezone
  const nowUTC = new Date()
  const nowSP = new Date(
    nowUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )

  const [ano, mes, dia] = data.split('-').map(Number)
  const [hIni, mIni] = horaInicio.split(':').map(Number)
  const [hFim, mFim] = horaFim.split(':').map(Number)

  const inicio = new Date(ano, mes - 1, dia, hIni, mIni, 0, 0)
  const fim = new Date(ano, mes - 1, dia, hFim, mFim, 0, 0)

  // If horaFim <= horaInicio, shift crosses midnight to next day
  if (hFim < hIni || (hFim === hIni && mFim <= mIni)) {
    fim.setDate(fim.getDate() + 1)
  }

  if (nowSP < inicio) return { pct: 0, status: 'futuro' }
  if (nowSP >= fim) return { pct: 100, status: 'concluido' }

  const totalMs = fim.getTime() - inicio.getTime()
  const elapsedMs = nowSP.getTime() - inicio.getTime()
  const pct = Math.round((elapsedMs / totalMs) * 100)

  return { pct, status: 'em_progresso' }
}

// ─── Business Logic: Days Until Next Shift ────────────────────────────────────

export interface ProximoResult {
  dias: number
  texto: string
  proxima?: EscalaEntry
}

export function diasAteProximo(escalas: EscalaEntry[]): ProximoResult {
  const nowUTC = new Date()
  const nowSP = new Date(
    nowUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )
  const todayStr = formatISO(nowSP)

  // Filter future or today shifts, sorted ascending
  const upcoming = escalas
    .filter((e) => e.data >= todayStr)
    .sort((a, b) => a.data.localeCompare(b.data))

  if (upcoming.length === 0) return { dias: -1, texto: 'Nenhum plantão agendado' }

  const proxima = upcoming[0]
  const [ano, mes, dia] = proxima.data.split('-').map(Number)
  const shiftDate = new Date(ano, mes - 1, dia)
  const today = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate())

  const diffMs = shiftDate.getTime() - today.getTime()
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24))

  let texto: string
  if (dias === 0) texto = 'hoje'
  else if (dias === 1) texto = 'amanhã'
  else texto = `em ${dias} dias`

  return { dias, texto, proxima }
}

// ─── Business Logic: Hours in Month ───────────────────────────────────────────

export function horasNoMes(escalas: EscalaEntry[]): number {
  let totalMinutes = 0

  for (const e of escalas) {
    const [hIni, mIni] = e.horaInicio.split(':').map(Number)
    const [hFim, mFim] = e.horaFim.split(':').map(Number)

    let minutesDiff = hFim * 60 + mFim - (hIni * 60 + mIni)
    if (minutesDiff <= 0) minutesDiff += 24 * 60 // overnight shift

    totalMinutes += minutesDiff
  }

  return Math.round(totalMinutes / 60)
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  const date = new Date(ano, mes - 1, dia)
  const dow = DIAS_SEMANA[date.getDay()]
  const mesNome = MESES[mes - 1]
  return `${dow}, ${dia} de ${mesNome}`
}

export function formatarDataCurta(data: string): string {
  const [, mes, dia] = data.split('-').map(Number)
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
}

export function formatarMesAno(ano: number, mes: number): string {
  return `${MESES[mes - 1]} ${ano}`
}

export function getNomeDiaSemana(ano: number, mes: number, dia: number): string {
  const date = new Date(ano, mes - 1, dia)
  return DIAS_SEMANA[date.getDay()]
}

/** Returns "YYYY-MM-DD" for a given Date */
export function formatISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns today's date as "YYYY-MM-DD" in São Paulo timezone */
export function todaySP(): string {
  const nowUTC = new Date()
  const nowSP = new Date(
    nowUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )
  return formatISO(nowSP)
}

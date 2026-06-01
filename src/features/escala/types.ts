import type { TipoEscala, TipoTurno } from '@/lib/escala'

export interface EscalaFormData {
  data: string
  horaInicio: string
  horaFim: string
  tipo: TipoTurno
  local: string
  observacao: string
  alarmeAtivo: boolean
}

export interface EscalaConfigFormData {
  tipo: TipoEscala
  horaInicio: string
  horaFim: string
  inicioCiclo: string
  local: string
  alarmeAtivo: boolean
}

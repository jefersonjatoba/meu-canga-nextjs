// User Types
export type User = {
  id: string
  email: string
  cpf: string
  name: string
  phone?: string
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export type SessionUser = {
  id: string
  email: string
  name: string
  cpf: string
  role: 'user' | 'admin'
}

// Escala Types
export type Escala = {
  id: string
  userId: string
  dataEscala: Date
  tipoTurno: 'MATUTINO' | 'VESPERTINO' | 'NOTURNO'
  localServico?: string
  status: 'agendada' | 'realizada' | 'cancelada'
  createdAt: Date
  updatedAt: Date
}

// RAS Types
export type RAS = {
  id: string
  userId: string
  dataAgendada: Date
  dataRealizada?: Date
  status: 'agendada' | 'realizada' | 'pendente' | 'confirmada'
  valor: number
  observacoes?: string
  meses: string[]
  createdAt: Date
  updatedAt: Date
}

// Lancamento Types
export type Lancamento = {
  id: string
  userId: string
  contaId: string
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  categoria: string
  valor: number
  data: Date
  recorrenciaId?: string
  status: 'pendente' | 'confirmada'
  createdAt: Date
  updatedAt: Date
}

// Investimento Types
export type Investimento = {
  id: string
  userId: string
  nome: string
  tipo: 'ACAO' | 'FUNDO' | 'CRIPTO' | 'RENDA_FIXA'
  quantidade: number
  precoMedio: number
  precoAtual?: number
  valor: number
  dataCompra: Date
  observacoes?: string
  createdAt: Date
  updatedAt: Date
}

// Meta Types
export type Meta = {
  id: string
  userId: string
  descricao: string
  categoria: 'POUPANCA' | 'INVESTIMENTO' | 'LIMITE_DESPESA'
  valorAlvo: number
  valorAtual: number
  dataInicio: Date
  dataAlvo: Date
  status: 'em_progresso' | 'concluida' | 'cancelada'
  createdAt: Date
  updatedAt: Date
}

// Recorrencia Types
export type Recorrencia = {
  id: string
  userId: string
  contaId: string
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  categoria: string
  valor: number
  frequencia: 'MENSAL' | 'BIMENSAL' | 'TRIMESTRAL' | 'ANUAL'
  diaVencimento: number
  dataInicio: Date
  dataFim?: Date
  ativa: boolean
  createdAt: Date
  updatedAt: Date
}

// Conta Types
export type Conta = {
  id: string
  userId: string
  nome: string
  tipo: 'CONTA_CORRENTE' | 'POUPANCA' | 'CARTEIRA' | 'INVESTIMENTO'
  saldoAtual: number
  banco?: string
  agencia?: string
  numero?: string
  ativa: boolean
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  success: boolean
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

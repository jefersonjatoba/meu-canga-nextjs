// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PlanName = 'free' | 'pro'

export type RecursoKey =
  | 'investimentos'
  | 'agente_ia'
  | 'base_juridica'
  | 'visao_anual'
  | 'exportar_csv'
  | 'notificacoes_push'
  | 'cotacoes_tempo_real'

export type LimiteKey =
  | 'lancamentos_mes'
  | 'ras_mes'
  | 'metas'
  | 'recorrencias'
  | 'contas'
  | 'pdf_mes'

export interface Plan {
  nome: PlanName
  limites: Record<LimiteKey, number>
  recursos: Record<RecursoKey, boolean>
}

// ─── Configuração dos planos ──────────────────────────────────────────────────

export const PLANS: Record<PlanName, Plan> = {
  free: {
    nome: 'free',
    limites: {
      lancamentos_mes: 10,
      ras_mes:         4,
      metas:           1,
      recorrencias:    2,
      contas:          3,
      pdf_mes:         1,
    },
    recursos: {
      investimentos:       false,
      agente_ia:           false,
      base_juridica:       false,
      visao_anual:         false,
      exportar_csv:        false,
      notificacoes_push:   false,
      cotacoes_tempo_real: false,
    },
  },
  pro: {
    nome: 'pro',
    limites: {
      lancamentos_mes: Infinity,
      ras_mes:         Infinity,
      metas:           Infinity,
      recorrencias:    Infinity,
      contas:          Infinity,
      pdf_mes:         Infinity,
    },
    recursos: {
      investimentos:       true,
      agente_ia:           true,
      base_juridica:       true,
      visao_anual:         true,
      exportar_csv:        true,
      notificacoes_push:   true,
      cotacoes_tempo_real: true,
    },
  },
}

// ─── Preços (em centavos) ─────────────────────────────────────────────────────

export const PRECO_MENSAL_CENTS = 2190  // R$ 21,90
export const PRECO_ANUAL_CENTS  = 21900 // R$ 219,00 (2 meses grátis — equivale a R$18,25/mês)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna o plano ativo do usuário verificando expiração */
export function getActivePlan(
  user: { plan: string; planExpiresAt: Date | null } | null
): Plan {
  if (!user || user.plan !== 'pro') return PLANS.free
  if (!user.planExpiresAt) return PLANS.pro          // admin/vitalício
  if (new Date(user.planExpiresAt) > new Date()) return PLANS.pro
  return PLANS.free                                   // expirado → downgrade silencioso
}

export const isPro = (plan: Plan) => plan.nome === 'pro'

export const canUseRecurso = (plan: Plan, recurso: RecursoKey) =>
  plan.recursos[recurso]

export const getLimite = (plan: Plan, chave: LimiteKey) =>
  plan.limites[chave]

export const atingiuLimite = (plan: Plan, chave: LimiteKey, atual: number) =>
  atual >= getLimite(plan, chave)

// Mensagens de paywall por recurso
export const PAYWALL_MSGS: Record<string, { emoji: string; titulo: string; descricao: string }> = {
  limite_lancamentos:  { emoji: '💸', titulo: 'Limite de Lançamentos',  descricao: 'No plano Free você pode registrar até 10 lançamentos por mês.' },
  limite_ras:          { emoji: '🛡️', titulo: 'Limite de RAS',          descricao: 'No plano Free você pode agendar até 4 RAS por mês.' },
  limite_metas:        { emoji: '🎯', titulo: 'Limite de Metas',        descricao: 'No plano Free você pode ter 1 meta ativa.' },
  limite_recorrencias: { emoji: '🔄', titulo: 'Limite de Recorrências', descricao: 'No plano Free você pode ter até 2 recorrências ativas.' },
  limite_contas:       { emoji: '🏦', titulo: 'Limite de Contas',       descricao: 'No plano Free você pode ter até 3 contas.' },
  investimentos:       { emoji: '📈', titulo: 'Controle de Investimentos', descricao: 'Acompanhe seus aportes, resgates e rentabilidade.' },
  agente_ia:           { emoji: '🤖', titulo: 'Agente IA',              descricao: 'Análise financeira inteligente com IA especializada em finanças de policiais.' },
  base_juridica:       { emoji: '⚖️', titulo: 'Base Jurídica',          descricao: 'Acesso à legislação completa sobre RAS, direitos e benefícios.' },
  visao_anual:         { emoji: '📅', titulo: 'Visão Anual',            descricao: 'Resumo completo do ano com comparativos e projeções.' },
  exportar_csv:        { emoji: '📤', titulo: 'Exportação CSV',         descricao: 'Exporte seus dados para Excel, Google Sheets e outros.' },
}

// Recursos PRO com descrição para a página de upgrade
export const FEATURES_PRO = [
  { emoji: '💸', texto: 'Lançamentos ilimitados por mês' },
  { emoji: '🛡️', texto: 'RAS ilimitado por mês' },
  { emoji: '📄', texto: 'PDFs ilimitados' },
  { emoji: '🎯', texto: 'Metas ilimitadas' },
  { emoji: '🔄', texto: 'Recorrências ilimitadas' },
  { emoji: '🏦', texto: 'Contas bancárias ilimitadas' },
  { emoji: '📈', texto: 'Controle de Investimentos' },
  { emoji: '🤖', texto: 'Agente IA financeiro' },
  { emoji: '⚖️', texto: 'Base Jurídica completa' },
  { emoji: '📅', texto: 'Visão Anual' },
  { emoji: '📤', texto: 'Exportação CSV' },
  { emoji: '🔔', texto: 'Notificações Push' },
  { emoji: '📡', texto: 'Cotações em tempo real' },
  { emoji: '📧', texto: 'Suporte prioritário' },
]

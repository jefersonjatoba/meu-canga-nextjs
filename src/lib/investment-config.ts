export type InvestmentCategory =
  | 'renda_fixa'
  | 'renda_variavel'
  | 'fundos'
  | 'previdencia'
  | 'cripto'
  | 'internacional'

export interface InvestmentType {
  key: string
  label: string
  abbr: string        // abbreviation shown in selector button
  category: InvestmentCategory
  risk: 'baixo' | 'medio' | 'alto'
  description: string
}

export interface CategoryConfig {
  label: string
  color: string       // primary accent color
  bgClass: string     // tailwind bg class (light)
  darkBgClass: string // tailwind bg class (dark)
  textClass: string
  darkTextClass: string
}

// ─── Category config ─────────────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<InvestmentCategory, CategoryConfig> = {
  renda_fixa: {
    label:        'Renda Fixa',
    color:        '#3b82f6',
    bgClass:      'bg-blue-50',
    darkBgClass:  'dark:bg-blue-500/10',
    textClass:    'text-blue-700',
    darkTextClass:'dark:text-blue-400',
  },
  renda_variavel: {
    label:        'Renda Variável',
    color:        '#f97316',
    bgClass:      'bg-orange-50',
    darkBgClass:  'dark:bg-orange-500/10',
    textClass:    'text-orange-700',
    darkTextClass:'dark:text-orange-400',
  },
  fundos: {
    label:        'Fundos',
    color:        '#8b5cf6',
    bgClass:      'bg-violet-50',
    darkBgClass:  'dark:bg-violet-500/10',
    textClass:    'text-violet-700',
    darkTextClass:'dark:text-violet-400',
  },
  previdencia: {
    label:        'Previdência',
    color:        '#10b981',
    bgClass:      'bg-emerald-50',
    darkBgClass:  'dark:bg-emerald-500/10',
    textClass:    'text-emerald-700',
    darkTextClass:'dark:text-emerald-400',
  },
  cripto: {
    label:        'Cripto',
    color:        '#f59e0b',
    bgClass:      'bg-amber-50',
    darkBgClass:  'dark:bg-amber-500/10',
    textClass:    'text-amber-700',
    darkTextClass:'dark:text-amber-400',
  },
  internacional: {
    label:        'Internacional',
    color:        '#06b6d4',
    bgClass:      'bg-cyan-50',
    darkBgClass:  'dark:bg-cyan-500/10',
    textClass:    'text-cyan-700',
    darkTextClass:'dark:text-cyan-400',
  },
}

// ─── Investment types ─────────────────────────────────────────────────────────

export const INVESTMENT_TYPES: InvestmentType[] = [
  // Renda Fixa
  { key: 'cdb',               label: 'CDB',                   abbr: 'CDB',   category: 'renda_fixa',    risk: 'baixo', description: 'Certificado de Depósito Bancário' },
  { key: 'lci',               label: 'LCI',                   abbr: 'LCI',   category: 'renda_fixa',    risk: 'baixo', description: 'Letra de Crédito Imobiliário' },
  { key: 'lca',               label: 'LCA',                   abbr: 'LCA',   category: 'renda_fixa',    risk: 'baixo', description: 'Letra de Crédito do Agronegócio' },
  { key: 'tesouro_selic',     label: 'Tesouro Selic',         abbr: 'SELIC', category: 'renda_fixa',    risk: 'baixo', description: 'Tesouro Direto — pós-fixado Selic' },
  { key: 'tesouro_ipca',      label: 'Tesouro IPCA+',         abbr: 'IPCA+', category: 'renda_fixa',    risk: 'baixo', description: 'Tesouro Direto — IPCA + juros' },
  { key: 'tesouro_pre',       label: 'Tesouro Prefixado',     abbr: 'PRÉ',   category: 'renda_fixa',    risk: 'baixo', description: 'Tesouro Direto — taxa fixa' },
  { key: 'cri',               label: 'CRI',                   abbr: 'CRI',   category: 'renda_fixa',    risk: 'medio', description: 'Certificado de Recebíveis Imobiliários' },
  { key: 'cra',               label: 'CRA',                   abbr: 'CRA',   category: 'renda_fixa',    risk: 'medio', description: 'Certificado de Recebíveis do Agronegócio' },
  { key: 'debenture',         label: 'Debênture',             abbr: 'DEB',   category: 'renda_fixa',    risk: 'medio', description: 'Título de dívida corporativa' },
  { key: 'lc',                label: 'LC',                    abbr: 'LC',    category: 'renda_fixa',    risk: 'baixo', description: 'Letra de Câmbio' },
  { key: 'rdb',               label: 'RDB',                   abbr: 'RDB',   category: 'renda_fixa',    risk: 'baixo', description: 'Recibo de Depósito Bancário' },
  { key: 'poupanca',          label: 'Poupança',              abbr: 'POU',   category: 'renda_fixa',    risk: 'baixo', description: 'Caderneta de poupança' },

  // Renda Variável
  { key: 'acoes',             label: 'Ações',                 abbr: 'AÇÕES', category: 'renda_variavel', risk: 'alto', description: 'Ações na B3/Bovespa' },
  { key: 'fiis',              label: 'FIIs',                  abbr: 'FII',   category: 'renda_variavel', risk: 'alto', description: 'Fundos de Investimento Imobiliário' },
  { key: 'etf',               label: 'ETF',                   abbr: 'ETF',   category: 'renda_variavel', risk: 'alto', description: 'Exchange Traded Fund (B3)' },
  { key: 'bdr',               label: 'BDR',                   abbr: 'BDR',   category: 'renda_variavel', risk: 'alto', description: 'Brazilian Depositary Receipts' },
  { key: 'opcoes',            label: 'Opções',                abbr: 'OPÇ',   category: 'renda_variavel', risk: 'alto', description: 'Derivativos de opções' },

  // Fundos
  { key: 'fundo_mm',          label: 'Fundo Multimercado',    abbr: 'MM',    category: 'fundos',         risk: 'medio', description: 'Estratégias diversificadas' },
  { key: 'fundo_acoes',       label: 'Fundo de Ações',        abbr: 'F.AÇ', category: 'fundos',         risk: 'alto',  description: 'Fundo com carteira de ações' },
  { key: 'fundo_rf',          label: 'Fundo Renda Fixa',      abbr: 'F.RF', category: 'fundos',         risk: 'baixo', description: 'Fundo concentrado em RF' },
  { key: 'fundo_cambial',     label: 'Fundo Cambial',         abbr: 'CAM',   category: 'fundos',         risk: 'medio', description: 'Atrelado a moedas estrangeiras' },
  { key: 'fip',               label: 'FIP',                   abbr: 'FIP',   category: 'fundos',         risk: 'alto',  description: 'Fundo de Investimento em Participações' },

  // Previdência
  { key: 'pgbl',              label: 'PGBL',                  abbr: 'PGBL',  category: 'previdencia',    risk: 'medio', description: 'Plano Gerador de Benefício Livre' },
  { key: 'vgbl',              label: 'VGBL',                  abbr: 'VGBL',  category: 'previdencia',    risk: 'medio', description: 'Vida Gerador de Benefício Livre' },

  // Cripto
  { key: 'bitcoin',           label: 'Bitcoin',               abbr: 'BTC',   category: 'cripto',         risk: 'alto',  description: 'Bitcoin (BTC)' },
  { key: 'ethereum',          label: 'Ethereum',              abbr: 'ETH',   category: 'cripto',         risk: 'alto',  description: 'Ethereum (ETH)' },
  { key: 'stablecoin',        label: 'Stablecoin',            abbr: 'USDT',  category: 'cripto',         risk: 'medio', description: 'USDT, USDC e similares' },
  { key: 'cripto_outros',     label: 'Criptos',               abbr: 'CRYP',  category: 'cripto',         risk: 'alto',  description: 'Outras criptomoedas' },

  // Internacional
  { key: 'stocks',            label: 'Stocks',                abbr: 'STK',   category: 'internacional',  risk: 'alto',  description: 'Ações internacionais (NYSE/Nasdaq)' },
  { key: 'reits',             label: 'REITs',                 abbr: 'REIT',  category: 'internacional',  risk: 'medio', description: 'Real Estate Investment Trusts' },
  { key: 'etf_intl',          label: 'ETF Internacional',     abbr: 'iETF',  category: 'internacional',  risk: 'alto',  description: 'ETFs de mercados globais' },
  { key: 'treasuries',        label: 'Treasuries',            abbr: 'UST',   category: 'internacional',  risk: 'baixo', description: 'Títulos do Tesouro Americano' },
]

export const INVESTMENT_TYPE_MAP = new Map(INVESTMENT_TYPES.map(t => [t.key, t]))

export function getInvestmentByLabel(label: string): InvestmentType | undefined {
  return INVESTMENT_TYPES.find(t => t.label.toLowerCase() === label.toLowerCase())
}

export function getInvestmentByKey(key: string): InvestmentType | undefined {
  return INVESTMENT_TYPE_MAP.get(key)
}

export function getCategoryConfig(category: InvestmentCategory): CategoryConfig {
  return CATEGORY_CONFIG[category]
}

export function getRiskLabel(risk: 'baixo' | 'medio' | 'alto') {
  return { baixo: 'Baixo risco', medio: 'Risco médio', alto: 'Alto risco' }[risk]
}

export function getRiskColor(risk: 'baixo' | 'medio' | 'alto') {
  return { baixo: '#22c55e', medio: '#f59e0b', alto: '#ef4444' }[risk]
}

// Group types by category for the selector UI
export const INVESTMENT_TYPES_BY_CATEGORY = Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
  category: key as InvestmentCategory,
  ...cfg,
  types: INVESTMENT_TYPES.filter(t => t.category === key as InvestmentCategory),
}))

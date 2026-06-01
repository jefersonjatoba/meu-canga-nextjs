export interface BankConfig {
  label: string
  color: string
  textColor?: string
  logo?: string   // path relative to /public
}

export const BANK_CONFIG: Record<string, BankConfig> = {
  nubank:        { label: 'Nubank',          color: '#8A05BE', textColor: '#fff', logo: '/bank-logos/nubank.svg' },
  inter:         { label: 'Inter',           color: '#FF7A00', textColor: '#fff', logo: '/bank-logos/inter.svg' },
  itau:          { label: 'Itaú',            color: '#EC7000', textColor: '#fff', logo: '/bank-logos/itau.svg' },
  bradesco:      { label: 'Bradesco',        color: '#CC092F', textColor: '#fff', logo: '/bank-logos/bradesco.svg' },
  caixa:         { label: 'Caixa',           color: '#00529B', textColor: '#fff', logo: '/bank-logos/caixa-economica.svg' },
  bb:            { label: 'Banco do Brasil', color: '#FCBE00', textColor: '#003087', logo: '/bank-logos/banco-do-brasil.svg' },
  bancodobrasil: { label: 'Banco do Brasil', color: '#FCBE00', textColor: '#003087', logo: '/bank-logos/banco-do-brasil.svg' },
  santander:     { label: 'Santander',       color: '#EC0000', textColor: '#fff', logo: '/bank-logos/santander.svg' },
  picpay:        { label: 'PicPay',          color: '#11C76F', textColor: '#fff', logo: '/bank-logos/picpay.svg' },
  c6bank:        { label: 'C6 Bank',         color: '#242424', textColor: '#fff', logo: '/bank-logos/c6-bank.svg' },
  c6:            { label: 'C6 Bank',         color: '#242424', textColor: '#fff', logo: '/bank-logos/c6-bank.svg' },
  neon:          { label: 'Neon',            color: '#1DB954', textColor: '#fff', logo: '/bank-logos/neon.svg' },
  next:          { label: 'Next',            color: '#00E676', textColor: '#111', logo: '/bank-logos/next.svg' },
  sicoob:        { label: 'Sicoob',          color: '#00703C', textColor: '#fff', logo: '/bank-logos/sicoob.svg' },
  sicredi:       { label: 'Sicredi',         color: '#00723B', textColor: '#fff', logo: '/bank-logos/sicredi.svg' },
  xp:            { label: 'XP',             color: '#111111', textColor: '#fff', logo: '/bank-logos/xp-banking.svg' },
  xpinvestimentos:{ label: 'XP',            color: '#111111', textColor: '#fff', logo: '/bank-logos/xp-banking.svg' },
  btg:           { label: 'BTG Pactual',    color: '#032B5A', textColor: '#fff', logo: '/bank-logos/btgpactual.svg' },
  btgpactual:    { label: 'BTG Pactual',    color: '#032B5A', textColor: '#fff', logo: '/bank-logos/btgpactual.svg' },
  sofisa:        { label: 'Sofisa',         color: '#FF6900', textColor: '#fff', logo: '/bank-logos/banco-sofisa.svg' },
  pagbank:       { label: 'PagBank',        color: '#06B96C', textColor: '#fff', logo: '/bank-logos/pagbank.svg' },
  pan:           { label: 'Banco Pan',      color: '#0070BF', textColor: '#fff', logo: '/bank-logos/banco-pan.svg' },
  bancopan:      { label: 'Banco Pan',      color: '#0070BF', textColor: '#fff', logo: '/bank-logos/banco-pan.svg' },
  bmg:           { label: 'BMG',            color: '#06357A', textColor: '#fff', logo: '/bank-logos/banco-bmg.svg' },
  bancobbmg:     { label: 'BMG',            color: '#06357A', textColor: '#fff', logo: '/bank-logos/banco-bmg.svg' },
  porto:         { label: 'Porto',          color: '#00349A', textColor: '#fff', logo: '/bank-logos/porto-bank.svg' },
  portobank:     { label: 'Porto',          color: '#00349A', textColor: '#fff', logo: '/bank-logos/porto-bank.svg' },
  safra:         { label: 'Safra',          color: '#1F3F7A', textColor: '#fff', logo: '/bank-logos/safra.svg' },
  mercadopago:   { label: 'Mercado Pago',   color: '#00B1EA', textColor: '#fff', logo: '/bank-logos/mercado-pago.svg' },
  brb:           { label: 'BRB',            color: '#003189', textColor: '#fff', logo: '/bank-logos/banco-brb.svg' },
  bancobrb:      { label: 'BRB',            color: '#003189', textColor: '#fff', logo: '/bank-logos/banco-brb.svg' },
  digio:         { label: 'Digio',          color: '#1A237E', textColor: '#fff', logo: '/bank-logos/banco-digio.svg' },
  bancodigio:    { label: 'Digio',          color: '#1A237E', textColor: '#fff', logo: '/bank-logos/banco-digio.svg' },
  master:        { label: 'Banco Master',   color: '#0D47A1', textColor: '#fff', logo: '/bank-logos/banco-master.svg' },
  bancomaster:   { label: 'Banco Master',   color: '#0D47A1', textColor: '#fff', logo: '/bank-logos/banco-master.svg' },
  mercantil:     { label: 'Mercantil',      color: '#003F7D', textColor: '#fff', logo: '/bank-logos/banco-mercantil.svg' },
  bancomnercantil:{ label: 'Mercantil',     color: '#003F7D', textColor: '#fff', logo: '/bank-logos/banco-mercantil.svg' },
  banrisul:      { label: 'Banrisul',       color: '#003399', textColor: '#fff', logo: '/bank-logos/banrisul.svg' },
  bv:            { label: 'BV',             color: '#FF5000', textColor: '#fff', logo: '/bank-logos/bv-app.svg' },
  bvapp:         { label: 'BV',             color: '#FF5000', textColor: '#fff', logo: '/bank-logos/bv-app.svg' },
  infinitepay:   { label: 'InfinitePay',    color: '#00C389', textColor: '#fff', logo: '/bank-logos/infinitepay.svg' },
  recargapay:    { label: 'RecargaPay',     color: '#FF5800', textColor: '#fff', logo: '/bank-logos/recargapay.svg' },
  crefisa:       { label: 'Crefisa',        color: '#FFD700', textColor: '#111', logo: '/bank-logos/crefisa.svg' },
  '99pay':       { label: '99Pay',          color: '#FFD000', textColor: '#111', logo: '/bank-logos/99pay.svg' },
  outro:         { label: 'Outro',          color: '#6B7280', textColor: '#fff' },
}

// Options ordered for the UI selector (most popular first, without aliases)
export const BANK_OPTIONS = [
  'nubank', 'inter', 'itau', 'bradesco', 'caixa', 'bb', 'santander', 'picpay',
  'c6bank', 'neon', 'next', 'sicoob', 'sicredi', 'xp', 'btg', 'sofisa',
  'pagbank', 'pan', 'bmg', 'porto', 'safra', 'mercadopago', 'brb', 'digio',
  'master', 'mercantil', 'banrisul', 'bv', 'infinitepay', 'recargapay',
  'crefisa', '99pay',
].map(key => ({ key, ...BANK_CONFIG[key] }))

export function getBankConfig(banco?: string | null): BankConfig {
  if (!banco) return BANK_CONFIG.outro
  const normalized = banco.toLowerCase().replace(/[^a-z0-9]/g, '')
  return BANK_CONFIG[normalized] ?? BANK_CONFIG.outro
}

export function getBankInitials(banco?: string | null): string {
  if (!banco) return '?'
  const words = banco.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// Gradient presets for credit cards
export const CARD_GRADIENTS = [
  { label: 'Roxo',     from: '#7c3aed', to: '#4f46e5' },
  { label: 'Preto',    from: '#1a1a2e', to: '#16213e' },
  { label: 'Azul',     from: '#0ea5e9', to: '#0369a1' },
  { label: 'Verde',    from: '#10b981', to: '#065f46' },
  { label: 'Rosa',     from: '#ec4899', to: '#9d174d' },
  { label: 'Laranja',  from: '#f97316', to: '#c2410c' },
  { label: 'Dourado',  from: '#f59e0b', to: '#92400e' },
  { label: 'Grafite',  from: '#374151', to: '#111827' },
  { label: 'Cyan',     from: '#06b6d4', to: '#0e7490' },
  { label: 'Vermelho', from: '#ef4444', to: '#991b1b' },
]

export function parseCardGradient(cor?: string | null): { from: string; to: string } {
  if (!cor) return CARD_GRADIENTS[0]
  if (cor.includes(',')) {
    const [from, to] = cor.split(',')
    return { from, to }
  }
  return { from: cor, to: cor }
}

export function cardGradientStyle(cor?: string | null): string {
  const { from, to } = parseCardGradient(cor)
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}

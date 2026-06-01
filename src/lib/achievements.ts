export interface Achievement {
  id: string
  emoji: string
  titulo: string
  descricao: string
  conquistado: boolean
}

export interface AchievementInput {
  lancamentos: number
  rasAgendas: number
  metas: number
  contas: number
  recorrencias: number
  streakDays: number
  longestStreak: number
  diasDesdeCadastro: number
  isPro: boolean
  referrals: number
}

export function calcularConquistas(data: AchievementInput): Achievement[] {
  const {
    lancamentos, rasAgendas, metas, contas, recorrencias,
    longestStreak, diasDesdeCadastro, isPro, referrals,
  } = data

  return [
    {
      id: 'primeiro_passo',
      emoji: '👣',
      titulo: 'Primeiros Passos',
      descricao: 'Criou sua conta no MeuCanga',
      conquistado: true,
    },
    {
      id: 'primeira_conta',
      emoji: '🏦',
      titulo: 'Conta Registrada',
      descricao: 'Adicionou sua primeira conta bancária',
      conquistado: contas >= 1,
    },
    {
      id: 'primeiro_ras',
      emoji: '🛡️',
      titulo: 'Guardião de RAS',
      descricao: 'Registrou seu primeiro RAS',
      conquistado: rasAgendas >= 1,
    },
    {
      id: 'primeiro_lancamento',
      emoji: '💸',
      titulo: 'Controlador',
      descricao: 'Lançou sua primeira movimentação financeira',
      conquistado: lancamentos >= 1,
    },
    {
      id: 'primeira_meta',
      emoji: '🎯',
      titulo: 'Sonhador com Plano',
      descricao: 'Criou sua primeira meta financeira',
      conquistado: metas >= 1,
    },
    {
      id: 'recorrencia',
      emoji: '🔄',
      titulo: 'Automático',
      descricao: 'Configurou uma recorrência mensal',
      conquistado: recorrencias >= 1,
    },
    {
      id: 'streak_7',
      emoji: '🔥',
      titulo: 'Uma Semana Constante',
      descricao: '7 dias consecutivos acessando o app',
      conquistado: longestStreak >= 7,
    },
    {
      id: 'streak_30',
      emoji: '🌟',
      titulo: 'Um Mês Dedicado',
      descricao: '30 dias consecutivos no MeuCanga',
      conquistado: longestStreak >= 30,
    },
    {
      id: 'ras_10',
      emoji: '🏆',
      titulo: 'Mestre do RAS',
      descricao: 'Registrou 10 ou mais RAS',
      conquistado: rasAgendas >= 10,
    },
    {
      id: 'lancamentos_50',
      emoji: '📊',
      titulo: 'Analista Financeiro',
      descricao: '50 lançamentos registrados',
      conquistado: lancamentos >= 50,
    },
    {
      id: 'lancamentos_100',
      emoji: '💎',
      titulo: 'Gestor Elite',
      descricao: '100 lançamentos — controle total das finanças',
      conquistado: lancamentos >= 100,
    },
    {
      id: 'veterano',
      emoji: '🎖️',
      titulo: 'Veterano',
      descricao: '90 dias usando o MeuCanga',
      conquistado: diasDesdeCadastro >= 90,
    },
    {
      id: 'pro',
      emoji: '⚡',
      titulo: 'PRO',
      descricao: 'Assinou o plano PRO — acesso ilimitado',
      conquistado: isPro,
    },
    {
      id: 'indicou_1',
      emoji: '🤝',
      titulo: 'Companheiro de Farda',
      descricao: 'Indicou um colega para o MeuCanga',
      conquistado: referrals >= 1,
    },
    {
      id: 'indicou_5',
      emoji: '🦁',
      titulo: 'Embaixador',
      descricao: 'Indicou 5 colegas — você é nosso melhor embaixador!',
      conquistado: referrals >= 5,
    },
  ]
}

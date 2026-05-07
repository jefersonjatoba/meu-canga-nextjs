import { prisma } from '@/lib/prisma'

export interface BalanceValidationResult {
  contaId: string
  nome: string
  // Saldos em centavos (Int) — conforme regra do schema Prisma
  saldoCentavos: number
  saldoCalculadoCentavos: number
  diferencaCentavos: number
  isConsistent: boolean
  lancamentos: Array<{
    id: string
    descricao: string
    tipo: string
    valorCentavos: number
    data: Date
  }>
}

/**
 * Valida consistência entre saldo da conta e somatório de lançamentos.
 * Todos os valores são tratados em centavos (Int) conforme schema Prisma.
 */
export async function validateAccountBalance(
  contaId: string,
  userId: string
): Promise<BalanceValidationResult> {
  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    include: {
      lancamentos: {
        where: { userId },
        orderBy: { data: 'asc' },
      },
    },
  })

  if (!conta || conta.userId !== userId) {
    throw new Error('Conta não encontrada ou não autorizada')
  }

  // Calcula saldo a partir dos lançamentos (income adiciona, expense subtrai)
  // tipo no schema: 'income' | 'expense' | 'ras' | 'investment_aporte' | etc.
  let saldoCalculadoCentavos = 0
  const lancamentosOrdenados = conta.lancamentos.map((l) => {
    const isEntrada = l.tipo === 'income' || l.tipo === 'ras'
    const delta = isEntrada ? l.valorCentavos : -l.valorCentavos
    saldoCalculadoCentavos += delta
    return l
  })

  // Diferença em centavos — Int não tem imprecisão de ponto flutuante
  const diferencaCentavos = Math.abs(conta.saldoCentavos - saldoCalculadoCentavos)
  const isConsistent = diferencaCentavos === 0

  return {
    contaId: conta.id,
    nome: conta.nome,
    saldoCentavos: conta.saldoCentavos,
    saldoCalculadoCentavos,
    diferencaCentavos,
    isConsistent,
    lancamentos: lancamentosOrdenados.map((l) => ({
      id: l.id,
      descricao: l.descricao,
      tipo: l.tipo,
      valorCentavos: l.valorCentavos,
      data: l.data,
    })),
  }
}

/**
 * Valida todas as contas de um usuário
 */
export async function validateAllBalances(
  userId: string
): Promise<BalanceValidationResult[]> {
  const contas = await prisma.conta.findMany({
    where: { userId },
  })

  const results = await Promise.all(
    contas.map((conta) => validateAccountBalance(conta.id, userId))
  )

  return results
}

/**
 * Retorna apenas contas com inconsistência de saldo
 */
export async function getBalanceDiscrepancies(
  userId: string
): Promise<BalanceValidationResult[]> {
  const results = await validateAllBalances(userId)
  return results.filter((r) => !r.isConsistent)
}

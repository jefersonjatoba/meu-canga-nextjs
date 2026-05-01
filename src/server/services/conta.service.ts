import { prisma } from '@/lib/prisma'

export interface BalanceValidationResult {
  contaId: string
  nome: string
  saldoAtual: number
  saldoCalculado: number
  diferenca: number
  isConsistent: boolean
  lancamentos: Array<{
    id: string
    descricao: string
    tipo: string
    valor: number
    data: Date
  }>
}

/**
 * Valida consistência entre saldo da conta e somatório de lançamentos
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

  // Calculate balance from lançamentos
  let saldoCalculado = 0
  const lancamentosOrdenados = conta.lancamentos.map((l) => {
    const delta = l.tipo === 'RECEITA' ? l.valor : -l.valor
    saldoCalculado += delta
    return l
  })

  const diferenca = Math.abs(conta.saldoAtual - saldoCalculado)
  const isConsistent = diferenca < 0.01 // tolerance for floating point

  return {
    contaId: conta.id,
    nome: conta.nome,
    saldoAtual: conta.saldoAtual,
    saldoCalculado,
    diferenca,
    isConsistent,
    lancamentos: lancamentosOrdenados,
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
 * Reporta discrepâncias de saldo
 */
export async function getBalanceDiscrepancies(
  userId: string
): Promise<BalanceValidationResult[]> {
  const results = await validateAllBalances(userId)
  return results.filter((r) => !r.isConsistent)
}

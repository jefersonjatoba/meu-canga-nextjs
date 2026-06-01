import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export type PrismaTx = Prisma.TransactionClient

const ativoInclude = {
  operacoes: {
    orderBy: { dataOperacao: 'desc' as const },
  },
} as const

export async function runInTransaction<T>(fn: (tx: PrismaTx) => Promise<T>) {
  return prisma.$transaction(fn)
}

export async function createAtivo(
  tx: PrismaTx,
  userId: string,
  data: {
    nome: string
    ticker: string
    tipo: string
    moeda: string
    corretora?: string | null
  },
) {
  return tx.investimentoAtivo.create({
    data: {
      userId,
      nome: data.nome,
      ticker: data.ticker,
      tipo: data.tipo,
      moeda: data.moeda,
      corretora: data.corretora ?? null,
      ativo: true,
    },
  })
}

export async function findAtivoById(userId: string, id: string) {
  return prisma.investimentoAtivo.findFirst({
    where: { id, userId },
    include: ativoInclude,
  })
}

export async function findAtivoByIdTx(tx: PrismaTx, userId: string, id: string) {
  return tx.investimentoAtivo.findFirst({
    where: { id, userId },
    include: ativoInclude,
  })
}

export async function listAtivos(userId: string) {
  return prisma.investimentoAtivo.findMany({
    where: { userId },
    orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
  })
}

export async function createOperacao(
  tx: PrismaTx,
  userId: string,
  data: {
    ativoId: string
    contaId?: string | null
    tipo: string
    quantidadeDecimal: string
    precoUnitarioCentavos: number
    valorTotalCentavos: number
    taxasCentavos?: number | null
    dataOperacao: Date
    lancamentoId?: string | null
  },
) {
  return tx.investimentoOperacao.create({
    data: {
      userId,
      ativoId: data.ativoId,
      contaId: data.contaId ?? null,
      tipo: data.tipo,
      quantidadeDecimal: data.quantidadeDecimal,
      precoUnitarioCentavos: data.precoUnitarioCentavos,
      valorTotalCentavos: data.valorTotalCentavos,
      taxasCentavos: data.taxasCentavos ?? 0,
      dataOperacao: data.dataOperacao,
      status: 'confirmada',
      lancamentoId: data.lancamentoId ?? null,
    },
  })
}

export async function createLancamentoForInvestimento(
  tx: PrismaTx,
  userId: string,
  data: {
    contaId: string
    tipoLancamento: 'investment_aporte' | 'investment_resgate'
    valorCentavos: number
    dataOperacao: Date
    ativoNome: string
  },
) {
  const competenciaAt = `${data.dataOperacao.getFullYear()}-${String(data.dataOperacao.getMonth() + 1).padStart(2, '0')}`
  const descricao = data.tipoLancamento === 'investment_aporte'
    ? `Aporte — ${data.ativoNome}`
    : `Resgate — ${data.ativoNome}`

  return tx.lancamento.create({
    data: {
      userId,
      contaId: data.contaId,
      descricao,
      tipo: data.tipoLancamento,
      categoria: 'Investimento',
      valorCentavos: data.valorCentavos,
      data: data.dataOperacao,
      competenciaAt,
      source: 'manual',
      status: 'confirmada',
    },
  })
}

export async function listOperacoesByAtivo(userId: string, ativoId: string) {
  return prisma.investimentoOperacao.findMany({
    where: { userId, ativoId },
    orderBy: [{ dataOperacao: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function listOperacoesByAtivoTx(tx: PrismaTx, userId: string, ativoId: string) {
  return tx.investimentoOperacao.findMany({
    where: { userId, ativoId },
    orderBy: [{ dataOperacao: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function cancelOperacao(
  tx: PrismaTx,
  userId: string,
  id: string,
) {
  return tx.investimentoOperacao.updateMany({
    where: { id, userId },
    data: { status: 'cancelada' },
  })
}

export async function findOperacaoByIdTx(tx: PrismaTx, userId: string, id: string) {
  return tx.investimentoOperacao.findFirst({
    where: { id, userId },
  })
}

export async function cancelLancamentoById(tx: PrismaTx, lancamentoId: string) {
  await tx.lancamento.updateMany({
    where: { id: lancamentoId },
    data: { status: 'cancelada' },
  })
}

export async function deleteAtivo(tx: PrismaTx, userId: string, id: string) {
  // Cancel all linked lancamentos before deleting operations
  const operacoes = await tx.investimentoOperacao.findMany({
    where: { ativoId: id, userId },
    select: { lancamentoId: true },
  })
  const lancamentoIds = operacoes
    .map(op => op.lancamentoId)
    .filter((lid): lid is string => lid !== null)

  if (lancamentoIds.length > 0) {
    await tx.lancamento.updateMany({
      where: { id: { in: lancamentoIds } },
      data: { status: 'cancelada' },
    })
  }

  await tx.investimentoOperacao.deleteMany({ where: { ativoId: id, userId } })
  await tx.investimentoAtivo.delete({ where: { id } })
}

export async function findContaForInvestment(
  tx: PrismaTx,
  userId: string,
  contaId: string,
) {
  return tx.conta.findFirst({
    where: { id: contaId, userId, ativa: true },
    select: { id: true, nome: true, tipo: true },
  })
}

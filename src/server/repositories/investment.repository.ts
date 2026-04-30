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

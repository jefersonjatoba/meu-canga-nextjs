import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type {
  CreateRecorrenciaSchema,
  UpdateRecorrenciaSchema,
} from '@/features/recorrencias/schemas'

export type PrismaTx = Prisma.TransactionClient

const recorrenciaInclude = {
  conta: { select: { id: true, nome: true, tipo: true } },
  categoriaRef: { select: { id: true, nome: true, tipo: true } },
} as const

export async function runInTransaction<T>(fn: (tx: PrismaTx) => Promise<T>) {
  return prisma.$transaction(fn)
}

export async function listRecorrenciasByUser(userId: string) {
  return prisma.recorrencia.findMany({
    where: { userId },
    include: recorrenciaInclude,
    orderBy: [{ ativa: 'desc' }, { diaVencimento: 'asc' }, { descricao: 'asc' }],
  })
}

export async function listActiveRecorrenciasForProcessing(tx: PrismaTx, userId: string) {
  return tx.recorrencia.findMany({
    where: { userId, ativa: true },
    include: recorrenciaInclude,
    orderBy: { diaVencimento: 'asc' },
  })
}

export async function findRecorrenciaById(userId: string, id: string) {
  return prisma.recorrencia.findFirst({
    where: { id, userId },
    include: recorrenciaInclude,
  })
}

export async function findContaForRecorrencia(
  tx: PrismaTx,
  userId: string,
  contaId: string,
) {
  return tx.conta.findFirst({
    where: { id: contaId, userId, ativa: true },
    select: { id: true, nome: true, tipo: true },
  })
}

export async function findCategoriaForRecorrencia(
  tx: PrismaTx,
  userId: string,
  categoriaId: string,
) {
  return tx.categoria.findFirst({
    where: { id: categoriaId, userId, ativa: true },
    select: { id: true, nome: true, tipo: true },
  })
}

export async function createRecorrencia(
  tx: PrismaTx,
  userId: string,
  data: CreateRecorrenciaSchema & {
    categoria: string
    proximaExecucao: Date | null
  },
) {
  return tx.recorrencia.create({
    data: {
      userId,
      contaId: data.contaId,
      categoriaId: data.categoriaId,
      descricao: data.descricao,
      tipo: data.tipo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      frequencia: data.frequencia,
      diaVencimento: data.diaVencimento,
      dataInicio: parseUTCDate(data.dataInicio),
      dataFim: data.dataFim ? parseUTCDate(data.dataFim) : null,
      proximaExecucao: data.proximaExecucao,
      ativa: true,
    },
    include: recorrenciaInclude,
  })
}

export async function updateRecorrencia(
  tx: PrismaTx,
  userId: string,
  id: string,
  data: UpdateRecorrenciaSchema & {
    categoria?: string
    proximaExecucao?: Date | null
  },
) {
  return tx.recorrencia.updateMany({
    where: { id, userId },
    data: {
      contaId: data.contaId,
      categoriaId: data.categoriaId,
      descricao: data.descricao,
      tipo: data.tipo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      frequencia: data.frequencia,
      diaVencimento: data.diaVencimento,
      dataInicio: data.dataInicio ? parseUTCDate(data.dataInicio) : undefined,
      dataFim: data.dataFim === undefined ? undefined : data.dataFim ? parseUTCDate(data.dataFim) : null,
      proximaExecucao: data.proximaExecucao,
      ativa: data.ativa,
    },
  })
}

export async function toggleRecorrenciaAtiva(
  tx: PrismaTx,
  userId: string,
  id: string,
  ativa: boolean,
  proximaExecucao: Date | null,
) {
  return tx.recorrencia.updateMany({
    where: { id, userId },
    data: { ativa, proximaExecucao },
  })
}

export async function findLancamentoByRecorrenciaCompetencia(
  tx: PrismaTx,
  userId: string,
  recorrenciaId: string,
  competenciaAt: string,
) {
  return tx.lancamento.findFirst({
    where: { userId, recorrenciaId, competenciaAt },
    select: { id: true },
  })
}

export async function createLancamentoFromRecorrencia(
  tx: PrismaTx,
  data: {
    userId: string
    contaId: string
    categoriaId?: string | null
    descricao: string
    tipo: string
    categoria: string
    valorCentavos: number
    data: Date
    competenciaAt: string
    recorrenciaId: string
  },
) {
  return tx.lancamento.create({
    data: {
      userId: data.userId,
      contaId: data.contaId,
      categoriaId: data.categoriaId,
      descricao: data.descricao,
      tipo: data.tipo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      data: data.data,
      competenciaAt: data.competenciaAt,
      source: 'recorrente',
      status: 'confirmada',
      recorrenciaId: data.recorrenciaId,
      metaJson: {
        origem: 'recorrencia',
        recorrenciaId: data.recorrenciaId,
      },
    },
  })
}

export async function updateRecorrenciaExecutionState(
  tx: PrismaTx,
  userId: string,
  id: string,
  data: {
    ultimaExecucao?: Date | null
    proximaExecucao?: Date | null
  },
) {
  return tx.recorrencia.updateMany({
    where: { id, userId },
    data,
  })
}

export async function findRecorrenciaByIdTx(tx: PrismaTx, userId: string, id: string) {
  return tx.recorrencia.findFirst({
    where: { id, userId },
    include: recorrenciaInclude,
  })
}

function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

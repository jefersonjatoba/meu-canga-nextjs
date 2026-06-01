import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type PrismaTx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function runInTransaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn)
}

const ASSINATURA_INCLUDE = {
  conta: { select: { id: true, nome: true, tipo: true } },
  categoriaRef: { select: { id: true, nome: true, tipo: true } },
} as const

export async function listAssinaturasByUser(userId: string) {
  return prisma.assinaturaCartao.findMany({
    where: { userId },
    include: ASSINATURA_INCLUDE,
    orderBy: [{ ativa: 'desc' }, { proximaCobranca: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function listActiveAssinaturasForProcessing(tx: PrismaTx, userId: string) {
  return tx.assinaturaCartao.findMany({
    where: { userId, ativa: true },
    include: {
      conta: { select: { id: true, tipo: true, diaFechamento: true, diaVencimento: true } },
    },
  })
}

export async function findAssinaturaById(userId: string, id: string) {
  return prisma.assinaturaCartao.findFirst({
    where: { id, userId },
    include: ASSINATURA_INCLUDE,
  })
}

export async function findAssinaturaByIdTx(tx: PrismaTx, userId: string, id: string) {
  return tx.assinaturaCartao.findFirst({
    where: { id, userId },
    include: ASSINATURA_INCLUDE,
  })
}

export async function findContaForAssinatura(tx: PrismaTx, userId: string, contaId: string) {
  return tx.conta.findFirst({
    where: { id: contaId, userId, ativa: true },
    select: { id: true, tipo: true, diaFechamento: true, diaVencimento: true },
  })
}

export async function findCategoriaForAssinatura(tx: PrismaTx, userId: string, categoriaId: string) {
  return tx.categoria.findFirst({
    where: { id: categoriaId, userId, ativa: true },
    select: { id: true, nome: true, tipo: true },
  })
}

export async function createAssinatura(
  tx: PrismaTx,
  userId: string,
  data: {
    contaId: string
    categoriaId?: string | null
    descricao: string
    categoria: string
    valorCentavos: number
    diaCobranca: number
    dataInicio: Date
    dataFim?: Date | null
    proximaCobranca?: Date | null
  },
) {
  return tx.assinaturaCartao.create({
    data: {
      userId,
      contaId: data.contaId,
      categoriaId: data.categoriaId ?? null,
      descricao: data.descricao,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      diaCobranca: data.diaCobranca,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim ?? null,
      proximaCobranca: data.proximaCobranca ?? null,
      ativa: true,
    },
    include: ASSINATURA_INCLUDE,
  })
}

export async function updateAssinatura(
  tx: PrismaTx,
  userId: string,
  id: string,
  data: Prisma.AssinaturaCartaoUpdateInput,
) {
  return tx.assinaturaCartao.updateMany({
    where: { id, userId },
    data,
  })
}

export async function toggleAssinaturaAtiva(
  tx: PrismaTx,
  userId: string,
  id: string,
  ativa: boolean,
  proximaCobranca: Date | null,
) {
  return tx.assinaturaCartao.updateMany({
    where: { id, userId },
    data: { ativa, proximaCobranca },
  })
}

export async function updateAssinaturaCobrancaState(
  tx: PrismaTx,
  userId: string,
  id: string,
  data: { ultimaCobranca?: Date | null; proximaCobranca: Date | null; ultimaCompetencia: string },
) {
  return tx.assinaturaCartao.updateMany({
    where: { id, userId },
    data,
  })
}

export async function findCompraByAssinaturaCompetencia(
  tx: PrismaTx,
  userId: string,
  assinaturaCartaoId: string,
  competencia: string,
) {
  return tx.compraCartao.findFirst({
    where: { userId, assinaturaCartaoId, parcelas: { some: { competencia } } },
    select: { id: true },
  })
}

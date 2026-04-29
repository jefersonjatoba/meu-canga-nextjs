import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type {
  CreateMetaSchema,
  RegistrarMetaAporteSchema,
  UpdateMetaSchema,
} from '@/features/metas/schemas'

export type PrismaTx = Prisma.TransactionClient

const metaInclude = {
  aportes: {
    orderBy: { dataAporte: 'desc' as const },
    include: {
      conta: { select: { id: true, nome: true, tipo: true } },
    },
  },
} as const

export async function runInTransaction<T>(fn: (tx: PrismaTx) => Promise<T>) {
  return prisma.$transaction(fn)
}

export async function listMetasByUser(userId: string) {
  return prisma.meta.findMany({
    where: { userId },
    include: metaInclude,
    orderBy: [{ status: 'asc' }, { ordem: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function findMetaById(userId: string, id: string) {
  return prisma.meta.findFirst({
    where: { id, userId },
    include: metaInclude,
  })
}

export async function findMetaByIdTx(tx: PrismaTx, userId: string, id: string) {
  return tx.meta.findFirst({
    where: { id, userId },
    include: metaInclude,
  })
}

export async function createMeta(
  tx: PrismaTx,
  userId: string,
  data: CreateMetaSchema,
) {
  return tx.meta.create({
    data: {
      userId,
      descricao: data.descricao,
      categoria: data.tipo,
      tipo: data.tipo,
      valorAlvoCentavos: data.valorAlvoCentavos,
      valorInicialCentavos: data.valorInicialCentavos ?? 0,
      valorAtualCentavos: data.valorInicialCentavos ?? 0,
      dataInicio: parseUTCDate(data.dataInicio),
      dataAlvo: data.dataAlvo ? parseUTCDate(data.dataAlvo) : null,
      status: 'ativa',
      cor: data.cor,
      icone: data.icone,
      ordem: data.ordem ?? 0,
    },
    include: metaInclude,
  })
}

export async function updateMeta(
  tx: PrismaTx,
  userId: string,
  id: string,
  data: UpdateMetaSchema & { status?: string; valorAtualCentavos?: number },
) {
  return tx.meta.updateMany({
    where: { id, userId },
    data: {
      descricao: data.descricao,
      categoria: data.tipo,
      tipo: data.tipo,
      valorAlvoCentavos: data.valorAlvoCentavos,
      valorInicialCentavos: data.valorInicialCentavos,
      valorAtualCentavos: data.valorAtualCentavos,
      dataInicio: data.dataInicio ? parseUTCDate(data.dataInicio) : undefined,
      dataAlvo: data.dataAlvo === undefined ? undefined : data.dataAlvo ? parseUTCDate(data.dataAlvo) : null,
      status: data.status,
      cor: data.cor,
      icone: data.icone,
      ordem: data.ordem,
    },
  })
}

export async function updateMetaStatus(
  tx: PrismaTx,
  userId: string,
  id: string,
  status: string,
  valorAtualCentavos?: number,
) {
  return tx.meta.updateMany({
    where: { id, userId },
    data: { status, valorAtualCentavos },
  })
}

export async function findContaForMetaAporte(
  tx: PrismaTx,
  userId: string,
  contaId: string,
) {
  return tx.conta.findFirst({
    where: { id: contaId, userId, ativa: true },
    select: { id: true, nome: true, tipo: true },
  })
}

export async function createMetaAporte(
  tx: PrismaTx,
  userId: string,
  metaId: string,
  data: RegistrarMetaAporteSchema,
) {
  return tx.metaAporte.create({
    data: {
      userId,
      metaId,
      contaId: data.contaId,
      valorCentavos: data.valorCentavos,
      dataAporte: parseUTCDate(data.dataAporte),
      descricao: data.descricao,
      status: 'confirmado',
    },
  })
}

export async function findMetaAporteById(
  tx: PrismaTx,
  userId: string,
  metaId: string,
  aporteId: string,
) {
  return tx.metaAporte.findFirst({
    where: { id: aporteId, userId, metaId },
  })
}

export async function updateMetaAporteStatus(
  tx: PrismaTx,
  userId: string,
  metaId: string,
  aporteId: string,
  status: string,
) {
  return tx.metaAporte.updateMany({
    where: { id: aporteId, userId, metaId },
    data: { status },
  })
}

function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

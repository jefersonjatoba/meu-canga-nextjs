import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type {
  FaturaCartaoFiltersSchema,
  PagarFaturaSchema,
} from '@/features/cartao/schemas'

export type PrismaTx = Prisma.TransactionClient

const faturaInclude = {
  conta: { select: { id: true, nome: true, tipo: true } },
  parcelas: {
    orderBy: { numero: 'asc' as const },
    include: {
      compraCartao: true,
      lancamento: {
        select: {
          id: true,
          descricao: true,
          tipo: true,
          categoria: true,
          valorCentavos: true,
          data: true,
          competenciaAt: true,
          source: true,
          status: true,
        },
      },
    },
  },
  pagamentos: {
    orderBy: { dataPagamento: 'asc' as const },
    include: { contaPagamento: { select: { id: true, nome: true, tipo: true } } },
  },
} as const

export async function runInTransaction<T>(
  fn: (tx: PrismaTx) => Promise<T>,
) {
  return prisma.$transaction(fn)
}

export async function findContaByIdForUser(
  tx: PrismaTx,
  userId: string,
  contaId: string,
) {
  return tx.conta.findFirst({
    where: { id: contaId, userId, ativa: true },
    select: {
      id: true,
      nome: true,
      tipo: true,
      diaFechamento: true,
      diaVencimento: true,
    },
  })
}

export async function findCategoriaByIdForUser(
  tx: PrismaTx,
  userId: string,
  categoriaId: string,
) {
  return tx.categoria.findFirst({
    where: { id: categoriaId, userId, ativa: true },
    select: { id: true, nome: true, tipo: true },
  })
}

export async function createCompraCartao(
  tx: PrismaTx,
  data: {
    userId: string
    contaId: string
    categoriaId?: string | null
    categoria: string
    descricao: string
    valorTotalCentavos: number
    dataCompra: Date
    quantidadeParcelas: number
  },
) {
  return tx.compraCartao.create({
    data: {
      userId: data.userId,
      contaId: data.contaId,
      categoriaId: data.categoriaId,
      categoria: data.categoria,
      descricao: data.descricao,
      valorTotalCentavos: data.valorTotalCentavos,
      dataCompra: data.dataCompra,
      quantidadeParcelas: data.quantidadeParcelas,
      status: 'ativa',
    },
  })
}

export async function findOrCreateFaturaCartao(
  tx: PrismaTx,
  data: {
    userId: string
    contaId: string
    competencia: string
    dataFechamento: Date
    dataVencimento: Date
  },
) {
  return tx.faturaCartao.upsert({
    where: {
      contaId_competencia: {
        contaId: data.contaId,
        competencia: data.competencia,
      },
    },
    create: {
      userId: data.userId,
      contaId: data.contaId,
      competencia: data.competencia,
      dataFechamento: data.dataFechamento,
      dataVencimento: data.dataVencimento,
      status: 'aberta',
    },
    update: {},
  })
}

export async function incrementFaturaTotal(
  tx: PrismaTx,
  userId: string,
  faturaCartaoId: string,
  valorCentavos: number,
) {
  return tx.faturaCartao.updateMany({
    where: { id: faturaCartaoId, userId },
    data: { totalCentavos: { increment: valorCentavos } },
  })
}

export async function createParcelaCartao(
  tx: PrismaTx,
  data: {
    userId: string
    compraCartaoId: string
    faturaCartaoId: string
    numero: number
    totalParcelas: number
    valorCentavos: number
    competencia: string
    dataVencimento: Date
  },
) {
  return tx.parcelaCartao.create({
    data: {
      userId: data.userId,
      compraCartaoId: data.compraCartaoId,
      faturaCartaoId: data.faturaCartaoId,
      numero: data.numero,
      totalParcelas: data.totalParcelas,
      valorCentavos: data.valorCentavos,
      competencia: data.competencia,
      dataVencimento: data.dataVencimento,
      status: 'lancada',
    },
  })
}

export async function createLancamentoForParcelaCartao(
  tx: PrismaTx,
  data: {
    userId: string
    contaId: string
    categoriaId?: string | null
    categoria: string
    descricao: string
    valorCentavos: number
    data: Date
    competenciaAt: string
    compraCartaoId: string
    faturaCartaoId: string
    parcelaCartaoId: string
    numero: number
    totalParcelas: number
  },
) {
  return tx.lancamento.create({
    data: {
      userId: data.userId,
      contaId: data.contaId,
      categoriaId: data.categoriaId,
      categoria: data.categoria,
      descricao: data.totalParcelas > 1
        ? `${data.descricao} (${data.numero}/${data.totalParcelas})`
        : data.descricao,
      tipo: 'expense',
      valorCentavos: data.valorCentavos,
      data: data.data,
      competenciaAt: data.competenciaAt,
      source: 'parcelado',
      parcelas: data.totalParcelas,
      parcelaAtual: data.numero,
      status: 'confirmada',
      metaJson: {
        origem: 'cartao_credito',
        compraCartaoId: data.compraCartaoId,
        faturaCartaoId: data.faturaCartaoId,
        parcelaCartaoId: data.parcelaCartaoId,
      },
    },
  })
}

export async function linkParcelaToLancamento(
  tx: PrismaTx,
  userId: string,
  parcelaCartaoId: string,
  lancamentoId: string,
) {
  return tx.parcelaCartao.updateMany({
    where: { id: parcelaCartaoId, userId },
    data: { lancamentoId },
  })
}

export async function findCompraCartaoById(userId: string, id: string) {
  return prisma.compraCartao.findFirst({
    where: { id, userId },
    include: {
      parcelas: {
        orderBy: { numero: 'asc' },
        include: {
          faturaCartao: true,
          lancamento: true,
        },
      },
    },
  })
}

export async function listFaturasByUser(
  userId: string,
  filters: FaturaCartaoFiltersSchema,
) {
  return prisma.faturaCartao.findMany({
    where: {
      userId,
      contaId: filters.contaId,
      status: filters.status,
      competencia: filters.competencia,
    },
    include: {
      conta: { select: { id: true, nome: true, tipo: true } },
      _count: { select: { parcelas: true, pagamentos: true } },
    },
    orderBy: [{ competencia: 'desc' }, { dataVencimento: 'desc' }],
  })
}

export async function findFaturaById(userId: string, faturaId: string) {
  return prisma.faturaCartao.findFirst({
    where: { id: faturaId, userId },
    include: faturaInclude,
  })
}

export async function findFaturaByIdForUpdate(
  tx: PrismaTx,
  userId: string,
  faturaId: string,
) {
  return tx.faturaCartao.findFirst({
    where: { id: faturaId, userId },
  })
}

export async function createPagamentoFatura(
  tx: PrismaTx,
  userId: string,
  data: PagarFaturaSchema,
) {
  return tx.pagamentoFatura.create({
    data: {
      userId,
      faturaCartaoId: data.faturaCartaoId,
      contaPagamentoId: data.contaPagamentoId,
      valorCentavos: data.valorCentavos,
      dataPagamento: parseUTCDate(data.dataPagamento),
      status: 'confirmado',
    },
  })
}

export async function sumPagamentosConfirmados(
  tx: PrismaTx,
  userId: string,
  faturaCartaoId: string,
) {
  const result = await tx.pagamentoFatura.aggregate({
    where: { userId, faturaCartaoId, status: 'confirmado' },
    _sum: { valorCentavos: true },
  })
  return result._sum.valorCentavos ?? 0
}

export async function updateFaturaStatus(
  tx: PrismaTx,
  userId: string,
  faturaCartaoId: string,
  status: string,
) {
  return tx.faturaCartao.updateMany({
    where: { id: faturaCartaoId, userId },
    data: { status },
  })
}

export async function listCreditCardAccountsForDashboard(userId: string) {
  return prisma.conta.findMany({
    where: { userId, ativa: true, tipo: 'credit' },
    select: {
      id: true,
      nome: true,
      limiteCentavos: true,
    },
    orderBy: { nome: 'asc' },
  })
}

export async function listOpenFaturasForDashboard(userId: string) {
  return prisma.faturaCartao.findMany({
    where: {
      userId,
      status: { in: ['aberta', 'fechada', 'vencida'] },
    },
    select: {
      id: true,
      contaId: true,
      competencia: true,
      dataVencimento: true,
      status: true,
      totalCentavos: true,
      conta: { select: { nome: true } },
    },
    orderBy: [{ dataVencimento: 'asc' }, { competencia: 'asc' }],
  })
}

function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

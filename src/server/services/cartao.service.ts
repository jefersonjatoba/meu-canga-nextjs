import {
  createCompraCartaoSchema,
  faturaCartaoFiltersSchema,
  pagarFaturaSchema,
} from '@/features/cartao/schemas'
import type {
  CreateCompraCartaoInput,
  CreditCardDashboardSummaryDTO,
  FaturaCartaoFilters,
  PagarFaturaInput,
} from '@/features/cartao/types'
import {
  generateInstallments,
  type CardInstallment,
} from '@/server/engines/card.engine'
import * as repo from '@/server/repositories/cartao.repository'

export async function criarCompraCartao(
  userId: string,
  input: CreateCompraCartaoInput,
) {
  const validated = createCompraCartaoSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const conta = await repo.findContaByIdForUser(tx, userId, validated.contaId)
    assertCreditCardConta(conta)

    const categoria = validated.categoriaId
      ? await repo.findCategoriaByIdForUser(tx, userId, validated.categoriaId)
      : null
    if (validated.categoriaId && !categoria) throw new CategoriaCartaoNotFoundOrForbiddenError()

    const parcelas = generateInstallments({
      dataCompra: validated.dataCompra,
      diaFechamento: conta.diaFechamento,
      diaVencimento: conta.diaVencimento,
      valorTotalCentavos: validated.valorTotalCentavos,
      quantidadeParcelas: validated.quantidadeParcelas,
    })

    const compra = await repo.createCompraCartao(tx, {
      userId,
      contaId: validated.contaId,
      categoriaId: categoria?.id ?? null,
      categoria: categoria?.nome ?? validated.categoria,
      descricao: validated.descricao,
      valorTotalCentavos: validated.valorTotalCentavos,
      dataCompra: parseUTCDate(validated.dataCompra),
      quantidadeParcelas: validated.quantidadeParcelas,
    })

    for (const parcela of parcelas) {
      await createParcelaComLancamento({
        tx,
        userId,
        contaId: validated.contaId,
        compraCartaoId: compra.id,
        categoriaId: categoria?.id ?? null,
        categoria: categoria?.nome ?? validated.categoria,
        descricao: validated.descricao,
        parcela,
      })
    }

    return repo.findCompraCartaoById(userId, compra.id)
  })
}

export async function listarFaturas(
  userId: string,
  rawFilters: FaturaCartaoFilters,
) {
  const filters = faturaCartaoFiltersSchema.parse(rawFilters)
  return repo.listFaturasByUser(userId, filters)
}

export async function obterFatura(userId: string, faturaId: string) {
  const fatura = await repo.findFaturaById(userId, faturaId)
  if (!fatura) throw new FaturaCartaoNotFoundOrForbiddenError()
  return fatura
}

export async function cancelarCompraCartao(userId: string, compraCartaoId: string) {
  await repo.runInTransaction(async tx => {
    const compra = await repo.findCompraCartaoForCancellation(tx, userId, compraCartaoId)
    if (!compra) throw new CompraCartaoNotFoundOrForbiddenError()
    if (compra.status !== 'ativa') throw new CompraCartaoInvalidStateError()
    if (compra.parcelas.length === 0) throw new CompraCartaoInvalidStateError()

    const lancamentoIds: string[] = []
    const decrementosPorFatura = new Map<string, number>()

    for (const parcela of compra.parcelas) {
      if (!['lancada', 'prevista'].includes(parcela.status)) {
        throw new CompraCartaoInvalidStateError()
      }
      if (parcela.faturaCartao.status !== 'aberta') {
        throw new CompraCartaoInvalidStateError()
      }
      if (parcela.faturaCartao.pagamentos.length > 0) {
        throw new CompraCartaoInvalidStateError()
      }
      if (!parcela.lancamento || parcela.lancamento.userId !== userId) {
        throw new CompraCartaoInvalidStateError()
      }

      lancamentoIds.push(parcela.lancamento.id)
      decrementosPorFatura.set(
        parcela.faturaCartaoId,
        (decrementosPorFatura.get(parcela.faturaCartaoId) ?? 0) + parcela.valorCentavos,
      )
    }

    const compraResult = await repo.updateCompraCartaoStatus(
      tx,
      userId,
      compraCartaoId,
      'cancelada',
    )
    if (compraResult.count !== 1) throw new CompraCartaoNotFoundOrForbiddenError()

    const parcelasResult = await repo.updateParcelasCartaoStatusByCompra(
      tx,
      userId,
      compraCartaoId,
      'cancelada',
    )
    if (parcelasResult.count !== compra.parcelas.length) throw new CompraCartaoInvalidStateError()

    const lancamentosResult = await repo.updateLancamentosStatusByIds(
      tx,
      userId,
      lancamentoIds,
      'cancelada',
    )
    if (lancamentosResult.count !== lancamentoIds.length) throw new CompraCartaoInvalidStateError()

    for (const [faturaCartaoId, valorCentavos] of decrementosPorFatura) {
      const decrementResult = await repo.decrementFaturaTotal(
        tx,
        userId,
        faturaCartaoId,
        valorCentavos,
      )
      if (decrementResult.count !== 1) throw new FaturaCartaoInvalidStateError()

      await repo.cancelFaturaIfZero(tx, userId, faturaCartaoId)
    }
  })

  return repo.findCompraCartaoById(userId, compraCartaoId)
}

export async function pagarFatura(
  userId: string,
  input: PagarFaturaInput,
) {
  const validated = pagarFaturaSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const fatura = await repo.findFaturaByIdForUpdate(tx, userId, validated.faturaCartaoId)
    if (!fatura) throw new FaturaCartaoNotFoundOrForbiddenError()
    if (fatura.status === 'cancelada') throw new FaturaCartaoInvalidStateError()

    const contaPagamento = await repo.findContaByIdForUser(tx, userId, validated.contaPagamentoId)
    if (!contaPagamento) throw new ContaPagamentoNotFoundOrForbiddenError()
    if (contaPagamento.tipo === 'credit') throw new ContaPagamentoInvalidaError()

    const pagamento = await repo.createPagamentoFatura(tx, userId, validated)
    const totalPago = await repo.sumPagamentosConfirmados(tx, userId, validated.faturaCartaoId)

    if (totalPago >= fatura.totalCentavos) {
      await repo.updateFaturaStatus(tx, userId, validated.faturaCartaoId, 'paga')
    }

    return pagamento
  })
}

export async function getCreditCardDashboardSummary(
  userId: string,
): Promise<CreditCardDashboardSummaryDTO> {
  const [cartoes, faturasAbertas] = await Promise.all([
    repo.listCreditCardAccountsForDashboard(userId),
    repo.listOpenFaturasForDashboard(userId),
  ])

  const totalLimiteCentavos = cartoes.reduce(
    (acc, conta) => acc + (conta.limiteCentavos ?? 0),
    0,
  )
  const valorFaturasAbertasCentavos = faturasAbertas.reduce(
    (acc, fatura) => acc + fatura.totalCentavos,
    0,
  )
  const faturasProximas = faturasAbertas.slice(0, 5).map(fatura => ({
    id: fatura.id,
    contaId: fatura.contaId,
    contaNome: fatura.conta.nome,
    competencia: fatura.competencia,
    dataVencimento: fatura.dataVencimento,
    status: fatura.status,
    totalCentavos: fatura.totalCentavos,
  }))

  return {
    totalCartoes: cartoes.length,
    totalLimiteCentavos,
    limiteUsadoCentavos: valorFaturasAbertasCentavos,
    limiteDisponivelCentavos: Math.max(0, totalLimiteCentavos - valorFaturasAbertasCentavos),
    totalFaturasAbertas: faturasAbertas.length,
    valorFaturasAbertasCentavos,
    proximaFatura: faturasProximas[0] ?? null,
    faturasProximas,
  }
}

async function createParcelaComLancamento(input: {
  tx: repo.PrismaTx
  userId: string
  contaId: string
  compraCartaoId: string
  categoriaId: string | null
  categoria: string
  descricao: string
  parcela: CardInstallment
}) {
  const fatura = await repo.findOrCreateFaturaCartao(input.tx, {
    userId: input.userId,
    contaId: input.contaId,
    competencia: input.parcela.competencia,
    dataFechamento: parseUTCDate(input.parcela.dataFechamento),
    dataVencimento: parseUTCDate(input.parcela.dataVencimento),
  })

  const parcelaCartao = await repo.createParcelaCartao(input.tx, {
    userId: input.userId,
    compraCartaoId: input.compraCartaoId,
    faturaCartaoId: fatura.id,
    numero: input.parcela.numero,
    totalParcelas: input.parcela.totalParcelas,
    valorCentavos: input.parcela.valorCentavos,
    competencia: input.parcela.competencia,
    dataVencimento: parseUTCDate(input.parcela.dataVencimento),
  })

  const lancamento = await repo.createLancamentoForParcelaCartao(input.tx, {
    userId: input.userId,
    contaId: input.contaId,
    categoriaId: input.categoriaId,
    categoria: input.categoria,
    descricao: input.descricao,
    valorCentavos: input.parcela.valorCentavos,
    data: parseUTCDate(input.parcela.dataVencimento),
    competenciaAt: input.parcela.competencia,
    compraCartaoId: input.compraCartaoId,
    faturaCartaoId: fatura.id,
    parcelaCartaoId: parcelaCartao.id,
    numero: input.parcela.numero,
    totalParcelas: input.parcela.totalParcelas,
  })

  await repo.linkParcelaToLancamento(input.tx, input.userId, parcelaCartao.id, lancamento.id)
  await repo.incrementFaturaTotal(input.tx, input.userId, fatura.id, input.parcela.valorCentavos)
}

function assertCreditCardConta(
  conta: {
    tipo: string
    diaFechamento: number | null
    diaVencimento: number | null
  } | null,
): asserts conta is {
  tipo: 'credit'
  diaFechamento: number
  diaVencimento: number
} {
  if (!conta) throw new ContaCartaoNotFoundOrForbiddenError()
  if (conta.tipo !== 'credit') throw new ContaCartaoInvalidaError()
  if (conta.diaFechamento == null || conta.diaVencimento == null) {
    throw new ContaCartaoSemConfiguracaoError()
  }
}

function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export class ContaCartaoNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Conta cartao nao encontrada ou acesso negado')
    this.name = 'ContaCartaoNotFoundOrForbiddenError'
  }
}

export class ContaCartaoInvalidaError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Conta deve ser do tipo credit')
    this.name = 'ContaCartaoInvalidaError'
  }
}

export class ContaCartaoSemConfiguracaoError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Conta cartao precisa de diaFechamento e diaVencimento')
    this.name = 'ContaCartaoSemConfiguracaoError'
  }
}

export class CategoriaCartaoNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Categoria nao encontrada ou acesso negado')
    this.name = 'CategoriaCartaoNotFoundOrForbiddenError'
  }
}

export class CompraCartaoNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Compra no cartao nao encontrada ou acesso negado')
    this.name = 'CompraCartaoNotFoundOrForbiddenError'
  }
}

export class CompraCartaoInvalidStateError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Compra no cartao nao permite cancelamento neste estado')
    this.name = 'CompraCartaoInvalidStateError'
  }
}

export class FaturaCartaoNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Fatura nao encontrada ou acesso negado')
    this.name = 'FaturaCartaoNotFoundOrForbiddenError'
  }
}

export class FaturaCartaoInvalidStateError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Fatura nao permite pagamento neste estado')
    this.name = 'FaturaCartaoInvalidStateError'
  }
}

export class ContaPagamentoNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Conta de pagamento nao encontrada ou acesso negado')
    this.name = 'ContaPagamentoNotFoundOrForbiddenError'
  }
}

export class ContaPagamentoInvalidaError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Pagamento de fatura deve usar conta diferente de credit')
    this.name = 'ContaPagamentoInvalidaError'
  }
}

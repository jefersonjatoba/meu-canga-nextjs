// Assinatura Service — gerencia assinaturas recorrentes em cartão de crédito.
// Regras:
//   1. Conta deve ser do tipo 'credit' com diaFechamento e diaVencimento configurados.
//   2. Processamento gera CompraCartao (1 parcela) no ciclo correto, sem duplicar por competência.
//   3. Pause/cancelamento preserva histórico de compras já geradas.
//   4. proximaCobranca calculada com clamp de dia (ex: dia 31 em fevereiro → último dia).

import { Prisma } from '@prisma/client'
import {
  createAssinaturaCartaoSchema,
  updateAssinaturaCartaoSchema,
} from '@/features/assinaturas/schemas'
import type {
  CreateAssinaturaCartaoInput,
  ProcessarAssinaturasResult,
  UpdateAssinaturaCartaoInput,
} from '@/features/assinaturas/types'
import * as repo from '@/server/repositories/assinatura.repository'
import * as cartaoRepo from '@/server/repositories/cartao.repository'
import { generateInstallments } from '@/server/engines/card.engine'

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listAssinaturasForUser(userId: string) {
  return repo.listAssinaturasByUser(userId)
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createAssinaturaForUser(userId: string, input: CreateAssinaturaCartaoInput) {
  const validated = createAssinaturaCartaoSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const conta = await repo.findContaForAssinatura(tx, userId, validated.contaId)
    assertCreditCartaoConta(conta)

    const categoria = validated.categoriaId
      ? await repo.findCategoriaForAssinatura(tx, userId, validated.categoriaId)
      : null
    if (validated.categoriaId && !categoria) throw new AssinaturaCategoriaNotFoundError()

    const dataInicio = parseUTCDate(validated.dataInicio)
    const dataFim = validated.dataFim ? parseUTCDate(validated.dataFim) : null

    return repo.createAssinatura(tx, userId, {
      contaId: validated.contaId,
      categoriaId: categoria?.id ?? null,
      descricao: validated.descricao,
      categoria: categoria?.nome ?? validated.categoria,
      valorCentavos: validated.valorCentavos,
      diaCobranca: validated.diaCobranca,
      dataInicio,
      dataFim,
      proximaCobranca: calcularProximaCobranca({
        dataInicio,
        dataFim,
        diaCobranca: validated.diaCobranca,
        after: normalizeUTCDate(new Date()),
      }),
    })
  })
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateAssinaturaForUser(
  userId: string,
  id: string,
  input: UpdateAssinaturaCartaoInput,
) {
  const validated = updateAssinaturaCartaoSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const current = await repo.findAssinaturaByIdTx(tx, userId, id)
    if (!current) throw new AssinaturaNotFoundOrForbiddenError()

    const categoria = validated.categoriaId
      ? await repo.findCategoriaForAssinatura(tx, userId, validated.categoriaId)
      : null
    if (validated.categoriaId && !categoria) throw new AssinaturaCategoriaNotFoundError()

    const nextDataFim = validated.dataFim === undefined
      ? current.dataFim
      : validated.dataFim ? parseUTCDate(validated.dataFim) : null

    const nextDia = validated.diaCobranca ?? current.diaCobranca
    const nextAtiva = validated.ativa ?? current.ativa
    const hoje = normalizeUTCDate(new Date())

    const updateData: Prisma.AssinaturaCartaoUpdateInput = {
      ...(validated.descricao !== undefined && { descricao: validated.descricao }),
      ...(validated.valorCentavos !== undefined && { valorCentavos: validated.valorCentavos }),
      ...(validated.diaCobranca !== undefined && { diaCobranca: validated.diaCobranca }),
      ...(validated.dataFim !== undefined && { dataFim: nextDataFim }),
      ...(validated.ativa !== undefined && { ativa: nextAtiva }),
      ...(validated.categoriaId !== undefined && {
        categoriaId: categoria?.id ?? null,
        categoria: categoria?.nome ?? validated.categoria ?? current.categoria,
      }),
      ...(validated.categoria !== undefined && !validated.categoriaId && { categoria: validated.categoria }),
      proximaCobranca: nextAtiva
        ? calcularProximaCobranca({
            dataInicio: current.dataInicio,
            dataFim: nextDataFim,
            diaCobranca: nextDia,
            after: hoje,
          })
        : null,
    }

    const result = await repo.updateAssinatura(tx, userId, id, updateData)
    if (result.count === 0) throw new AssinaturaNotFoundOrForbiddenError()

    const updated = await repo.findAssinaturaByIdTx(tx, userId, id)
    if (!updated) throw new AssinaturaNotFoundOrForbiddenError()
    return updated
  })
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export async function toggleAssinaturaForUser(userId: string, id: string) {
  return repo.runInTransaction(async tx => {
    const current = await repo.findAssinaturaByIdTx(tx, userId, id)
    if (!current) throw new AssinaturaNotFoundOrForbiddenError()

    const ativa = !current.ativa
    const proximaCobranca = ativa
      ? calcularProximaCobranca({
          dataInicio: current.dataInicio,
          dataFim: current.dataFim,
          diaCobranca: current.diaCobranca,
          after: normalizeUTCDate(new Date()),
        })
      : null

    const result = await repo.toggleAssinaturaAtiva(tx, userId, id, ativa, proximaCobranca)
    if (result.count === 0) throw new AssinaturaNotFoundOrForbiddenError()

    const updated = await repo.findAssinaturaByIdTx(tx, userId, id)
    if (!updated) throw new AssinaturaNotFoundOrForbiddenError()
    return updated
  })
}

// ─── Processar ────────────────────────────────────────────────────────────────

export async function processarAssinaturas(
  userId: string,
  options: { hoje?: Date } = {},
): Promise<ProcessarAssinaturasResult> {
  const hoje = normalizeUTCDate(options.hoje ?? new Date())

  return repo.runInTransaction(async tx => {
    const assinaturas = await repo.listActiveAssinaturasForProcessing(tx, userId)
    let comprasCriadas = 0
    let ignoradosPorDuplicidade = 0

    for (const assinatura of assinaturas) {
      const conta = assinatura.conta
      if (!conta || conta.tipo !== 'credit' || conta.diaFechamento == null || conta.diaVencimento == null) {
        continue
      }

      // Calcula competência devida (baseado na data de cobrança vs fechamento)
      const competenciasDevidas = calcularCompetenciasDevidas({
        dataInicio: assinatura.dataInicio,
        dataFim: assinatura.dataFim,
        diaCobranca: assinatura.diaCobranca,
        ultimaCompetencia: assinatura.ultimaCompetencia,
        ate: hoje,
      })

      for (const { dataCobranca, competencia } of competenciasDevidas) {
        // Anti-duplicidade por competência
        const existing = await repo.findCompraByAssinaturaCompetencia(
          tx,
          userId,
          assinatura.id,
          competencia,
        )
        if (existing) {
          ignoradosPorDuplicidade += 1
          continue
        }

        try {
          // Gera CompraCartao (1 parcela) usando o engine existente de cartão
          const parcelas = generateInstallments({
            dataCompra: dataCobranca.toISOString().slice(0, 10),
            diaFechamento: conta.diaFechamento,
            diaVencimento: conta.diaVencimento,
            valorTotalCentavos: assinatura.valorCentavos,
            quantidadeParcelas: 1,
          })

          const compra = await cartaoRepo.createCompraCartao(tx, {
            userId,
            contaId: assinatura.contaId,
            categoriaId: assinatura.categoriaId,
            categoria: assinatura.categoria,
            descricao: assinatura.descricao,
            valorTotalCentavos: assinatura.valorCentavos,
            dataCompra: dataCobranca,
            quantidadeParcelas: 1,
            assinaturaCartaoId: assinatura.id,
          })

          for (const parcela of parcelas) {
            const fatura = await cartaoRepo.findOrCreateFaturaCartao(tx, {
              userId,
              contaId: assinatura.contaId,
              competencia: parcela.competencia,
              dataFechamento: parseUTCDate(parcela.dataFechamento),
              dataVencimento: parseUTCDate(parcela.dataVencimento),
            })

            const parcelaCartao = await cartaoRepo.createParcelaCartao(tx, {
              userId,
              compraCartaoId: compra.id,
              faturaCartaoId: fatura.id,
              numero: parcela.numero,
              totalParcelas: parcela.totalParcelas,
              valorCentavos: parcela.valorCentavos,
              competencia: parcela.competencia,
              dataVencimento: parseUTCDate(parcela.dataVencimento),
            })

            const lancamento = await cartaoRepo.createLancamentoForParcelaCartao(tx, {
              userId,
              contaId: assinatura.contaId,
              categoriaId: assinatura.categoriaId,
              categoria: assinatura.categoria,
              descricao: assinatura.descricao,
              valorCentavos: parcela.valorCentavos,
              data: parseUTCDate(parcela.dataVencimento),
              competenciaAt: parcela.competencia,
              compraCartaoId: compra.id,
              faturaCartaoId: fatura.id,
              parcelaCartaoId: parcelaCartao.id,
              numero: parcela.numero,
              totalParcelas: parcela.totalParcelas,
            })

            await cartaoRepo.linkParcelaToLancamento(tx, userId, parcelaCartao.id, lancamento.id)
            await cartaoRepo.incrementFaturaTotal(tx, userId, fatura.id, parcela.valorCentavos)
          }

          await repo.updateAssinaturaCobrancaState(tx, userId, assinatura.id, {
            ultimaCobranca: dataCobranca,
            proximaCobranca: calcularProximaCobranca({
              dataInicio: assinatura.dataInicio,
              dataFim: assinatura.dataFim,
              diaCobranca: assinatura.diaCobranca,
              after: hoje,
            }),
            ultimaCompetencia: competencia,
          })

          comprasCriadas += 1
        } catch (err) {
          if (isUniqueConstraintError(err)) {
            ignoradosPorDuplicidade += 1
            continue
          }
          throw err
        }
      }
    }

    return {
      assinaturasProcessadas: assinaturas.length,
      comprasCriadas,
      ignoradosPorDuplicidade,
    }
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularCompetenciasDevidas(input: {
  dataInicio: Date
  dataFim: Date | null
  diaCobranca: number
  ultimaCompetencia: string | null
  ate: Date
}): Array<{ dataCobranca: Date; competencia: string }> {
  const result: Array<{ dataCobranca: Date; competencia: string }> = []
  const end = input.dataFim && input.dataFim < input.ate ? input.dataFim : input.ate

  let cursor = primeiraCobrancaOnOrAfterStart({
    dataInicio: input.dataInicio,
    diaCobranca: input.diaCobranca,
  })

  while (cursor <= end) {
    const competencia = formatCompetencia(cursor)
    // Só gera se esta competência ainda não foi processada
    if (!input.ultimaCompetencia || competencia > input.ultimaCompetencia) {
      result.push({ dataCobranca: cursor, competencia })
    }
    cursor = addMonthClamped(cursor, 1, input.diaCobranca)
  }

  return result
}

function primeiraCobrancaOnOrAfterStart(input: { dataInicio: Date; diaCobranca: number }): Date {
  let d = createClampedUTCDate(
    input.dataInicio.getUTCFullYear(),
    input.dataInicio.getUTCMonth(),
    input.diaCobranca,
  )
  if (d < input.dataInicio) {
    d = addMonthClamped(d, 1, input.diaCobranca)
  }
  return d
}

function calcularProximaCobranca(input: {
  dataInicio: Date
  dataFim: Date | null
  diaCobranca: number
  after: Date
}): Date | null {
  let cursor = primeiraCobrancaOnOrAfterStart({
    dataInicio: input.dataInicio,
    diaCobranca: input.diaCobranca,
  })
  while (cursor <= input.after) {
    cursor = addMonthClamped(cursor, 1, input.diaCobranca)
  }
  if (input.dataFim && cursor > input.dataFim) return null
  return cursor
}

function addMonthClamped(date: Date, months: number, desiredDay: number): Date {
  return createClampedUTCDate(date.getUTCFullYear(), date.getUTCMonth() + months, desiredDay)
}

function createClampedUTCDate(year: number, zeroBasedMonth: number, desiredDay: number): Date {
  const lastDay = new Date(Date.UTC(year, zeroBasedMonth + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, zeroBasedMonth, Math.min(desiredDay, lastDay)))
}

function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function normalizeUTCDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function formatCompetencia(date: Date): string {
  return date.toISOString().slice(0, 7)
}

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

function assertCreditCartaoConta(
  conta: { tipo: string; diaFechamento: number | null; diaVencimento: number | null } | null,
): asserts conta is { tipo: 'credit'; diaFechamento: number; diaVencimento: number } {
  if (!conta) throw new AssinaturaContaNotFoundError()
  if (conta.tipo !== 'credit') throw new AssinaturaContaInvalidaError()
  if (conta.diaFechamento == null || conta.diaVencimento == null) {
    throw new AssinaturaContaSemConfiguracaoError()
  }
}

// ─── Domain Errors ────────────────────────────────────────────────────────────

export class AssinaturaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Assinatura não encontrada ou acesso negado')
    this.name = 'AssinaturaNotFoundOrForbiddenError'
  }
}

export class AssinaturaContaNotFoundError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Conta cartão não encontrada ou acesso negado')
    this.name = 'AssinaturaContaNotFoundError'
  }
}

export class AssinaturaContaInvalidaError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Assinaturas no cartão precisam de conta do tipo credit')
    this.name = 'AssinaturaContaInvalidaError'
  }
}

export class AssinaturaContaSemConfiguracaoError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Conta cartão precisa ter dia de fechamento e vencimento configurados')
    this.name = 'AssinaturaContaSemConfiguracaoError'
  }
}

export class AssinaturaCategoriaNotFoundError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Categoria não encontrada ou acesso negado')
    this.name = 'AssinaturaCategoriaNotFoundError'
  }
}

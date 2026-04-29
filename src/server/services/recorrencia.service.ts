import { Prisma } from '@prisma/client'
import {
  createRecorrenciaSchema,
  updateRecorrenciaSchema,
} from '@/features/recorrencias/schemas'
import type {
  CreateRecorrenciaInput,
  FrequenciaRecorrencia,
  ProcessarRecorrenciasResult,
  UpdateRecorrenciaInput,
} from '@/features/recorrencias/types'
import * as repo from '@/server/repositories/recorrencia.repository'

export async function listRecorrenciasForUser(userId: string) {
  return repo.listRecorrenciasByUser(userId)
}

export async function createRecorrenciaForUser(
  userId: string,
  input: CreateRecorrenciaInput,
) {
  const validated = createRecorrenciaSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const conta = await repo.findContaForRecorrencia(tx, userId, validated.contaId)
    assertContaRecorrencia(conta)

    const categoria = validated.categoriaId
      ? await repo.findCategoriaForRecorrencia(tx, userId, validated.categoriaId)
      : null
    if (validated.categoriaId && !categoria) throw new CategoriaRecorrenciaNotFoundOrForbiddenError()

    return repo.createRecorrencia(tx, userId, {
      ...validated,
      categoria: categoria?.nome ?? validated.categoria,
      categoriaId: categoria?.id ?? null,
      proximaExecucao: calculateNextOccurrenceAfterToday({
        dataInicio: parseUTCDate(validated.dataInicio),
        dataFim: validated.dataFim ? parseUTCDate(validated.dataFim) : null,
        diaVencimento: validated.diaVencimento,
        frequencia: validated.frequencia,
      }),
    })
  })
}

export async function updateRecorrenciaForUser(
  userId: string,
  id: string,
  input: UpdateRecorrenciaInput,
) {
  const validated = updateRecorrenciaSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const current = await repo.findRecorrenciaByIdTx(tx, userId, id)
    if (!current) throw new RecorrenciaNotFoundOrForbiddenError()

    if (validated.contaId) {
      const conta = await repo.findContaForRecorrencia(tx, userId, validated.contaId)
      assertContaRecorrencia(conta)
    }

    const categoria = validated.categoriaId
      ? await repo.findCategoriaForRecorrencia(tx, userId, validated.categoriaId)
      : null
    if (validated.categoriaId && !categoria) throw new CategoriaRecorrenciaNotFoundOrForbiddenError()

    const nextDataInicio = validated.dataInicio ? parseUTCDate(validated.dataInicio) : current.dataInicio
    const nextDataFim = validated.dataFim === undefined
      ? current.dataFim
      : validated.dataFim
        ? parseUTCDate(validated.dataFim)
        : null
    if (nextDataFim && nextDataFim < nextDataInicio) throw new RecorrenciaInvalidDateRangeError()

    const nextDiaVencimento = validated.diaVencimento ?? current.diaVencimento
    const nextFrequencia = (validated.frequencia ?? current.frequencia) as FrequenciaRecorrencia
    const nextAtiva = validated.ativa ?? current.ativa
    const proximaExecucao = nextAtiva
      ? calculateNextOccurrenceAfterToday({
          dataInicio: nextDataInicio,
          dataFim: nextDataFim,
          diaVencimento: nextDiaVencimento,
          frequencia: nextFrequencia,
        })
      : null

    const result = await repo.updateRecorrencia(tx, userId, id, {
      ...validated,
      categoria: categoria?.nome ?? validated.categoria,
      categoriaId: validated.categoriaId === undefined
        ? undefined
        : categoria?.id ?? null,
      proximaExecucao,
    })
    if (result.count === 0) throw new RecorrenciaNotFoundOrForbiddenError()

    const updated = await repo.findRecorrenciaByIdTx(tx, userId, id)
    if (!updated) throw new RecorrenciaNotFoundOrForbiddenError()
    return updated
  })
}

export async function toggleRecorrenciaForUser(userId: string, id: string) {
  return repo.runInTransaction(async tx => {
    const current = await repo.findRecorrenciaByIdTx(tx, userId, id)
    if (!current) throw new RecorrenciaNotFoundOrForbiddenError()

    const ativa = !current.ativa
    const proximaExecucao = ativa
      ? calculateNextOccurrenceAfterToday({
          dataInicio: current.dataInicio,
          dataFim: current.dataFim,
          diaVencimento: current.diaVencimento,
          frequencia: current.frequencia as FrequenciaRecorrencia,
        })
      : null

    const result = await repo.toggleRecorrenciaAtiva(tx, userId, id, ativa, proximaExecucao)
    if (result.count === 0) throw new RecorrenciaNotFoundOrForbiddenError()

    const updated = await repo.findRecorrenciaByIdTx(tx, userId, id)
    if (!updated) throw new RecorrenciaNotFoundOrForbiddenError()
    return updated
  })
}

export async function processarRecorrencias(
  userId: string,
  options: { hoje?: Date } = {},
): Promise<ProcessarRecorrenciasResult> {
  const hoje = normalizeUTCDate(options.hoje ?? new Date())

  return repo.runInTransaction(async tx => {
    const recorrencias = await repo.listActiveRecorrenciasForProcessing(tx, userId)
    let lancamentosCriados = 0
    let ignoradosPorDuplicidade = 0

    for (const recorrencia of recorrencias) {
      if (recorrencia.conta.tipo === 'credit') continue

      const ocorrencias = calculateDueOccurrencesUntil({
        dataInicio: recorrencia.dataInicio,
        dataFim: recorrencia.dataFim,
        diaVencimento: recorrencia.diaVencimento,
        frequencia: recorrencia.frequencia as FrequenciaRecorrencia,
        ate: hoje,
      })

      for (const ocorrencia of ocorrencias) {
        const existing = await repo.findLancamentoByRecorrenciaCompetencia(
          tx,
          userId,
          recorrencia.id,
          ocorrencia.competenciaAt,
        )
        if (existing) {
          ignoradosPorDuplicidade += 1
          continue
        }

        try {
          await repo.createLancamentoFromRecorrencia(tx, {
            userId,
            contaId: recorrencia.contaId,
            categoriaId: recorrencia.categoriaId,
            descricao: recorrencia.descricao,
            tipo: recorrencia.tipo,
            categoria: recorrencia.categoria,
            valorCentavos: recorrencia.valorCentavos,
            data: ocorrencia.data,
            competenciaAt: ocorrencia.competenciaAt,
            recorrenciaId: recorrencia.id,
          })
          lancamentosCriados += 1
        } catch (err) {
          if (isUniqueConstraintError(err)) {
            ignoradosPorDuplicidade += 1
            continue
          }
          throw err
        }
      }

      const ultimaExecucao = ocorrencias.at(-1)?.data ?? recorrencia.ultimaExecucao
      await repo.updateRecorrenciaExecutionState(tx, userId, recorrencia.id, {
        ultimaExecucao,
        proximaExecucao: calculateNextOccurrenceAfterDate({
          dataInicio: recorrencia.dataInicio,
          dataFim: recorrencia.dataFim,
          diaVencimento: recorrencia.diaVencimento,
          frequencia: recorrencia.frequencia as FrequenciaRecorrencia,
          after: hoje,
        }),
      })
    }

    return {
      recorrenciasProcessadas: recorrencias.length,
      lancamentosCriados,
      ignoradosPorDuplicidade,
    }
  })
}

function assertContaRecorrencia(
  conta: { tipo: string } | null,
): asserts conta is { tipo: string } {
  if (!conta) throw new ContaRecorrenciaNotFoundOrForbiddenError()
  if (conta.tipo === 'credit') throw new ContaRecorrenciaInvalidaError()
}

function calculateDueOccurrencesUntil(input: {
  dataInicio: Date
  dataFim: Date | null
  diaVencimento: number
  frequencia: FrequenciaRecorrencia
  ate: Date
}) {
  const occurrences: Array<{ data: Date; competenciaAt: string }> = []
  const end = input.dataFim && input.dataFim < input.ate ? input.dataFim : input.ate
  let cursor = firstOccurrenceOnOrAfterStart(input)

  while (cursor <= end) {
    occurrences.push({ data: cursor, competenciaAt: formatCompetencia(cursor) })
    cursor = addMonthsClamped(cursor, frequencyMonths(input.frequencia), input.diaVencimento)
  }

  return occurrences
}

function calculateNextOccurrenceAfterToday(input: {
  dataInicio: Date
  dataFim: Date | null
  diaVencimento: number
  frequencia: FrequenciaRecorrencia
}) {
  return calculateNextOccurrenceAfterDate({
    ...input,
    after: normalizeUTCDate(new Date()),
  })
}

function calculateNextOccurrenceAfterDate(input: {
  dataInicio: Date
  dataFim: Date | null
  diaVencimento: number
  frequencia: FrequenciaRecorrencia
  after: Date
}) {
  let cursor = firstOccurrenceOnOrAfterStart(input)
  while (cursor <= input.after) {
    cursor = addMonthsClamped(cursor, frequencyMonths(input.frequencia), input.diaVencimento)
  }
  if (input.dataFim && cursor > input.dataFim) return null
  return cursor
}

function firstOccurrenceOnOrAfterStart(input: {
  dataInicio: Date
  diaVencimento: number
  frequencia: FrequenciaRecorrencia
}) {
  let occurrence = createClampedUTCDate(
    input.dataInicio.getUTCFullYear(),
    input.dataInicio.getUTCMonth(),
    input.diaVencimento,
  )

  if (occurrence < input.dataInicio) {
    occurrence = addMonthsClamped(
      occurrence,
      frequencyMonths(input.frequencia),
      input.diaVencimento,
    )
  }

  return occurrence
}

function frequencyMonths(frequencia: FrequenciaRecorrencia) {
  const map: Record<FrequenciaRecorrencia, number> = {
    MENSAL: 1,
    BIMESTRAL: 2,
    TRIMESTRAL: 3,
    ANUAL: 12,
  }
  return map[frequencia]
}

function addMonthsClamped(date: Date, months: number, desiredDay: number) {
  return createClampedUTCDate(date.getUTCFullYear(), date.getUTCMonth() + months, desiredDay)
}

function createClampedUTCDate(year: number, zeroBasedMonth: number, desiredDay: number) {
  const lastDay = new Date(Date.UTC(year, zeroBasedMonth + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, zeroBasedMonth, Math.min(desiredDay, lastDay)))
}

function parseUTCDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function normalizeUTCDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function formatCompetencia(date: Date) {
  return date.toISOString().slice(0, 7)
}

function isUniqueConstraintError(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export class RecorrenciaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Recorrencia nao encontrada ou acesso negado')
    this.name = 'RecorrenciaNotFoundOrForbiddenError'
  }
}

export class ContaRecorrenciaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Conta nao encontrada ou acesso negado')
    this.name = 'ContaRecorrenciaNotFoundOrForbiddenError'
  }
}

export class ContaRecorrenciaInvalidaError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Recorrencias financeiras nao usam conta do tipo credit')
    this.name = 'ContaRecorrenciaInvalidaError'
  }
}

export class CategoriaRecorrenciaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Categoria nao encontrada ou acesso negado')
    this.name = 'CategoriaRecorrenciaNotFoundOrForbiddenError'
  }
}

export class RecorrenciaInvalidDateRangeError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Data fim deve ser posterior ao inicio')
    this.name = 'RecorrenciaInvalidDateRangeError'
  }
}

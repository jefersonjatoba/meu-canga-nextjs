import {
  createMetaSchema,
  registrarMetaAporteSchema,
  updateMetaSchema,
} from '@/features/metas/schemas'
import type {
  MetaDTO,
  MetaProgressoDTO,
  StatusMeta,
  TipoMeta,
} from '@/features/metas/types'
import type { CreateMetaInput, RegistrarMetaAporteInput, UpdateMetaInput } from '@/features/metas/types'
import * as repo from '@/server/repositories/meta.repository'

type MetaWithAportes = NonNullable<Awaited<ReturnType<typeof repo.findMetaById>>>

export async function listarMetas(userId: string): Promise<MetaDTO[]> {
  const metas = await repo.listMetasByUser(userId)
  return metas.map(toMetaDTO)
}

export async function obterMeta(userId: string, id: string): Promise<MetaDTO> {
  const meta = await repo.findMetaById(userId, id)
  if (!meta) throw new MetaNotFoundOrForbiddenError()
  return toMetaDTO(meta)
}

export async function criarMeta(userId: string, input: CreateMetaInput): Promise<MetaDTO> {
  const validated = createMetaSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const meta = await repo.createMeta(tx, userId, validated)
    return toMetaDTO(meta)
  })
}

export async function atualizarMeta(
  userId: string,
  id: string,
  input: UpdateMetaInput,
): Promise<MetaDTO> {
  const validated = updateMetaSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const current = await repo.findMetaByIdTx(tx, userId, id)
    if (!current) throw new MetaNotFoundOrForbiddenError()

    const nextDataInicio = validated.dataInicio ? parseUTCDate(validated.dataInicio) : current.dataInicio
    const nextDataAlvo = validated.dataAlvo === undefined
      ? current.dataAlvo
      : validated.dataAlvo
        ? parseUTCDate(validated.dataAlvo)
        : null
    if (nextDataAlvo && nextDataAlvo < nextDataInicio) throw new MetaInvalidDateRangeError()

    const currentProgress = calcularProgresso({
      valorInicialCentavos: validated.valorInicialCentavos ?? current.valorInicialCentavos,
      valorAlvoCentavos: validated.valorAlvoCentavos ?? current.valorAlvoCentavos,
      aportes: current.aportes,
    })

    const nextValorAlvoCentavos = validated.valorAlvoCentavos ?? current.valorAlvoCentavos
    const result = await repo.updateMeta(tx, userId, id, {
      ...validated,
      valorAtualCentavos: currentProgress.progressoCentavos,
      status: normalizeStatus(current.status) === 'concluida' && currentProgress.progressoCentavos < nextValorAlvoCentavos
        ? 'ativa'
        : undefined,
    })
    if (result.count === 0) throw new MetaNotFoundOrForbiddenError()

    const updated = await repo.findMetaByIdTx(tx, userId, id)
    if (!updated) throw new MetaNotFoundOrForbiddenError()
    return toMetaDTO(updated)
  })
}

export async function toggleMeta(userId: string, id: string): Promise<MetaDTO> {
  return repo.runInTransaction(async tx => {
    const meta = await repo.findMetaByIdTx(tx, userId, id)
    if (!meta) throw new MetaNotFoundOrForbiddenError()

    const status = normalizeStatus(meta.status)
    if (status === 'cancelada' || status === 'concluida') throw new MetaInvalidStateError()

    const nextStatus: StatusMeta = status === 'ativa' ? 'pausada' : 'ativa'
    const progress = calcularProgresso(meta)
    const result = await repo.updateMetaStatus(tx, userId, id, nextStatus, progress.progressoCentavos)
    if (result.count === 0) throw new MetaNotFoundOrForbiddenError()

    const updated = await repo.findMetaByIdTx(tx, userId, id)
    if (!updated) throw new MetaNotFoundOrForbiddenError()
    return toMetaDTO(updated)
  })
}

export async function registrarAporte(
  userId: string,
  metaId: string,
  input: RegistrarMetaAporteInput,
): Promise<MetaDTO> {
  const validated = registrarMetaAporteSchema.parse(input)

  return repo.runInTransaction(async tx => {
    const meta = await repo.findMetaByIdTx(tx, userId, metaId)
    if (!meta) throw new MetaNotFoundOrForbiddenError()
    if (normalizeStatus(meta.status) === 'cancelada') throw new MetaInvalidStateError()

    if (validated.contaId) {
      const conta = await repo.findContaForMetaAporte(tx, userId, validated.contaId)
      if (!conta) throw new ContaMetaNotFoundOrForbiddenError()
      if (conta.tipo === 'credit') throw new ContaMetaInvalidaError()
    }

    await repo.createMetaAporte(tx, userId, metaId, validated)

    const updated = await repo.findMetaByIdTx(tx, userId, metaId)
    if (!updated) throw new MetaNotFoundOrForbiddenError()

    const progress = calcularProgresso(updated)
    const status = progress.progressoCentavos >= updated.valorAlvoCentavos
      ? 'concluida'
      : normalizeStatus(updated.status) === 'concluida'
        ? 'ativa'
        : normalizeStatus(updated.status)

    await repo.updateMetaStatus(tx, userId, metaId, status, progress.progressoCentavos)

    const finalMeta = await repo.findMetaByIdTx(tx, userId, metaId)
    if (!finalMeta) throw new MetaNotFoundOrForbiddenError()
    return toMetaDTO(finalMeta)
  })
}

export async function cancelarAporte(
  userId: string,
  metaId: string,
  aporteId: string,
): Promise<MetaDTO> {
  return repo.runInTransaction(async tx => {
    const meta = await repo.findMetaByIdTx(tx, userId, metaId)
    if (!meta) throw new MetaNotFoundOrForbiddenError()

    const aporte = await repo.findMetaAporteById(tx, userId, metaId, aporteId)
    if (!aporte) throw new MetaAporteNotFoundOrForbiddenError()
    if (aporte.status === 'cancelado') throw new MetaAporteInvalidStateError()

    const result = await repo.updateMetaAporteStatus(tx, userId, metaId, aporteId, 'cancelado')
    if (result.count === 0) throw new MetaAporteNotFoundOrForbiddenError()

    const updated = await repo.findMetaByIdTx(tx, userId, metaId)
    if (!updated) throw new MetaNotFoundOrForbiddenError()

    const progress = calcularProgresso(updated)
    const status = normalizeStatus(updated.status) === 'concluida' && progress.progressoCentavos < updated.valorAlvoCentavos
      ? 'ativa'
      : normalizeStatus(updated.status)
    await repo.updateMetaStatus(tx, userId, metaId, status, progress.progressoCentavos)

    const finalMeta = await repo.findMetaByIdTx(tx, userId, metaId)
    if (!finalMeta) throw new MetaNotFoundOrForbiddenError()
    return toMetaDTO(finalMeta)
  })
}

export function calcularProgresso(input: {
  valorInicialCentavos: number
  valorAlvoCentavos: number
  aportes: Array<{ valorCentavos: number; status: string }>
}): MetaProgressoDTO {
  const aportesConfirmadosCentavos = input.aportes
    .filter(aporte => aporte.status === 'confirmado')
    .reduce((acc, aporte) => acc + aporte.valorCentavos, 0)
  const progressoCentavos = input.valorInicialCentavos + aportesConfirmadosCentavos
  const valorRestanteCentavos = Math.max(0, input.valorAlvoCentavos - progressoCentavos)
  const percentual = input.valorAlvoCentavos > 0
    ? Math.min(100, Math.round((progressoCentavos / input.valorAlvoCentavos) * 10_000) / 100)
    : 0

  return {
    valorInicialCentavos: input.valorInicialCentavos,
    aportesConfirmadosCentavos,
    progressoCentavos,
    valorRestanteCentavos,
    percentual,
  }
}

function toMetaDTO(meta: MetaWithAportes): MetaDTO {
  const progresso = calcularProgresso(meta)

  return {
    id: meta.id,
    userId: meta.userId,
    descricao: meta.descricao,
    categoria: meta.categoria,
    tipo: normalizeTipo(meta.tipo),
    valorAlvoCentavos: meta.valorAlvoCentavos,
    valorAtualCentavos: meta.valorAtualCentavos,
    valorInicialCentavos: meta.valorInicialCentavos,
    dataInicio: meta.dataInicio.toISOString(),
    dataAlvo: meta.dataAlvo?.toISOString() ?? null,
    status: normalizeStatus(meta.status),
    cor: meta.cor,
    icone: meta.icone,
    ordem: meta.ordem,
    createdAt: meta.createdAt.toISOString(),
    updatedAt: meta.updatedAt.toISOString(),
    aportes: meta.aportes.map(aporte => ({
      id: aporte.id,
      userId: aporte.userId,
      metaId: aporte.metaId,
      contaId: aporte.contaId,
      valorCentavos: aporte.valorCentavos,
      dataAporte: aporte.dataAporte.toISOString(),
      descricao: aporte.descricao,
      status: aporte.status === 'cancelado' ? 'cancelado' : 'confirmado',
      createdAt: aporte.createdAt.toISOString(),
      updatedAt: aporte.updatedAt.toISOString(),
      conta: aporte.conta,
    })),
    progresso,
  }
}

function normalizeTipo(tipo: string): TipoMeta {
  if (tipo === 'investimento' || tipo === 'outro') return tipo
  return 'poupanca'
}

function normalizeStatus(status: string): StatusMeta {
  if (status === 'pausada' || status === 'concluida' || status === 'cancelada') return status
  return 'ativa'
}

function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export class MetaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Meta nao encontrada ou acesso negado')
    this.name = 'MetaNotFoundOrForbiddenError'
  }
}

export class MetaAporteNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Aporte da meta nao encontrado ou acesso negado')
    this.name = 'MetaAporteNotFoundOrForbiddenError'
  }
}

export class ContaMetaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Conta nao encontrada ou acesso negado')
    this.name = 'ContaMetaNotFoundOrForbiddenError'
  }
}

export class ContaMetaInvalidaError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Aporte de meta nao aceita conta do tipo credit')
    this.name = 'ContaMetaInvalidaError'
  }
}

export class MetaInvalidDateRangeError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Data alvo deve ser posterior ao inicio')
    this.name = 'MetaInvalidDateRangeError'
  }
}

export class MetaInvalidStateError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Meta nao permite esta operacao neste estado')
    this.name = 'MetaInvalidStateError'
  }
}

export class MetaAporteInvalidStateError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Aporte nao permite esta operacao neste estado')
    this.name = 'MetaAporteInvalidStateError'
  }
}

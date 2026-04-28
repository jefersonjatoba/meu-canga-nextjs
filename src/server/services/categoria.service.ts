import { ZodError } from 'zod'
import {
  categoriaFiltersSchema,
  createCategoriaSchema,
  updateCategoriaSchema,
} from '@/features/categorias/schemas'
import type {
  CategoriaFilters,
  CreateCategoriaInput,
  UpdateCategoriaInput,
} from '@/features/categorias/types'
import * as repo from '@/server/repositories/categoria.repository'

export async function listCategoriasForUser(
  userId: string,
  rawFilters: CategoriaFilters,
) {
  const filters = categoriaFiltersSchema.parse(rawFilters)
  return repo.listCategoriasByUser(userId, filters)
}

export async function createCategoriaForUser(
  userId: string,
  input: CreateCategoriaInput,
) {
  const validated = createCategoriaSchema.parse(input)
  await assertCategoriaNameAvailable(userId, validated.nome, validated.tipo)
  return repo.createCategoria(userId, validated)
}

export async function updateCategoriaForUser(
  userId: string,
  id: string,
  input: UpdateCategoriaInput,
) {
  const current = await repo.findCategoriaById(userId, id)
  if (!current) throw new CategoriaNotFoundOrForbiddenError()

  const validated = updateCategoriaSchema.parse(input)
  const nextNome = validated.nome ?? current.nome
  const nextTipo = validated.tipo ?? current.tipo

  if (nextNome !== current.nome || nextTipo !== current.tipo) {
    await assertCategoriaNameAvailable(userId, nextNome, nextTipo, id)
  }

  const result = await repo.updateCategoria(userId, id, validated)
  if (result.count === 0) throw new CategoriaNotFoundOrForbiddenError()

  const updated = await repo.findCategoriaById(userId, id)
  if (!updated) throw new CategoriaNotFoundOrForbiddenError()
  return updated
}

export async function ensureCategoriaBelongsToUser(
  userId: string,
  categoriaId: string | null | undefined,
) {
  if (!categoriaId) return null

  const categoria = await repo.findCategoriaForLancamento(userId, categoriaId)
  if (!categoria) throw new CategoriaNotFoundOrForbiddenError()
  return categoria
}

async function assertCategoriaNameAvailable(
  userId: string,
  nome: string,
  tipo: string,
  currentId?: string,
) {
  const duplicate = await repo.findCategoriaByNameAndType(userId, nome, tipo)
  if (duplicate && duplicate.id !== currentId) throw new CategoriaAlreadyExistsError()
}

export class CategoriaAlreadyExistsError extends Error {
  readonly statusCode = 409

  constructor() {
    super('Categoria ja existe para este tipo')
    this.name = 'CategoriaAlreadyExistsError'
  }
}

export class CategoriaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404

  constructor() {
    super('Categoria nao encontrada ou acesso negado')
    this.name = 'CategoriaNotFoundOrForbiddenError'
  }
}

export function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}

import { prisma } from '@/lib/prisma'
import type {
  CategoriaFiltersSchema,
  CreateCategoriaSchema,
  UpdateCategoriaSchema,
} from '@/features/categorias/schemas'

const categoriaSelect = {
  id: true,
  nome: true,
  tipo: true,
  icone: true,
  cor: true,
  ativa: true,
  ordem: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function listCategoriasByUser(
  userId: string,
  filters: CategoriaFiltersSchema,
) {
  return prisma.categoria.findMany({
    where: {
      userId,
      tipo: filters.tipo,
      ativa: filters.includeInactive ? undefined : true,
    },
    select: categoriaSelect,
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
  })
}

export async function createCategoria(
  userId: string,
  data: CreateCategoriaSchema,
) {
  return prisma.categoria.create({
    data: {
      userId,
      nome: data.nome,
      tipo: data.tipo,
      icone: data.icone,
      cor: data.cor,
      ordem: data.ordem,
    },
    select: categoriaSelect,
  })
}

export async function findCategoriaById(userId: string, id: string) {
  return prisma.categoria.findFirst({
    where: { id, userId },
    select: categoriaSelect,
  })
}

export async function findCategoriaByNameAndType(
  userId: string,
  nome: string,
  tipo: string,
) {
  return prisma.categoria.findFirst({
    where: { userId, nome, tipo },
    select: { id: true },
  })
}

export async function updateCategoria(
  userId: string,
  id: string,
  data: UpdateCategoriaSchema,
) {
  return prisma.categoria.updateMany({
    where: { id, userId },
    data,
  })
}

export async function findCategoriaForLancamento(userId: string, id: string) {
  return prisma.categoria.findFirst({
    where: { id, userId, ativa: true },
    select: { id: true, nome: true, tipo: true },
  })
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

vi.mock('@/server/repositories/categoria.repository', () => ({
  listCategoriasByUser: vi.fn(),
  createCategoria: vi.fn(),
  findCategoriaById: vi.fn(),
  findCategoriaByNameAndType: vi.fn(),
  updateCategoria: vi.fn(),
  findCategoriaForLancamento: vi.fn(),
}))

import * as repo from '@/server/repositories/categoria.repository'
import {
  CategoriaAlreadyExistsError,
  CategoriaNotFoundOrForbiddenError,
  createCategoriaForUser,
  ensureCategoriaBelongsToUser,
  listCategoriasForUser,
  updateCategoriaForUser,
} from '@/server/services/categoria.service'

const USER_A = 'user_aaa'
const USER_B = 'user_bbb'
const CATEGORIA_ID = 'cat_111'

const categoria = {
  id: CATEGORIA_ID,
  nome: 'Moradia',
  tipo: 'expense',
  icone: null,
  cor: '#ef4444',
  ativa: true,
  ordem: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listCategoriasForUser', () => {
  it('lista categorias do usuario com filtros validados', async () => {
    vi.mocked(repo.listCategoriasByUser).mockResolvedValue([categoria] as never)

    const result = await listCategoriasForUser(USER_A, { tipo: 'expense' })

    expect(repo.listCategoriasByUser).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ tipo: 'expense', includeInactive: false }),
    )
    expect(result).toEqual([categoria])
  })
})

describe('createCategoriaForUser', () => {
  it('cria categoria sem aceitar userId do client', async () => {
    vi.mocked(repo.findCategoriaByNameAndType).mockResolvedValue(null)
    vi.mocked(repo.createCategoria).mockResolvedValue(categoria as never)

    await expect(
      createCategoriaForUser(USER_A, {
        nome: 'Moradia',
        tipo: 'expense',
        userId: USER_B,
      } as never),
    ).rejects.toThrow(ZodError)

    expect(repo.createCategoria).not.toHaveBeenCalled()
  })

  it('cria categoria valida usando userId da sessao', async () => {
    vi.mocked(repo.findCategoriaByNameAndType).mockResolvedValue(null)
    vi.mocked(repo.createCategoria).mockResolvedValue(categoria as never)

    const result = await createCategoriaForUser(USER_A, {
      nome: ' Moradia ',
      tipo: 'expense',
      cor: '#ef4444',
    })

    expect(repo.findCategoriaByNameAndType).toHaveBeenCalledWith(USER_A, 'Moradia', 'expense')
    expect(repo.createCategoria).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ nome: 'Moradia', tipo: 'expense' }),
    )
    expect(result).toEqual(categoria)
  })

  it('rejeita duplicidade por usuario, nome e tipo', async () => {
    vi.mocked(repo.findCategoriaByNameAndType).mockResolvedValue({ id: CATEGORIA_ID })

    await expect(
      createCategoriaForUser(USER_A, { nome: 'Moradia', tipo: 'expense' }),
    ).rejects.toThrow(CategoriaAlreadyExistsError)

    expect(repo.createCategoria).not.toHaveBeenCalled()
  })
})

describe('updateCategoriaForUser', () => {
  it('edita categoria do usuario', async () => {
    vi.mocked(repo.findCategoriaById)
      .mockResolvedValueOnce(categoria as never)
      .mockResolvedValueOnce({ ...categoria, nome: 'Casa' } as never)
    vi.mocked(repo.findCategoriaByNameAndType).mockResolvedValue(null)
    vi.mocked(repo.updateCategoria).mockResolvedValue({ count: 1 })

    const result = await updateCategoriaForUser(USER_A, CATEGORIA_ID, { nome: 'Casa' })

    expect(repo.updateCategoria).toHaveBeenCalledWith(
      USER_A,
      CATEGORIA_ID,
      expect.objectContaining({ nome: 'Casa' }),
    )
    expect(result.nome).toBe('Casa')
  })

  it('desativa sem delete fisico', async () => {
    vi.mocked(repo.findCategoriaById)
      .mockResolvedValueOnce(categoria as never)
      .mockResolvedValueOnce({ ...categoria, ativa: false } as never)
    vi.mocked(repo.updateCategoria).mockResolvedValue({ count: 1 })

    const result = await updateCategoriaForUser(USER_A, CATEGORIA_ID, { ativa: false })

    expect(repo.updateCategoria).toHaveBeenCalledWith(
      USER_A,
      CATEGORIA_ID,
      expect.objectContaining({ ativa: false }),
    )
    expect(result.ativa).toBe(false)
  })

  it('bloqueia acesso entre usuarios', async () => {
    vi.mocked(repo.findCategoriaById).mockResolvedValue(null)

    await expect(
      updateCategoriaForUser(USER_B, CATEGORIA_ID, { nome: 'Outro' }),
    ).rejects.toThrow(CategoriaNotFoundOrForbiddenError)

    expect(repo.updateCategoria).not.toHaveBeenCalled()
  })
})

describe('ensureCategoriaBelongsToUser', () => {
  it('retorna null quando categoriaId nao foi enviado', async () => {
    await expect(ensureCategoriaBelongsToUser(USER_A, undefined)).resolves.toBeNull()
    expect(repo.findCategoriaForLancamento).not.toHaveBeenCalled()
  })

  it('retorna categoria ativa do usuario', async () => {
    vi.mocked(repo.findCategoriaForLancamento).mockResolvedValue({
      id: CATEGORIA_ID,
      nome: 'Moradia',
      tipo: 'expense',
    } as never)

    await expect(ensureCategoriaBelongsToUser(USER_A, CATEGORIA_ID)).resolves.toEqual({
      id: CATEGORIA_ID,
      nome: 'Moradia',
      tipo: 'expense',
    })
  })

  it('rejeita categoria inexistente ou de outro usuario', async () => {
    vi.mocked(repo.findCategoriaForLancamento).mockResolvedValue(null)

    await expect(
      ensureCategoriaBelongsToUser(USER_B, CATEGORIA_ID),
    ).rejects.toThrow(CategoriaNotFoundOrForbiddenError)
  })
})

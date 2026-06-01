import { describe, expect, it } from 'vitest'
import {
  buildCategoryOptions,
  getSuggestedCategoryNames,
  normalizeCategoryName,
  OUTROS_CATEGORIA,
  resolveCategorySelection,
  resolveInitialCategoryValue,
} from '@/lib/categories'
import type { CategoriaDTO } from '@/features/categorias/types'

const categoriasUsuario: CategoriaDTO[] = [
  {
    id: 'cat_streaming',
    nome: 'Streaming',
    tipo: 'expense',
    ativa: true,
    ordem: 0,
  },
  {
    id: 'cat_pet',
    nome: 'Pet',
    tipo: 'expense',
    ativa: true,
    ordem: 1,
  },
]

describe('categories lib', () => {
  it('expoe categorias sugeridas de despesa esperadas', () => {
    const categorias = getSuggestedCategoryNames('expense')

    expect(categorias).toContain('Moradia')
    expect(categorias).toContain('Saude')
    expect(categorias).toContain('Streaming')
    expect(categorias).toContain('Assinaturas')
  })

  it('combina categorias do usuario com categorias padrao sem duplicar nomes equivalentes', () => {
    const options = buildCategoryOptions(categoriasUsuario, 'expense')

    expect(options.find(option => option.value === 'cat_streaming')?.label).toBe('Streaming')
    expect(options.filter(option => option.nome === 'Streaming')).toHaveLength(1)
    expect(options.some(option => option.nome === 'Moradia')).toBe(true)
    expect(options.some(option => option.nome === 'Pet')).toBe(true)
  })

  it('resolve categoria manual quando usuario escolhe Outros', () => {
    const resolved = resolveCategorySelection(categoriasUsuario, OUTROS_CATEGORIA, 'Seguro viagem')

    expect(resolved).toEqual({
      categoriaId: null,
      categoria: 'Seguro viagem',
    })
  })

  it('resolve categoria padrao sem exigir categoriaId salvo no banco', () => {
    const options = buildCategoryOptions([], 'income')
    const salario = options.find(option => option.nome === 'Salario')

    expect(salario).toBeDefined()
    expect(resolveCategorySelection([], salario?.value ?? '', '')).toEqual({
      categoriaId: null,
      categoria: 'Salario',
    })
  })

  it('reconhece categoria padrao ao montar estado inicial de edicao', () => {
    const initial = resolveInitialCategoryValue([], null, 'Alimentacao', 'expense')

    expect(initial.categoriaId).not.toBe(OUTROS_CATEGORIA)
    expect(initial.categoriaManual).toBe('')
  })

  it('normaliza nomes para evitar duplicidade por acento ou emoji legado', () => {
    expect(normalizeCategoryName('💼 Salario')).toBe('salario')
    expect(normalizeCategoryName('Saúde')).toBe('saude')
  })
})

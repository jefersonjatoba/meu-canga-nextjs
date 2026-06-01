import type { CategoriaDTO, TipoCategoria } from '@/features/categorias/types'

export const OUTROS_CATEGORIA = '__outros__'
export const SUGESTAO_CATEGORIA_PREFIX = '__sugestao__:'

type SuggestedCategory = {
  key: string
  nome: string
  tipo: TipoCategoria
}

export type CategoryOption = {
  value: string
  label: string
  nome: string
  categoriaId: string | null
  source: 'user' | 'default'
}

const DEFAULT_CATEGORIES: readonly SuggestedCategory[] = [
  { key: 'salario', nome: 'Salario', tipo: 'income' },
  { key: 'renda-extra', nome: 'Renda extra', tipo: 'income' },
  { key: 'aluguel-recebido', nome: 'Aluguel Recebido', tipo: 'income' },
  { key: 'bonus', nome: 'Bonus', tipo: 'income' },
  { key: 'freelance', nome: 'Freelance', tipo: 'income' },
  { key: 'investimentos', nome: 'Investimentos', tipo: 'income' },
  { key: 'moradia', nome: 'Moradia', tipo: 'expense' },
  { key: 'alimentacao', nome: 'Alimentacao', tipo: 'expense' },
  { key: 'combustivel', nome: 'Combustivel', tipo: 'expense' },
  { key: 'saude', nome: 'Saude', tipo: 'expense' },
  { key: 'telefonia-internet', nome: 'Telefonia/Internet', tipo: 'expense' },
  { key: 'energia-agua', nome: 'Energia/Agua', tipo: 'expense' },
  { key: 'lazer', nome: 'Lazer', tipo: 'expense' },
  { key: 'educacao', nome: 'Educacao', tipo: 'expense' },
  { key: 'vestuario', nome: 'Vestuario', tipo: 'expense' },
  { key: 'transporte', nome: 'Transporte', tipo: 'expense' },
  { key: 'cartao-parcelas', nome: 'Cartao/Parcelas', tipo: 'expense' },
  { key: 'streaming', nome: 'Streaming', tipo: 'expense' },
  { key: 'assinaturas', nome: 'Assinaturas', tipo: 'expense' },
  { key: 'academia', nome: 'Academia', tipo: 'expense' },
] as const

function matchesTipo(categoryTipo: TipoCategoria, selectedTipo?: TipoCategoria) {
  return !selectedTipo || categoryTipo === selectedTipo || categoryTipo === 'both'
}

export function normalizeCategoryName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^[^A-Za-z0-9]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function getDefaultCategories(tipo?: TipoCategoria) {
  return DEFAULT_CATEGORIES.filter(category => matchesTipo(category.tipo, tipo))
}

export function getSuggestedCategoryNames(tipo?: TipoCategoria) {
  return getDefaultCategories(tipo).map(category => category.nome)
}

export function buildCategoryOptions(categorias: CategoriaDTO[], tipo?: TipoCategoria): CategoryOption[] {
  const options: CategoryOption[] = []
  const seen = new Set<string>()

  for (const categoria of categorias) {
    if (!matchesTipo(categoria.tipo, tipo)) continue

    const normalized = normalizeCategoryName(categoria.nome)
    if (seen.has(normalized)) continue

    seen.add(normalized)
    options.push({
      value: categoria.id,
      label: categoria.nome,
      nome: categoria.nome,
      categoriaId: categoria.id,
      source: 'user',
    })
  }

  for (const category of getDefaultCategories(tipo)) {
    const normalized = normalizeCategoryName(category.nome)
    if (seen.has(normalized)) continue

    seen.add(normalized)
    options.push({
      value: `${SUGESTAO_CATEGORIA_PREFIX}${category.key}`,
      label: category.nome,
      nome: category.nome,
      categoriaId: null,
      source: 'default',
    })
  }

  return options
}

export function resolveCategorySelection(
  categorias: CategoriaDTO[],
  selectedValue: string,
  manualValue: string,
) {
  if (selectedValue === OUTROS_CATEGORIA) {
    const nome = manualValue.trim()
    return nome ? { categoriaId: null, categoria: nome } : null
  }

  const option = buildCategoryOptions(categorias).find(item => item.value === selectedValue)
  if (!option) return null

  return {
    categoriaId: option.categoriaId,
    categoria: option.nome,
  }
}

export function resolveInitialCategoryValue(
  categorias: CategoriaDTO[],
  categoriaId: string | null | undefined,
  categoriaNome: string | null | undefined,
  tipo?: TipoCategoria,
) {
  const nome = categoriaNome?.trim() ?? ''

  if (categoriaId && categorias.some(categoria => categoria.id === categoriaId)) {
    return { categoriaId, categoriaManual: '' }
  }

  if (!nome) {
    return { categoriaId: '', categoriaManual: '' }
  }

  const option = buildCategoryOptions(categorias, tipo).find(
    item => normalizeCategoryName(item.nome) === normalizeCategoryName(nome),
  )

  if (option) {
    return { categoriaId: option.value, categoriaManual: '' }
  }

  return { categoriaId: OUTROS_CATEGORIA, categoriaManual: nome }
}

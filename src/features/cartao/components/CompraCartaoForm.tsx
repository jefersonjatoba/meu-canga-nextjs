'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/features/lancamentos/components/MoneyInput'
import { resolveCategorySelection } from '@/lib/categories'
import { toCents } from '@/lib/money'
import type { CategoriaDTO } from '@/features/categorias/types'
import type { ContaDTO } from '@/features/contas/types'
import { criarCompraCartao } from '../api'

const formSchema = z.object({
  contaId: z.string().min(1, 'Selecione um cartão'),
  descricao: z.string().trim().min(1, 'Descrição obrigatória').max(255, 'Descrição muito longa'),
  valorDisplay: z.string().min(1, 'Valor obrigatório'),
  dataCompra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  quantidadeParcelas: z.coerce.number().int().min(1, 'Mínimo de 1 parcela').max(360, 'Parcelas demais'),
})

type FormValues = z.infer<typeof formSchema>

interface CompraCartaoFormProps {
  cartoes: ContaDTO[]
  categorias: CategoriaDTO[]
  onSuccess: () => void
  onCancel: () => void
}

export function CompraCartaoForm({
  cartoes,
  categorias,
  onSuccess,
  onCancel,
}: CompraCartaoFormProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [categoriaId, setCategoriaId] = useState('')
  const [categoriaManual, setCategoriaManual] = useState('')
  const [categoriaError, setCategoriaError] = useState<string | undefined>()
  const hoje = new Date().toISOString().slice(0, 10)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contaId: cartoes[0]?.id ?? '',
      descricao: '',
      valorDisplay: '',
      dataCompra: hoje,
      quantidadeParcelas: 1,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    setCategoriaError(undefined)

    const categoriaResolvida = resolveCategorySelection(categorias, categoriaId, categoriaManual)

    if (!categoriaResolvida) {
      setCategoriaError('Informe uma categoria')
      return
    }

    try {
      const valorTotalCentavos = toCents(values.valorDisplay.replace(',', '.'))
      if (valorTotalCentavos <= 0) throw new Error('Valor deve ser maior que zero')

      await criarCompraCartao({
        contaId: values.contaId,
        descricao: values.descricao,
        categoriaId: categoriaResolvida.categoriaId ?? undefined,
        categoria: categoriaResolvida.categoria,
        valorTotalCentavos,
        dataCompra: values.dataCompra,
        quantidadeParcelas: values.quantidadeParcelas,
      })

      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao registrar compra')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cartão <span className="text-red-500" aria-hidden>*</span>
          </label>
          <select
            {...register('contaId')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/[0.10] dark:bg-[#1C1C1C] dark:text-gray-100"
          >
            {cartoes.map(cartao => (
              <option key={cartao.id} value={cartao.id}>{cartao.nome}</option>
            ))}
          </select>
          {errors.contaId && <p role="alert" className="text-xs text-red-600">{errors.contaId.message}</p>}
        </div>

        <Input
          label="Data da compra"
          type="date"
          required
          error={errors.dataCompra?.message}
          {...register('dataCompra')}
        />
      </div>

      <Input
        label="Descrição"
        required
        placeholder="Ex.: Mercado, passagem, equipamento"
        error={errors.descricao?.message}
        {...register('descricao')}
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          Compra recorrente como Netflix, Spotify ou academia?
        </p>
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          Use Assinaturas para cobrar todo mês no cartão certo e acompanhar o impacto na fatura.
        </p>
        <Link
          href="/dashboard/cartoes/assinaturas"
          onClick={onCancel}
          className="mt-3 inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-400 hover:text-blue-800 dark:border-blue-800 dark:bg-transparent dark:text-blue-300 dark:hover:border-blue-700"
        >
          Cadastrar assinatura recorrente
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="valorDisplay"
          control={control}
          render={({ field }) => (
            <MoneyInput
              label="Valor total"
              required
              error={errors.valorDisplay?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Input
          label="Parcelas"
          type="number"
          min={1}
          max={360}
          required
          error={errors.quantidadeParcelas?.message}
          {...register('quantidadeParcelas')}
        />
      </div>

      <CategorySelect
        categorias={categorias}
        tipo="expense"
        categoriaId={categoriaId}
        categoriaManual={categoriaManual}
        onCategoriaIdChange={(id) => { setCategoriaId(id); setCategoriaError(undefined) }}
        onCategoriaManualChange={(nome) => { setCategoriaManual(nome); setCategoriaError(undefined) }}
        required
        errorManual={categoriaError}
      />

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Adicionando...">
          Adicionar compra no cartão
        </Button>
      </div>
    </form>
  )
}

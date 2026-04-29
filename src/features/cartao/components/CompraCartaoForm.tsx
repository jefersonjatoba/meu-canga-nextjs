'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/features/lancamentos/components/MoneyInput'
import { toCents } from '@/lib/money'
import type { CategoriaDTO } from '@/features/categorias/types'
import type { ContaDTO } from '@/features/contas/types'
import { criarCompraCartao } from '../api'

const formSchema = z.object({
  contaId: z.string().min(1, 'Selecione um cartao'),
  descricao: z.string().trim().min(1, 'Descricao obrigatoria').max(255, 'Descricao muito longa'),
  categoriaId: z.string().optional(),
  categoriaManual: z.string().trim().max(100, 'Categoria muito longa').optional(),
  valorDisplay: z.string().min(1, 'Valor obrigatorio'),
  dataCompra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida'),
  quantidadeParcelas: z.coerce.number().int().min(1, 'Minimo de 1 parcela').max(360, 'Parcelas demais'),
}).refine(
  data => !!data.categoriaId || !!data.categoriaManual?.trim(),
  { path: ['categoriaManual'], message: 'Informe uma categoria' },
)

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
  const categoriasDespesa = categorias.filter(c => c.tipo === 'expense' || c.tipo === 'both')
  const hoje = new Date().toISOString().slice(0, 10)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contaId: cartoes[0]?.id ?? '',
      descricao: '',
      categoriaId: categoriasDespesa[0]?.id ?? '',
      categoriaManual: '',
      valorDisplay: '',
      dataCompra: hoje,
      quantidadeParcelas: 1,
    },
  })

  const categoriaId = watch('categoriaId')

  const onSubmit = async (values: FormValues) => {
    setApiError(null)

    try {
      const valorTotalCentavos = toCents(values.valorDisplay.replace(',', '.'))
      if (valorTotalCentavos <= 0) throw new Error('Valor deve ser maior que zero')

      const categoriaSelecionada = categoriasDespesa.find(c => c.id === values.categoriaId)
      const categoriaFallback = categoriaSelecionada?.nome ?? values.categoriaManual?.trim() ?? ''

      await criarCompraCartao({
        contaId: values.contaId,
        descricao: values.descricao,
        categoriaId: categoriaSelecionada?.id ?? undefined,
        categoria: categoriaFallback,
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
            Cartao <span className="text-red-500" aria-hidden>*</span>
          </label>
          <select
            {...register('contaId')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
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
        label="Descricao"
        required
        placeholder="Ex.: Mercado, passagem, equipamento"
        error={errors.descricao?.message}
        {...register('descricao')}
      />

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
          <select
            {...register('categoriaId')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
          >
            <option value="">Manual</option>
            {categoriasDespesa.map(categoria => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
        </div>

        <Input
          label="Categoria manual"
          placeholder="Obrigatoria se categoria = Manual"
          disabled={!!categoriaId}
          error={errors.categoriaManual?.message}
          {...register('categoriaManual')}
        />
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Registrando...">
          Registrar compra
        </Button>
      </div>
    </form>
  )
}

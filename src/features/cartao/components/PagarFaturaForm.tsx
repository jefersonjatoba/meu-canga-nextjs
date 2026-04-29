'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/features/lancamentos/components/MoneyInput'
import { formatBRL, toCents } from '@/lib/money'
import type { ContaDTO } from '@/features/contas/types'
import { pagarFaturaCartao } from '../api'
import type { FaturaCartaoDTO } from '../types'

const formSchema = z.object({
  contaPagamentoId: z.string().min(1, 'Selecione uma conta'),
  valorDisplay: z.string().min(1, 'Valor obrigatorio'),
  dataPagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida'),
})

type FormValues = z.infer<typeof formSchema>

interface PagarFaturaFormProps {
  fatura: FaturaCartaoDTO
  contasPagamento: ContaDTO[]
  onSuccess: () => void
  onCancel: () => void
}

export function PagarFaturaForm({
  fatura,
  contasPagamento,
  onSuccess,
  onCancel,
}: PagarFaturaFormProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const hoje = new Date().toISOString().slice(0, 10)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contaPagamentoId: contasPagamento[0]?.id ?? '',
      valorDisplay: (fatura.totalCentavos / 100).toFixed(2).replace('.', ','),
      dataPagamento: hoje,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setApiError(null)

    try {
      const valorCentavos = toCents(values.valorDisplay.replace(',', '.'))
      if (valorCentavos <= 0) throw new Error('Valor deve ser maior que zero')

      await pagarFaturaCartao(fatura.id, {
        contaPagamentoId: values.contaPagamentoId,
        valorCentavos,
        dataPagamento: values.dataPagamento,
      })

      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao registrar pagamento')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#151515]">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">Fatura</p>
        <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
          {fatura.competencia} - {formatBRL(fatura.totalCentavos)}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Conta de pagamento <span className="text-red-500" aria-hidden>*</span>
        </label>
        <select
          {...register('contaPagamentoId')}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
        >
          {contasPagamento.map(conta => (
            <option key={conta.id} value={conta.id}>{conta.nome}</option>
          ))}
        </select>
        {errors.contaPagamentoId && <p role="alert" className="text-xs text-red-600">{errors.contaPagamentoId.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="valorDisplay"
          control={control}
          render={({ field }) => (
            <MoneyInput
              label="Valor pago"
              required
              error={errors.valorDisplay?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Input
          label="Data do pagamento"
          type="date"
          required
          error={errors.dataPagamento?.message}
          {...register('dataPagamento')}
        />
      </div>

      {contasPagamento.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/30">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Cadastre uma conta que nao seja cartao de credito para registrar pagamentos.
          </p>
        </div>
      )}

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          loadingText="Registrando..."
          disabled={contasPagamento.length === 0}
        >
          Registrar pagamento
        </Button>
      </div>
    </form>
  )
}

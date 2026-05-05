'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'

const pagamentoSchema = z.object({
  valor: z.number().positive('Valor deve ser maior que 0'),
  contaPagamentoId: z.string().min(1, 'Selecione uma conta'),
  data: z.string().optional(),
})

type PagamentoFormData = z.infer<typeof pagamentoSchema>

interface Fatura {
  id: string
  mes: string
  valor: number
  valorPago: number
  status: string
  cartao: {
    nome: string
  }
}

interface Conta {
  id: string
  nome: string
  tipo: string
  saldoAtual: number
}

interface PagamentoFormProps {
  fatura: Fatura
  contas: Conta[]
  onSubmit: (data: PagamentoFormData) => Promise<void>
  isLoading?: boolean
}

export function PagamentoForm({
  fatura,
  contas,
  onSubmit,
  isLoading = false,
}: PagamentoFormProps) {
  const [erro, setErro] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PagamentoFormData>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      valor: fatura.valor - fatura.valorPago,
      contaPagamentoId: '',
    },
  })

  const valorSelect = watch('valor')
  const contaSelect = watch('contaPagamentoId')

  const contaSelecionada = contas.find((c) => c.id === contaSelect)

  const handleFormSubmit = async (data: PagamentoFormData) => {
    try {
      setErro('')
      await onSubmit(data)
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : 'Erro ao processar pagamento'
      )
    }
  }

  // Filter out credit accounts as they can't be used for payment
  const contasValidas = contas.filter((c) => c.tipo !== 'CREDITO')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento de Fatura</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Fatura Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Cartão
              </span>
              <span className="font-semibold">{fatura.cartao.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Mês
              </span>
              <span className="font-semibold">{fatura.mes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Valor Total
              </span>
              <span className="font-semibold">
                R$ {fatura.valor.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Já Pagos
              </span>
              <span className="font-semibold text-green-600">
                R$ {fatura.valorPago.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Restante
              </span>
              <span className="font-bold text-lg">
                R$ {(fatura.valor - fatura.valorPago).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Valor */}
          <Input
            label="Valor a Pagar"
            type="number"
            step="0.01"
            placeholder="0,00"
            {...register('valor', {
              valueAsNumber: true,
              validate: (value) => {
                const restante = fatura.valor - fatura.valorPago
                if (value > restante) {
                  return `Não pode exceder R$ ${restante.toLocaleString('pt-BR')}`
                }
                return true
              },
            })}
            error={errors.valor?.message}
          />

          {/* Conta para Pagamento */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pagar de *
            </label>
            <select
              {...register('contaPagamentoId')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.05] text-gray-900 dark:text-white"
            >
              <option value="">Selecione uma conta...</option>
              {contasValidas.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} (Saldo: R${' '}
                  {conta.saldoAtual.toLocaleString('pt-BR')})
                </option>
              ))}
            </select>
            {errors.contaPagamentoId && (
              <p className="text-sm text-red-500">
                {errors.contaPagamentoId.message}
              </p>
            )}
          </div>

          {/* Account Info */}
          {contaSelecionada && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Saldo Disponível
                </span>
                <span
                  className={
                    contaSelecionada.saldoAtual >= valorSelect
                      ? 'font-semibold text-green-600'
                      : 'font-semibold text-red-600'
                  }
                >
                  R$ {contaSelecionada.saldoAtual.toLocaleString('pt-BR')}
                </span>
              </div>
              {contaSelecionada.saldoAtual < valorSelect && (
                <p className="text-red-600 text-xs">
                  ⚠️ Saldo insuficiente para este pagamento
                </p>
              )}
            </div>
          )}

          {/* Data */}
          <Input
            label="Data do Pagamento"
            type="date"
            {...register('data')}
            error={errors.data?.message}
            defaultValue={new Date().toISOString().split('T')[0]}
          />

          {/* Error Message */}
          {erro && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={
                isLoading ||
                !contaSelecionada ||
                contaSelecionada.saldoAtual < valorSelect
              }
              isLoading={isLoading}
              className="flex-1"
            >
              Confirmar Pagamento
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

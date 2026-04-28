'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createCategoria, updateCategoria } from '../api'
import { createCategoriaSchema, updateCategoriaSchema } from '../schemas'
import {
  TIPOS_CATEGORIA,
  TIPO_CATEGORIA_LABELS,
  type CategoriaDTO,
  type TipoCategoria,
} from '../types'

const COR_PRESETS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280']

type FormValues = {
  nome: string
  tipo: TipoCategoria
  icone?: string | null
  cor?: string | null
  ordem?: number
}

interface CategoriaFormProps {
  mode?: 'create' | 'edit'
  initialData?: CategoriaDTO
  onSuccess: () => void
  onCancel: () => void
}

export function CategoriaForm({
  mode = 'create',
  initialData,
  onSuccess,
  onCancel,
}: CategoriaFormProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = mode === 'edit' && !!initialData
  const schema = isEdit ? updateCategoriaSchema : createCategoriaSchema

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          nome: initialData.nome,
          tipo: initialData.tipo,
          icone: initialData.icone ?? '',
          cor: initialData.cor ?? COR_PRESETS[0],
          ordem: initialData.ordem,
        }
      : {
          nome: '',
          tipo: 'expense',
          icone: '',
          cor: COR_PRESETS[0],
          ordem: 0,
        },
  })

  const cor = watch('cor') ?? COR_PRESETS[0]

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const input = {
        nome: values.nome,
        tipo: values.tipo,
        icone: values.icone || null,
        cor: values.cor || null,
        ordem: Number(values.ordem ?? 0),
      }

      if (isEdit) {
        await updateCategoria(initialData.id, input)
      } else {
        await createCategoria(input)
      }

      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar categoria')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="Nome da categoria"
        required
        placeholder="Ex.: Moradia, Salario, Transporte"
        error={errors.nome?.message}
        {...register('nome')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo <span className="text-red-500" aria-hidden>*</span>
          </label>
          <select
            {...register('tipo')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
          >
            {TIPOS_CATEGORIA.map((tipo) => (
              <option key={tipo} value={tipo}>{TIPO_CATEGORIA_LABELS[tipo]}</option>
            ))}
          </select>
          {errors.tipo && <p role="alert" className="text-xs text-red-600">{errors.tipo.message}</p>}
        </div>

        <Input
          label="Ordem"
          type="number"
          min={0}
          max={9999}
          error={errors.ordem?.message}
          {...register('ordem', { valueAsNumber: true })}
        />
      </div>

      <Input
        label="Icone"
        placeholder="Opcional"
        error={errors.icone?.message}
        {...register('icone')}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setValue('cor', preset, { shouldValidate: true })}
              className={`h-7 w-7 rounded-full transition-transform ${
                cor === preset ? 'scale-125 ring-2 ring-gray-400 ring-offset-2 dark:ring-offset-[#1E1E1E]' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: preset }}
              aria-label={`Cor ${preset}`}
            />
          ))}
        </div>
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
        <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Salvando...">
          {isEdit ? 'Atualizar categoria' : 'Criar categoria'}
        </Button>
      </div>
    </form>
  )
}

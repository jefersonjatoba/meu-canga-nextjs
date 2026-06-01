'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCPF, validateCPF } from '@/lib/utils'
import { Check, Zap, Shield, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { FEATURES_PRO, PRECO_MENSAL_CENTS, PRECO_ANUAL_CENTS } from '@/lib/plans'
import { cn } from '@/lib/utils'

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

type Step = 'dados' | 'plano'
type Plano = 'free' | 'pro'
type Billing = 'monthly' | 'annual'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const planoParam = searchParams.get('plano') as Plano | null
  const billingParam = searchParams.get('billing') as Billing | null
  const refCode = searchParams.get('ref')

  const [step, setStep] = useState<Step>('dados')
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano>(planoParam ?? 'free')
  const [billing, setBilling] = useState<Billing>(billingParam ?? 'annual')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState<RegisterFormData | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue, setError, getValues } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('cpf', formatCPF(e.target.value))
  }

  const checkEmail = async (e?: React.FocusEvent<HTMLInputElement>) => {
    const email = e?.target.value || getValues('email')
    if (!email || !/\S+@\S+\.\S+/.test(email)) return
    try {
      const res = await fetch(`/api/auth/check-availability?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (!data.available) setError('email', { message: 'Este email já está cadastrado' })
    } catch {}
  }

  const checkCPF = async (e?: React.FocusEvent<HTMLInputElement>) => {
    const raw = (e?.target.value || getValues('cpf')).replace(/\D/g, '')
    if (raw.length < 11) return
    try {
      const res = await fetch(`/api/auth/check-availability?cpf=${encodeURIComponent(raw)}`)
      const data = await res.json()
      if (!data.available) setError('cpf', { message: 'Este CPF já está cadastrado' })
    } catch {}
  }

  const onDadosSubmit = (data: RegisterFormData) => {
    setFormData(data)
    setStep('plano')
  }

  const onFinalSubmit = async () => {
    if (!formData) return
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone || null,
          planoSelecionado,
          billing,
          ref: refCode || undefined,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao criar conta')

      // PRO → ir para checkout (futuro Mercado Pago)
      // Free → ir para login com mensagem de boas-vindas
      if (planoSelecionado === 'pro') {
        router.push('/dashboard/upgrade?origem=cadastro')
      } else {
        router.push('/auth/login?cadastro=ok')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao criar conta. Tente novamente.')
      setStep('dados')
    } finally {
      setIsLoading(false)
    }
  }

  const precoMes = billing === 'annual' ? Math.round(PRECO_ANUAL_CENTS / 12) : PRECO_MENSAL_CENTS
  const economia = (PRECO_MENSAL_CENTS * 12) - PRECO_ANUAL_CENTS

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">MeuCanga</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(['dados', 'plano'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                step === s
                  ? 'bg-accent-blue text-white'
                  : s === 'dados' && step === 'plano'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-gray-500'
              )}>
                {s === 'dados' && step === 'plano' ? <Check size={13} /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium', step === s ? 'text-white' : 'text-gray-500')}>
                {s === 'dados' ? 'Seus dados' : 'Escolha o plano'}
              </span>
              {i < 1 && <div className={cn('flex-1 h-px', step === 'plano' ? 'bg-emerald-500' : 'bg-white/10')} />}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Dados ─── */}
        {step === 'dados' && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h1 className="text-xl font-bold text-white mb-1">Criar sua conta</h1>
            <p className="text-sm text-gray-500 mb-6">Gratuito para começar. Sem cartão de crédito.</p>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit(onDadosSubmit)} className="space-y-4">
              <Field label="Nome completo" error={errors.name?.message}>
                <input
                  {...register('name')}
                  placeholder="Seu nome"
                  className={inputCls(!!errors.name)}
                />
              </Field>
              <Field label="CPF" error={errors.cpf?.message}>
                <input
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                  onChange={handleCPFChange}
                  onBlur={(e) => checkCPF(e)}
                  autoComplete="off"
                  className={inputCls(!!errors.cpf)}
                />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  onBlur={(e) => checkEmail(e)}
                  className={inputCls(!!errors.email)}
                />
              </Field>
              <Field label="Telefone (opcional)">
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className={inputCls(false)}
                />
              </Field>
              <Field label="Senha" error={errors.password?.message}>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className={inputCls(!!errors.password)}
                />
              </Field>
              <Field label="Confirmar senha" error={errors.confirmPassword?.message}>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="Confirme sua senha"
                  className={inputCls(!!errors.confirmPassword)}
                />
              </Field>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-colors mt-2"
              >
                Continuar
                <ArrowRight size={15} />
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-5">
              Já tem conta?{' '}
              <Link href="/auth/login" className="text-accent-blue font-semibold hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        )}

        {/* ─── STEP 2: Plano ─── */}
        {step === 'plano' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Escolha seu plano</h1>
              <p className="text-sm text-gray-500">Você pode mudar de plano a qualquer momento.</p>
            </div>

            {/* Toggle billing */}
            <div className="inline-flex rounded-xl bg-white/[0.06] p-1 gap-1">
              {(['monthly', 'annual'] as Billing[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                    billing === b ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  {b === 'monthly' ? 'Mensal' : 'Anual'}
                  {b === 'annual' && (
                    <span className="bg-emerald-500 text-white text-[9px] px-1 rounded-full font-bold">-17%</span>
                  )}
                </button>
              ))}
            </div>

            {/* Card FREE */}
            <button
              onClick={() => setPlanoSelecionado('free')}
              className={cn(
                'w-full text-left rounded-2xl border-2 p-5 transition-all',
                planoSelecionado === 'free'
                  ? 'border-accent-blue bg-accent-blue/10'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Gratuito</p>
                  <p className="text-2xl font-extrabold text-white">R$&nbsp;0</p>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1',
                  planoSelecionado === 'free' ? 'border-accent-blue bg-accent-blue' : 'border-gray-600'
                )}>
                  {planoSelecionado === 'free' && <Check size={11} className="text-white" />}
                </div>
              </div>
              <ul className="space-y-1.5">
                {['10 lançamentos/mês', '4 RAS/mês', '1 meta ativa', '3 contas bancárias'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                    <Check size={11} className="text-gray-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>

            {/* Card PRO */}
            <button
              onClick={() => setPlanoSelecionado('pro')}
              className={cn(
                'w-full text-left rounded-2xl border-2 p-5 transition-all relative overflow-hidden',
                planoSelecionado === 'pro'
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-amber-500/40'
              )}
            >
              <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                Mais popular
              </div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-0.5">PRO</p>
                  <div className="flex items-end gap-1">
                    <p className="text-2xl font-extrabold text-white">{fmtBRL(precoMes)}</p>
                    <p className="text-gray-400 text-sm mb-0.5">/mês</p>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-[11px] text-emerald-400 font-medium">economize {fmtBRL(economia)}/ano</p>
                  )}
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0',
                  planoSelecionado === 'pro' ? 'border-amber-500 bg-amber-500' : 'border-gray-600'
                )}>
                  {planoSelecionado === 'pro' && <Check size={11} className="text-white" />}
                </div>
              </div>
              <ul className="space-y-1.5">
                {FEATURES_PRO.slice(0, 5).map(f => (
                  <li key={f.texto} className="flex items-center gap-2 text-xs text-gray-300">
                    <Sparkles size={10} className="text-amber-400 shrink-0" />
                    {f.texto}
                  </li>
                ))}
                <li className="text-[11px] text-gray-500 pl-4">+{FEATURES_PRO.length - 5} recursos incluídos</li>
              </ul>
            </button>

            {/* Ação */}
            <button
              onClick={onFinalSubmit}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
                planoSelecionado === 'pro'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25'
                  : 'bg-accent-blue text-white hover:bg-blue-600',
                isLoading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando conta…
                </span>
              ) : (
                <>
                  {planoSelecionado === 'pro' ? <Zap size={15} /> : <ArrowRight size={15} />}
                  {planoSelecionado === 'pro' ? 'Criar conta e assinar PRO' : 'Criar conta grátis'}
                </>
              )}
            </button>

            <button
              onClick={() => setStep('dados')}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={13} />
              Voltar e editar dados
            </button>

            <p className="text-center text-xs text-gray-600">
              7 dias de garantia · Cancele quando quiser · LGPD compliance
            </p>
          </div>
        )}

        <p className="text-center text-gray-700 text-xs mt-6">
          © 2026 MeuCanga. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}

// ─── Helpers de UI ────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-600',
    'bg-white/[0.06] border transition-colors outline-none',
    'focus:border-accent-blue focus:bg-white/[0.08]',
    hasError
      ? 'border-red-500/60'
      : 'border-white/[0.08] hover:border-white/20'
  )
}

// Suspense wrapper necessário para useSearchParams
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

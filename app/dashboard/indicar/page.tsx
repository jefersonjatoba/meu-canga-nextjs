'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Share2, Users, Gift, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReferralData {
  code: string
  link: string
  total: number
  rewarded: number
  mesesGanhos: number
  referrals: {
    id: string
    name: string
    plan: string
    createdAt: string
    rewarded: boolean
  }[]
}

export default function IndicarPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then((r) => r.json())
      .then((j) => j.success && setData(j.data))
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = () => {
    if (!data) return
    navigator.clipboard.writeText(data.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    if (!data) return
    const msg = encodeURIComponent(
      `Irmão, estou usando o MeuCanga para controlar meu RAS e financeiro. Tô economizando uma grana que nem sabia que existia. Cria sua conta grátis pelo meu link e ganha 30 dias de PRO: ${data.link}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-white/[0.06]" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Indicar Colegas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Indique e ganhe 1 mês de PRO gratuito por cada colega que assinar.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Indicados', value: data?.total ?? 0, icon: Users, cor: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Converteram PRO', value: data?.rewarded ?? 0, icon: Zap, cor: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Meses grátis', value: data?.mesesGanhos ?? 0, icon: Gift, cor: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-4 text-center">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2', s.bg)}>
                <Icon size={16} className={s.cor} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Seu link */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-6">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Seu link exclusivo</h2>
        <p className="text-xs text-gray-500 mb-4">Compartilhe com colegas de farda. Cada conversão em PRO = 1 mês grátis para você.</p>

        {/* Link box */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 mb-3">
          <p className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-300 truncate">
            {data?.link ?? '—'}
          </p>
          <button
            onClick={handleCopy}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              copied
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
            )}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* Código */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Código:</span>
          <span className="font-mono font-bold text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
            {data?.code ?? '—'}
          </span>
        </div>

        {/* Botões de compartilhamento */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20b557] transition-colors"
          >
            <Share2 size={15} />
            Compartilhar no WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            <Copy size={15} />
            Copiar link
          </button>
        </div>
      </div>

      {/* Como funciona */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-6">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Como funciona</h2>
        <div className="space-y-3">
          {[
            { n: '01', texto: 'Compartilhe seu link com colegas de viatura ou de quartel' },
            { n: '02', texto: 'Ele cria a conta usando seu link e ganha 30 dias de PRO grátis' },
            { n: '03', texto: 'Quando ele assinar o PRO, você recebe 1 mês gratuito na sua conta' },
            { n: '04', texto: 'Sem limite — quanto mais indicar, mais meses grátis você acumula' },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-accent-blue text-white text-[11px] font-black flex items-center justify-center mt-0.5">
                {s.n}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de indicados */}
      {data && data.referrals.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            Seus indicados ({data.total})
          </h2>
          <div className="space-y-2">
            {data.referrals.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-white/[0.06] last:border-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {r.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    r.plan === 'pro'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                  )}>
                    {r.plan.toUpperCase()}
                  </span>
                  {r.rewarded && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      +1 mês
                    </span>
                  )}
                </div>
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

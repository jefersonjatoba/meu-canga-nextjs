import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyHqToken, COOKIE_NAME } from '@/lib/hq-auth'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Acesso restrito',
  robots: 'noindex,nofollow',
}

export default async function HqLoginPage() {
  // Já autenticado → redireciona direto pro painel
  const adminPath = process.env.ADMIN_PATH ?? 'hq'
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (verifyHqToken(token)) {
    redirect(`/${adminPath}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-white font-bold text-lg tracking-tight">MeuCanga</span>
            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
              HQ
            </span>
          </div>
          <p className="text-gray-600 text-sm">Acesso exclusivo para administradores</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-700 mt-6">
          Sessão válida por 4 horas · Acesso monitorado e registrado
        </p>
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyHqToken, COOKIE_NAME } from '@/lib/hq-auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import type { ReactNode } from 'react'

export const metadata = {
  title: { template: '%s — HQ MeuCanga', default: 'HQ MeuCanga' },
  robots: 'noindex,nofollow',
}

export default async function HqProtectedLayout({ children }: { children: ReactNode }) {
  const adminPath = process.env.ADMIN_PATH ?? 'hq'

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!verifyHqToken(token)) {
    redirect(`/${adminPath}/login`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex">
      <AdminSidebar adminPath={adminPath} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-10 border-b border-white/[0.06] bg-[#0a0a0a] flex items-center justify-between px-5 shrink-0">
          <p className="text-[11px] text-gray-600 font-mono">MeuCanga · Painel HQ</p>
          <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-sm tracking-widest uppercase">
            ACESSO RESTRITO
          </span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

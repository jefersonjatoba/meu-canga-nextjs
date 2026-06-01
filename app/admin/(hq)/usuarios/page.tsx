import { prisma } from '@/lib/prisma'
import Link from 'next/link'

type SearchParams = {
  q?: string
  plan?: string
  page?: string
}

function planBadge(plan: string) {
  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
        PRO
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-white/5 text-gray-400 uppercase tracking-wider">
      Free
    </span>
  )
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

const PAGE_SIZE = 50

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = params.q ?? ''
  const plan = params.plan ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(plan && plan !== 'all' ? { plan } : {}),
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { lancamentos: true, rasAgendas: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (plan) p.set('plan', plan)
    p.set('page', String(page))
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    return `/admin/usuarios?${p.toString()}`
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-100">Usuários</h1>
        <p className="text-xs text-gray-500 mt-0.5">{totalCount.toLocaleString('pt-BR')} usuários encontrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form method="GET" action="/admin/usuarios" className="flex-1">
          <input type="hidden" name="plan" value={plan} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-[#111111] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50"
          />
        </form>

        {/* Plan tabs */}
        <div className="flex gap-1">
          {['all', 'free', 'pro'].map((p) => (
            <Link
              key={p}
              href={buildUrl({ plan: p === 'all' ? '' : p, page: '1' })}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                (plan === p || (p === 'all' && !plan))
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-[#111111] border border-white/[0.08] text-gray-400 hover:text-gray-200'
              }`}
            >
              {p === 'all' ? 'Todos' : p === 'pro' ? 'PRO' : 'Free'}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                  Plano
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                  Streak
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium hidden md:table-cell">
                  Último acesso
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium hidden lg:table-cell">
                  Lançamentos
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium hidden lg:table-cell">
                  RAS
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate max-w-[180px]">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-600 truncate max-w-[180px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{planBadge(user.plan)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">{user.streakDays}🔥</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-500">{fmtDate(user.lastSeenAt)}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-400">
                      {user._count.lancamentos.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-400">
                      {user._count.rasAgendas.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/usuarios/${user.id}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-600 text-sm">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Página {page} de {totalPages} — {totalCount.toLocaleString('pt-BR')} resultados
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-3 py-1.5 text-xs bg-[#111111] border border-white/[0.08] rounded-md text-gray-400 hover:text-gray-200 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-3 py-1.5 text-xs bg-[#111111] border border-white/[0.08] rounded-md text-gray-400 hover:text-gray-200 transition-colors"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

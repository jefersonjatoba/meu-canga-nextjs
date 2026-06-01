import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/server/services/mailer.service'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const h = req.headers.get('x-cron-secret') ?? ''
  const b = req.headers.get('authorization') ?? ''
  return h === secret || b === `Bearer ${secret}`
}

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function mesAnterior() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const start = new Date(`${ano}-${mes}-01T00:00:00.000Z`)
  const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return { ano, mes, label, start, end }
}

function buildSummaryTemplate(
  name: string,
  mesLabel: string,
  receitas: number,
  despesas: number,
  rasTotal: number,
  saldo: number,
  isPro: boolean,
): string {
  const first = name.split(' ')[0]
  const saldoColor = saldo >= 0 ? '#10b981' : '#ef4444'
  const saldoIcon  = saldo >= 0 ? '📈' : '📉'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
body{margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hero{background:linear-gradient(135deg,#111827,#1f2937);padding:36px 32px;text-align:center}
.hero .mc{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#2563eb;border-radius:12px;margin-bottom:12px}
.hero h1{margin:0;font-size:22px;font-weight:800;color:#fff}
.hero p{margin:8px 0 0;color:rgba(255,255,255,.6);font-size:13px}
.body{padding:32px}
.body p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
.card{background:#f9fafb;border-radius:12px;padding:16px}
.card .label{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.card .value{font-size:20px;font-weight:800}
.card-green .value{color:#10b981}
.card-red .value{color:#ef4444}
.card-blue .value{color:#2563eb}
.card-purple .value{color:#7c3aed}
.saldo-box{background:#f0fdf4;border:2px solid #10b981;border-radius:14px;padding:20px 24px;text-align:center;margin:20px 0}
.saldo-box.negativo{background:#fef2f2;border-color:#ef4444}
.saldo-box .s-label{font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.saldo-box .s-value{font-size:28px;font-weight:900}
.tip{background:#eff6ff;border-left:4px solid #2563eb;border-radius:4px;padding:14px 18px;margin:20px 0;font-size:13px;color:#1e40af}
.pro-box{background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #f59e0b;border-radius:14px;padding:20px 24px;text-align:center;margin:20px 0}
.pro-box h3{margin:0 0 6px;font-size:16px;font-weight:800;color:#92400e}
.pro-box p{margin:0 0 14px;color:#78350f;font-size:13px}
.cta{display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:10px}
.cta-gold{display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:10px}
.footer{padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;font-size:12px;color:#9ca3af;background:#fafafa}
.footer a{color:#2563eb;text-decoration:none}
</style></head>
<body>
<div class="wrap">
  <div class="hero">
    <div class="mc"><span style="color:#fff;font-size:18px;font-weight:900">MC</span></div>
    <h1>Seu resumo de ${mesLabel}</h1>
    <p>Relatório financeiro mensal · MeuCanga</p>
  </div>

  <div class="body">
    <p>Olá, <strong>${first}</strong>! Aqui está um resumo do seu mês financeiro. 📊</p>

    <div class="cards">
      <div class="card card-green">
        <div class="label">Receitas</div>
        <div class="value">${fmtBRL(receitas)}</div>
      </div>
      <div class="card card-red">
        <div class="label">Despesas</div>
        <div class="value">${fmtBRL(despesas)}</div>
      </div>
      <div class="card card-blue">
        <div class="label">RAS Registrado</div>
        <div class="value">${fmtBRL(rasTotal)}</div>
      </div>
      <div class="card card-purple">
        <div class="label">Lançamentos</div>
        <div class="value" style="font-size:14px;padding-top:4px">Ver no app</div>
      </div>
    </div>

    <div class="saldo-box${saldo < 0 ? ' negativo' : ''}">
      <div class="s-label">${saldoIcon} Saldo operacional do mês</div>
      <div class="s-value" style="color:${saldoColor}">${fmtBRL(saldo)}</div>
    </div>

    ${saldo >= 0
      ? `<div class="tip">💡 Você fechou o mês no positivo! Que tal destinar parte para sua reserva de emergência ou uma meta de investimento?</div>`
      : `<div class="tip" style="background:#fef2f2;border-color:#ef4444;color:#991b1b">⚠️ Suas despesas superaram as receitas este mês. Acesse o app e identifique onde cortar para o próximo mês.</div>`
    }

    ${!isPro ? `
    <div class="pro-box">
      <h3>📅 Visão Anual disponível no PRO</h3>
      <p>Compare mês a mês, veja tendências e projete seu patrimônio para os próximos 12 meses.</p>
      <a href="https://meu-canga.com/dashboard/upgrade?origem=email-mensal" class="cta-gold">Assinar PRO →</a>
    </div>` : ''}

    <div style="text-align:center;margin:24px 0">
      <a href="https://meu-canga.com/dashboard" class="cta">Ver detalhes no app →</a>
    </div>

    <p style="font-size:13px;color:#9ca3af">Este email é enviado automaticamente no início de cada mês com os dados do mês anterior.</p>
  </div>

  <div class="footer">
    <p>© 2026 MeuCanga · <a href="https://meu-canga.com/configuracoes">Gerenciar preferências</a></p>
  </div>
</div>
</body></html>`
}

async function run() {
  const { label, start, end } = mesAnterior()
  const results = { enviados: 0, pulados: 0, errors: 0 }

  // Usuários ativos (que têm pelo menos 1 lançamento no mês anterior)
  const usuarios = await prisma.user.findMany({
    where: {
      lancamentos: { some: { data: { gte: start, lte: end } } },
    },
    select: { id: true, email: true, name: true, plan: true },
  })

  for (const u of usuarios) {
    try {
      const [receitas, despesas, rasTotal] = await Promise.all([
        prisma.lancamento.aggregate({
          where: { userId: u.id, tipo: 'income', data: { gte: start, lte: end } },
          _sum: { valorCentavos: true },
        }),
        prisma.lancamento.aggregate({
          where: { userId: u.id, tipo: 'expense', data: { gte: start, lte: end } },
          _sum: { valorCentavos: true },
        }),
        prisma.rasAgenda.aggregate({
          where: {
            userId: u.id,
            status: { in: ['confirmado', 'realizado'] },
            data: { gte: start, lte: end },
            deletadoEm: null,
          },
          _sum: { valorCentavos: true },
        }),
      ])

      const r = receitas._sum.valorCentavos ?? 0
      const d = despesas._sum.valorCentavos ?? 0
      const ras = rasTotal._sum.valorCentavos ?? 0

      if (r === 0 && d === 0) { results.pulados++; continue }

      await sendEmail({
        to: u.email,
        subject: `📊 Seu resumo financeiro de ${label}`,
        htmlContent: buildSummaryTemplate(u.name, label, r, d, ras, r - d, u.plan === 'pro'),
        tags: ['resumo-mensal'],
      })
      results.enviados++
    } catch { results.errors++ }
  }

  return { ...results, mes: label, timestamp: new Date().toISOString() }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await run()
    console.log('[cron/email-monthly-summary]', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await run()
    console.log('[cron/email-monthly-summary]', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

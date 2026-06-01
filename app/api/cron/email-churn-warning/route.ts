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

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function buildWarning7Template(name: string): string {
  const first = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
body{margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hero{background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:36px 32px;text-align:center;color:#fff}
.hero h1{margin:0;font-size:24px;font-weight:800}
.hero p{margin:8px 0 0;opacity:.85;font-size:14px}
.body{padding:32px}
.body p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0}
.stat{background:#f8fafc;border-radius:12px;padding:16px;text-align:center}
.stat strong{display:block;font-size:22px;font-weight:800;color:#0f172a}
.stat span{font-size:12px;color:#64748b;margin-top:2px}
.cta{display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px}
.footer{padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;font-size:12px;color:#9ca3af;background:#fafafa}
.footer a{color:#2563eb;text-decoration:none}
</style></head>
<body>
<div class="wrap">
  <div class="hero">
    <h1>🛡️ ${first}, sentimos sua falta</h1>
    <p>Sua situação financeira não para — seu controle sim?</p>
  </div>
  <div class="body">
    <p>Olá, <strong>${first}</strong>!</p>
    <p>Faz 7 dias que você não acessa o MeuCanga. Enquanto isso, despesas continuam chegando, RAS acontecendo e seu saldo financeiro mudando.</p>
    <p>Policiais que acompanham suas finanças semanalmente <strong>economizam em média R$ 380/mês a mais</strong> do que quem acessa esporadicamente.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://meu-canga.com/dashboard" class="cta">Voltar ao MeuCanga →</a>
    </div>
    <p style="font-size:13px;color:#9ca3af">Não quer mais receber lembretes? <a href="https://meu-canga.com/configuracoes" style="color:#2563eb">Gerenciar preferências</a>.</p>
  </div>
  <div class="footer">
    <p>© 2026 MeuCanga · <a href="https://meu-canga.com/configuracoes">Cancelar inscrição</a></p>
  </div>
</div>
</body></html>`
}

function buildWarning14Template(name: string): string {
  const first = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
body{margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hero{background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:36px 32px;text-align:center;color:#fff}
.hero h1{margin:0;font-size:24px;font-weight:800}
.hero p{margin:8px 0 0;opacity:.85;font-size:14px}
.body{padding:32px}
.body p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7}
.card{background:linear-gradient(135deg,#faf5ff,#ede9fe);border:2px solid #c4b5fd;border-radius:14px;padding:20px 24px;margin:20px 0}
.card h3{margin:0 0 12px;font-size:14px;font-weight:700;color:#6d28d9}
.item{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px;color:#4c1d95}
.dot{width:8px;height:8px;background:#7c3aed;border-radius:50%;flex-shrink:0}
.cta{display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px}
.footer{padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;font-size:12px;color:#9ca3af;background:#fafafa}
.footer a{color:#7c3aed;text-decoration:none}
</style></head>
<body>
<div class="wrap">
  <div class="hero">
    <h1>📊 ${first}, 14 dias sem controle</h1>
    <p>O que aconteceu com seus lançamentos?</p>
  </div>
  <div class="body">
    <p>Olá, <strong>${first}</strong>!</p>
    <p>Faz 2 semanas que não te vemos por aqui. Não queremos que você perca o controle das suas finanças — por isso viemos buscar você.</p>
    <div class="card">
      <h3>🎯 O que você está perdendo sem usar o MeuCanga</h3>
      <div class="item"><div class="dot"></div><span>Visão clara de quanto seu RAS vai render no mês</span></div>
      <div class="item"><div class="dot"></div><span>Alertas automáticos de fatura de cartão próxima</span></div>
      <div class="item"><div class="dot"></div><span>Streaks de controle financeiro e conquistas desbloqueáveis</span></div>
      <div class="item"><div class="dot"></div><span>Relatório mensal automático por email</span></div>
    </div>
    <p>Leva menos de 2 minutos lançar o que aconteceu na última semana. Retome agora:</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://meu-canga.com/dashboard/lancamentos" class="cta">Registrar lançamentos →</a>
    </div>
    <p style="font-size:13px;color:#9ca3af">Não quer mais receber lembretes? <a href="https://meu-canga.com/configuracoes" style="color:#7c3aed">Gerenciar preferências</a>.</p>
  </div>
  <div class="footer">
    <p>© 2026 MeuCanga · <a href="https://meu-canga.com/configuracoes">Cancelar inscrição</a></p>
  </div>
</div>
</body></html>`
}

function buildWarning21Template(name: string, isPro: boolean): string {
  const first = name.split(' ')[0]
  const heroColor = isPro
    ? 'background:linear-gradient(135deg,#b45309,#dc2626)'
    : 'background:linear-gradient(135deg,#374151,#111827)'
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
body{margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hero{${heroColor};padding:36px 32px;text-align:center;color:#fff}
.hero h1{margin:0;font-size:24px;font-weight:800}
.hero p{margin:8px 0 0;opacity:.85;font-size:14px}
.body{padding:32px}
.body p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7}
.alert{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin:20px 0}
.alert p{margin:0;color:#991b1b;font-size:14px}
.cta{display:inline-block;background:#dc2626;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px}
.cta-secondary{display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:12px;margin-top:8px}
.footer{padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;font-size:12px;color:#9ca3af;background:#fafafa}
.footer a{color:#dc2626;text-decoration:none}
</style></head>
<body>
<div class="wrap">
  <div class="hero">
    <h1>⚠️ ${first}, tudo bem?</h1>
    <p>21 dias sem acessar o MeuCanga — precisamos conversar</p>
  </div>
  <div class="body">
    <p>Olá, <strong>${first}</strong>!</p>
    ${isPro ? `<div class="alert"><p>⚡ <strong>Você é assinante PRO</strong> e está pagando por uma ferramenta que não está usando. Não deixe seu dinheiro ir embora — retome o controle hoje.</p></div>` : ''}
    <p>Faz 3 semanas que você não abre o app. Sabemos que a vida de policial é imprevisível — mas exatamente por isso ter controle financeiro é ainda mais importante.</p>
    <p>Suas despesas não pararam. Seus RAS aconteceram. Sua fatura de cartão venceu. <strong>Tudo isso sem você acompanhar.</strong></p>
    <p>Não precisa de muito: abra o app, veja onde está e decida seu próximo passo.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://meu-canga.com/dashboard" class="cta">Retomar controle agora →</a>
    </div>
    <p style="font-size:13px;color:#9ca3af">Precisa de ajuda ou tem algum problema? Responda este email — lemos todos.</p>
    <p style="font-size:13px;color:#9ca3af">Não quer mais receber lembretes? <a href="https://meu-canga.com/configuracoes" style="color:#dc2626">Cancelar inscrição</a>.</p>
  </div>
  <div class="footer">
    <p>© 2026 MeuCanga · <a href="https://meu-canga.com/configuracoes">Gerenciar preferências</a></p>
  </div>
</div>
</body></html>`
}

async function run() {
  const now = new Date()
  const results = { w7: 0, w14: 0, w21: 0, errors: 0 }

  // Usuários sem lastSeenAt há 7 dias (±12h de tolerância)
  const w7Start = daysAgo(8)
  const w7End   = daysAgo(6)

  const usersW7 = await prisma.user.findMany({
    where: {
      OR: [
        { lastSeenAt: { gte: w7Start, lte: w7End } },
        { lastSeenAt: null, createdAt: { gte: w7Start, lte: w7End } },
      ],
    },
    select: { id: true, email: true, name: true, plan: true },
  })

  for (const u of usersW7) {
    try {
      await sendEmail({
        to: u.email,
        subject: `${u.name.split(' ')[0]}, sentimos sua falta 🛡️`,
        htmlContent: buildWarning7Template(u.name),
        tags: ['churn-warning', 'w7'],
      })
      results.w7++
    } catch { results.errors++ }
  }

  // 14 dias sem acesso
  const w14Start = daysAgo(15)
  const w14End   = daysAgo(13)

  const usersW14 = await prisma.user.findMany({
    where: {
      OR: [
        { lastSeenAt: { gte: w14Start, lte: w14End } },
        { lastSeenAt: null, createdAt: { gte: w14Start, lte: w14End } },
      ],
    },
    select: { id: true, email: true, name: true, plan: true },
  })

  for (const u of usersW14) {
    try {
      await sendEmail({
        to: u.email,
        subject: `📊 ${u.name.split(' ')[0]}, 14 dias sem ver suas finanças`,
        htmlContent: buildWarning14Template(u.name),
        tags: ['churn-warning', 'w14'],
      })
      results.w14++
    } catch { results.errors++ }
  }

  // 21 dias sem acesso — tom mais urgente, menciona PRO se for assinante
  const w21Start = daysAgo(22)
  const w21End   = daysAgo(20)

  const usersW21 = await prisma.user.findMany({
    where: {
      OR: [
        { lastSeenAt: { gte: w21Start, lte: w21End } },
        { lastSeenAt: null, createdAt: { gte: w21Start, lte: w21End } },
      ],
    },
    select: { id: true, email: true, name: true, plan: true },
  })

  for (const u of usersW21) {
    try {
      await sendEmail({
        to: u.email,
        subject: `⚠️ ${u.name.split(' ')[0]}, tudo bem? 21 dias sem você`,
        htmlContent: buildWarning21Template(u.name, u.plan === 'pro'),
        tags: ['churn-warning', 'w21'],
      })
      results.w21++
    } catch { results.errors++ }
  }

  return { ...results, timestamp: now.toISOString() }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await run()
    console.log('[cron/email-churn-warning]', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[cron/email-churn-warning]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await run()
    console.log('[cron/email-churn-warning]', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[cron/email-churn-warning]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

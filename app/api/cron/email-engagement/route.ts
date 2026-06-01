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

// ─── Templates ───────────────────────────────────────────────────────────────

function buildD7Template(name: string): string {
  const first = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
body{margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hero{background:linear-gradient(135deg,#1d4ed8,#0ea5e9);padding:36px 32px;text-align:center;color:#fff}
.hero h1{margin:0;font-size:24px;font-weight:800}
.hero p{margin:8px 0 0;opacity:.85;font-size:14px}
.body{padding:32px}
.body p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7}
.box{background:#eff6ff;border-radius:12px;padding:20px 24px;margin:20px 0}
.box h3{margin:0 0 12px;font-size:13px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.5px}
.item{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px;color:#374151}
.dot{width:8px;height:8px;background:#2563eb;border-radius:50%;flex-shrink:0}
.cta{display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px;margin-top:8px}
.footer{padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;font-size:12px;color:#9ca3af;background:#fafafa}
.footer a{color:#2563eb;text-decoration:none}
</style></head>
<body>
<div class="wrap">
  <div class="hero">
    <h1>🛡️ ${first}, sua conta está esperando por você</h1>
    <p>7 dias de MeuCanga — vamos dar o primeiro passo?</p>
  </div>
  <div class="body">
    <p>Olá, <strong>${first}</strong>!</p>
    <p>Você criou sua conta há 7 dias mas ainda não registrou nenhuma movimentação. Sabemos que a rotina de policial é corrida — por isso o MeuCanga foi feito para ser rápido.</p>
    <div class="box">
      <h3>⚡ Em menos de 2 minutos você pode</h3>
      <div class="item"><div class="dot"></div><span>Registrar um RAS e ver o valor projetado</span></div>
      <div class="item"><div class="dot"></div><span>Lançar uma despesa e ver seu saldo em tempo real</span></div>
      <div class="item"><div class="dot"></div><span>Criar uma meta de reserva de emergência</span></div>
    </div>
    <p>Policiais que ativam a conta na primeira semana têm <strong>3x mais chances de atingir suas metas financeiras</strong> no ano.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://meu-canga.com/dashboard" class="cta">Acessar o MeuCanga agora →</a>
    </div>
    <p style="font-size:13px;color:#9ca3af">Qualquer dúvida, responda este email. Estamos aqui.</p>
  </div>
  <div class="footer">
    <p>© 2026 MeuCanga · <a href="https://meu-canga.com/configuracoes">Gerenciar preferências</a></p>
  </div>
</div>
</body></html>`
}

function buildD14Template(name: string): string {
  const first = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
body{margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hero{background:linear-gradient(135deg,#d97706,#ea580c);padding:36px 32px;text-align:center;color:#fff}
.hero h1{margin:0;font-size:24px;font-weight:800}
.hero p{margin:8px 0 0;opacity:.85;font-size:14px}
.body{padding:32px}
.body p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7}
.offer{background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #f59e0b;border-radius:14px;padding:24px;text-align:center;margin:24px 0}
.offer .badge{display:inline-block;background:#f59e0b;color:#000;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:20px;margin-bottom:10px}
.offer h2{margin:0 0 6px;font-size:20px;font-weight:800;color:#92400e}
.offer p{margin:0 0 16px;color:#78350f;font-size:14px}
.cta-gold{display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px}
.cta-plain{display:inline-block;background:#2563eb;color:#fff;font-weight:600;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:12px;margin-top:8px}
.footer{padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;font-size:12px;color:#9ca3af;background:#fafafa}
.footer a{color:#2563eb;text-decoration:none}
</style></head>
<body>
<div class="wrap">
  <div class="hero">
    <h1>⏰ ${first}, última chamada</h1>
    <p>Sua oferta especial expira em breve</p>
  </div>
  <div class="body">
    <p>Olá, <strong>${first}</strong>!</p>
    <p>Faz 14 dias desde que você criou sua conta no MeuCanga. Queremos que você experimente de verdade o que a plataforma pode fazer pela sua vida financeira.</p>
    <div class="offer">
      <div class="badge">🎁 Oferta Exclusiva</div>
      <h2>20% OFF no PRO</h2>
      <p>Válido por apenas <strong>24 horas</strong> a partir de agora</p>
      <a href="https://meu-canga.com/dashboard/upgrade?origem=email-d14&desc=20" class="cta-gold">Assinar PRO com 20% OFF →</a>
    </div>
    <p>Ou se preferir, acesse o plano grátis e comece pelo básico:</p>
    <div style="text-align:center">
      <a href="https://meu-canga.com/dashboard" class="cta-plain">Acessar o app →</a>
    </div>
    <p style="font-size:13px;color:#9ca3af;margin-top:24px">Não quer mais receber nossas mensagens? <a href="https://meu-canga.com/configuracoes" style="color:#2563eb">Cancelar inscrição</a>.</p>
  </div>
  <div class="footer">
    <p>© 2026 MeuCanga · <a href="https://meu-canga.com/configuracoes">Gerenciar preferências</a></p>
  </div>
</div>
</body></html>`
}

// ─── Runner ──────────────────────────────────────────────────────────────────

async function run() {
  const now = new Date()
  const results = { d7: 0, d14: 0, errors: 0 }

  // Usuários D+7: cadastrados há 7 dias (±12h), sem lancamentos nem ras, plano free
  const d7Start = daysAgo(8)
  const d7End   = daysAgo(6)

  const usersD7 = await prisma.user.findMany({
    where: {
      createdAt: { gte: d7Start, lte: d7End },
      plan: 'free',
      lancamentos:  { none: {} },
      rasAgendas:   { none: {} },
    },
    select: { id: true, email: true, name: true },
  })

  for (const u of usersD7) {
    try {
      await sendEmail({
        to: u.email,
        subject: `${u.name.split(' ')[0]}, sua conta está esperando por você 🛡️`,
        htmlContent: buildD7Template(u.name),
        tags: ['reengajamento', 'd7'],
      })
      results.d7++
    } catch { results.errors++ }
  }

  // Usuários D+14: cadastrados há 14 dias (±12h), sem lancamentos nem ras, plano free
  const d14Start = daysAgo(15)
  const d14End   = daysAgo(13)

  const usersD14 = await prisma.user.findMany({
    where: {
      createdAt: { gte: d14Start, lte: d14End },
      plan: 'free',
      lancamentos:  { none: {} },
      rasAgendas:   { none: {} },
    },
    select: { id: true, email: true, name: true },
  })

  for (const u of usersD14) {
    try {
      await sendEmail({
        to: u.email,
        subject: `⏰ ${u.name.split(' ')[0]}, oferta especial expira em 24h`,
        htmlContent: buildD14Template(u.name),
        tags: ['reengajamento', 'd14'],
      })
      results.d14++
    } catch { results.errors++ }
  }

  return { ...results, timestamp: now.toISOString() }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await run()
    console.log('[cron/email-engagement]', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[cron/email-engagement]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await run()
    console.log('[cron/email-engagement]', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[cron/email-engagement]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

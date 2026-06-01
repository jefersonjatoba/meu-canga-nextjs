// Mailer Service — Brevo transactional emails
// Send emails via Brevo REST API

const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@meu-canga.com'

export interface SendEmailInput {
  to: string | string[]
  subject: string
  htmlContent: string
  textContent?: string
  replyTo?: { email: string; name?: string }
  tags?: string[]
}

/**
 * Send transactional email via Brevo REST API
 * Handles both single and multiple recipients
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  try {
    if (!BREVO_API_KEY) {
      console.warn('[mailer] BREVO_API_KEY not configured, skipping email')
      return false
    }

    const toAddresses = Array.isArray(input.to)
      ? input.to.map(email => ({ email }))
      : [{ email: input.to }]

    const payload = {
      sender: { email: BREVO_SENDER_EMAIL, name: 'Meu Canga' },
      to: toAddresses,
      subject: input.subject,
      htmlContent: input.htmlContent,
      ...(input.textContent && { textContent: input.textContent }),
      ...(input.replyTo && { replyTo: input.replyTo }),
      ...(input.tags && { tags: input.tags }),
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Brevo API error: ${error.message}`)
    }

    console.log(`[mailer] Email enviado: ${input.subject} → ${input.to}`)
    return true
  } catch (error) {
    console.error('[mailer] Erro ao enviar email:', error instanceof Error ? error.message : String(error))
    return false
  }
}

/**
 * Email de boas-vindas — disparado em D+0 após o cadastro
 */
export function buildWelcomeTemplate(name: string): string {
  const firstName = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
    .wrap { max-width:600px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .hero { background:linear-gradient(135deg,#1d4ed8 0%,#0ea5e9 100%); padding:40px 32px; text-align:center; }
    .hero-logo { display:inline-flex; align-items:center; justify-content:center; width:56px; height:56px; background:rgba(255,255,255,0.2); border-radius:14px; margin-bottom:16px; }
    .hero h1 { margin:0; font-size:28px; font-weight:800; color:#fff; }
    .hero p { margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:15px; }
    .body { padding:36px 32px; }
    .body p { margin:0 0 16px; color:#374151; font-size:15px; line-height:1.7; }
    .highlight { color:#1d4ed8; font-weight:700; }
    .checklist { background:#f0f9ff; border-radius:12px; padding:20px 24px; margin:24px 0; }
    .checklist h3 { margin:0 0 14px; font-size:14px; font-weight:700; color:#0c4a6e; text-transform:uppercase; letter-spacing:0.5px; }
    .check-item { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; font-size:14px; color:#374151; }
    .check-icon { flex-shrink:0; width:20px; height:20px; background:#10b981; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-top:1px; }
    .cta-secondary { display:inline-block; background:#1d4ed8; color:#fff; font-weight:600; font-size:15px; text-decoration:none; padding:14px 32px; border-radius:12px; }
    .footer { padding:20px 32px; border-top:1px solid #f3f4f6; text-align:center; font-size:12px; color:#9ca3af; background:#fafafa; }
    .footer a { color:#1d4ed8; text-decoration:none; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div class="hero-logo">
      <span style="color:#fff;font-size:20px;font-weight:900">MC</span>
    </div>
    <h1>Bem-vindo ao MeuCanga!</h1>
    <p>Finanças para Segurança Pública</p>
  </div>

  <div class="body">
    <p>Olá, <span class="highlight">${firstName}</span>! 👋</p>
    <p>Sua conta foi criada com sucesso. Você acabou de dar o primeiro passo para ter controle total das suas finanças — sem planilhas, sem complicação.</p>

    <div class="checklist">
      <h3>🚀 Comece por aqui</h3>
      <div class="check-item">
        <div class="check-icon"><span style="color:#fff;font-size:11px">✓</span></div>
        <span><strong>Adicione uma conta bancária</strong> — conta corrente, poupança ou conta digital</span>
      </div>
      <div class="check-item">
        <div class="check-icon"><span style="color:#fff;font-size:11px">✓</span></div>
        <span><strong>Registre seu primeiro RAS</strong> — veja o valor projetado aparecer automaticamente</span>
      </div>
      <div class="check-item">
        <div class="check-icon"><span style="color:#fff;font-size:11px">✓</span></div>
        <span><strong>Lance uma despesa</strong> — e veja seu saldo operacional em tempo real</span>
      </div>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="https://meu-canga.com/dashboard" class="cta-secondary">Acessar o MeuCanga →</a>
    </div>

    <p style="margin-top:28px;font-size:13px;color:#9ca3af;">
      Qualquer dúvida, responda este email — nossa equipe responde em até 24h.<br>
      Feito com respeito à sua farda. 🛡️
    </p>
  </div>

  <div class="footer">
    <p>© 2026 MeuCanga · <a href="https://meu-canga.com/configuracoes">Gerenciar preferências</a> · <a href="https://meu-canga.com">Site</a></p>
  </div>
</div>
</body>
</html>`
}

/**
 * Build email template for RAS confirmation reminder
 */
export function buildRasConfirmationTemplate(
  name: string,
  hoursRemaining: number,
  rasList: Array<{ data: string; duracao: number; valor: number }>
): string {
  const valor = (rasList.reduce((sum, r) => sum + r.valor, 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const rasItems = rasList
    .map(
      r =>
        `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${r.data}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${r.duracao}h</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">R$ ${(r.valor / 100).toFixed(2)}</td>
      </tr>
    `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .body { padding: 32px; }
    .body p { margin: 0 0 16px; }
    .body strong { color: #dc2626; }
    .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px; }
    .alert-box .hours { font-size: 32px; font-weight: bold; color: #dc2626; }
    .alert-box .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    table th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .cta { background: #dc2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; margin: 24px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; background: #f9fafb; }
    .footer a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ RAS Aguardando Confirmação</h1>
      <p>Lembrete importante</p>
    </div>

    <div class="body">
      <p>Olá, <strong>${name}</strong>! 👋</p>

      <p>Você tem RAS <strong>realizado</strong> que precisa de <strong>confirmação</strong> antes de expirar a janela de 72 horas.</p>

      <div class="alert-box">
        <div class="label">Tempo Restante</div>
        <div class="hours">${hoursRemaining}h</div>
        <p style="margin: 8px 0 0; color: #dc2626;">Confirme agora para não perder o prazo!</p>
      </div>

      <h3 style="margin-top: 32px; margin-bottom: 16px; color: #1f2937;">RAS Pendentes de Confirmação:</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Horas</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${rasItems}
        </tbody>
      </table>

      <p><strong style="color: #10b981;">Total:</strong> ${rasList.length} RAS · ${rasList.reduce((sum, r) => sum + r.duracao, 0)}h · ${valor}</p>

      <p style="margin-top: 24px;">Acesse sua conta e confirme esses RAS agora:</p>

      <a href="https://meu-canga.com/dashboard/ras?status=realizado" class="cta">Confirmar RAS Agora →</a>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <p style="font-size: 13px; color: #6b7280;">
        <strong>Por que isso é importante?</strong><br>
        Após 72 horas da realização, o RAS expira a janela de confirmação. Se não confirmar a tempo, precisará fazer procedimentos administrativos para recuperar o valor.
      </p>
    </div>

    <div class="footer">
      <p>© 2026 Meu Canga · <a href="https://meu-canga.com/configuracoes">Gerenciar Preferências</a></p>
    </div>
  </div>
</body>
</html>`
}

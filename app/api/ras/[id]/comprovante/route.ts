import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { fmtBRL } from '@/types/ras'

// ─── GET /api/ras/[id]/comprovante ────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const ras = await prisma.rasAgenda.findUnique({
      where: { id },
      include: { pagamentos: true },
    })

    if (!ras) return notFoundResponse('RAS')
    if (ras.userId !== user.id) return forbiddenResponse()
    if (ras.status !== 'confirmado')
      return errorResponse('O comprovante só está disponível para RAS confirmados', 400)

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    })

    const [y, m, d] = ras.data.toISOString().slice(0, 10).split('-')
    const mesesNomes = [
      'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
    ]
    const diasSemana = [
      'domingo','segunda-feira','terça-feira','quarta-feira',
      'quinta-feira','sexta-feira','sábado',
    ]
    const dataObj = new Date(`${y}-${m}-${d}T00:00:00Z`)
    const diaSemana = diasSemana[dataObj.getUTCDay()]
    const dataFormatada = `${diaSemana}, ${d} de ${mesesNomes[parseInt(m) - 1]} de ${y}`

    const tipoLabel = ras.tipo === 'compulsorio' ? 'Compulsório' : 'Voluntário'
    const vagaLabel = ras.tipoVaga === 'reserva' ? 'Reserva' : 'Titular'
    const emissao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Comprovante RAS — ${ras.id.slice(-8).toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f4f6fa;
      color: #1a1a2e;
      padding: 32px 16px;
    }
    .comprovante {
      max-width: 640px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,.10);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      color: #fff;
      padding: 28px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-title { font-size: 22px; font-weight: 800; letter-spacing: .5px; }
    .header-sub { font-size: 12px; opacity: .75; margin-top: 4px; }
    .badge {
      background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.3);
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }
    .badge-num { font-size: 18px; font-weight: 900; }
    .body { padding: 28px 32px; }
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .8px;
      color: #6b7280;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .row { display: flex; gap: 24px; margin-bottom: 10px; flex-wrap: wrap; }
    .field { flex: 1; min-width: 140px; }
    .field-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
    .field-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .valor-destaque {
      background: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .valor-label { font-size: 12px; color: #6b7280; font-weight: 600; }
    .valor-brl { font-size: 28px; font-weight: 900; color: #16a34a; }
    .status-badge {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 700;
    }
    .footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 16px 32px;
      font-size: 11px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .print-btn {
      display: block;
      width: 100%;
      max-width: 640px;
      margin: 20px auto 0;
      padding: 14px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .comprovante { box-shadow: none; border-radius: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="comprovante">
    <div class="header">
      <div>
        <div class="header-title">🛡️ Meu Canga</div>
        <div class="header-sub">Comprovante de Serviço Adicional (RAS)</div>
      </div>
      <div class="badge">
        <div style="font-size:10px;opacity:.8;">Nº</div>
        <div class="badge-num">${ras.id.slice(-8).toUpperCase()}</div>
        <div class="status-badge" style="margin-top:6px;">✔️ Confirmado</div>
      </div>
    </div>

    <div class="body">
      <!-- Profissional -->
      <div class="section">
        <div class="section-title">👤 Profissional</div>
        <div class="row">
          <div class="field">
            <div class="field-label">Nome</div>
            <div class="field-value">${profile?.name ?? '—'}</div>
          </div>
          <div class="field">
            <div class="field-label">E-mail</div>
            <div class="field-value">${profile?.email ?? '—'}</div>
          </div>
        </div>
      </div>

      <!-- Serviço -->
      <div class="section">
        <div class="section-title">🗓️ Serviço Realizado</div>
        <div class="row">
          <div class="field" style="flex:2;">
            <div class="field-label">Data</div>
            <div class="field-value">${dataFormatada}</div>
          </div>
          <div class="field">
            <div class="field-label">Horário</div>
            <div class="field-value">${ras.horaInicio} — ${ras.horaFim}</div>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <div class="field-label">Duração</div>
            <div class="field-value">${ras.duracao} horas</div>
          </div>
          <div class="field">
            <div class="field-label">Tipo</div>
            <div class="field-value">${tipoLabel} — ${vagaLabel}</div>
          </div>
          <div class="field">
            <div class="field-label">Graduação</div>
            <div class="field-value">${ras.graduacao}</div>
          </div>
        </div>
        <div class="row">
          <div class="field" style="flex:2;">
            <div class="field-label">Local</div>
            <div class="field-value">${ras.local}</div>
          </div>
          <div class="field">
            <div class="field-label">Competência</div>
            <div class="field-value">${ras.competencia}</div>
          </div>
        </div>
        ${ras.observacoes ? `
        <div class="row">
          <div class="field" style="flex:1;">
            <div class="field-label">Observações</div>
            <div class="field-value">${ras.observacoes}</div>
          </div>
        </div>` : ''}
      </div>

      <!-- Valor -->
      <div class="section">
        <div class="section-title">💰 Informações Financeiras</div>
        <div class="valor-destaque">
          <div>
            <div class="valor-label">Valor Bruto</div>
            <div class="valor-brl">${fmtBRL(ras.valorCentavos)}</div>
          </div>
          <div style="text-align:right;">
            <div class="valor-label">Competência</div>
            <div style="font-size:16px;font-weight:700;color:#374151;">${ras.competencia}</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px;">Recebimento até 15/${ras.competencia.split('-').reverse().join('/')}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>🛡️ Meu Canga — Sistema de Gestão Policial</span>
      <span>Emitido em: ${emissao}</span>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">
    📥 Imprimir / Salvar como PDF
  </button>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="RAS_${ras.id.slice(-8).toUpperCase()}.html"`,
      },
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}

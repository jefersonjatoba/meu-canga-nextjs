// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '..', 'MeuCanga_Plano_Marketing_PRO.pdf')
const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'MeuCanga — Plano de Marketing PRO', Author: 'MeuCanga' } })
doc.pipe(fs.createWriteStream(OUT))

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  azul:     '#2563EB',
  azulEsc:  '#1E40AF',
  âmbar:    '#D97706',
  verde:    '#059669',
  vermelho: '#DC2626',
  cinzaEsc: '#111827',
  cinza:    '#374151',
  cinzaMed: '#6B7280',
  cinzaCla: '#F3F4F6',
  branco:   '#FFFFFF',
  linha:    '#E5E7EB',
}

let y = 0
const PW = 595 - 100  // largura útil

// ─── Helpers ──────────────────────────────────────────────────────────────────

function novaSecao() {
  doc.addPage()
  y = 50
}

function checkY(needed = 60) {
  if (y + needed > 750) novaSecao()
}

function linha(cor = C.linha, espessura = 0.5) {
  checkY(10)
  doc.moveTo(50, y).lineTo(545, y).lineWidth(espessura).strokeColor(cor).stroke()
  y += 8
}

function espaço(n = 12) { y += n }

function titulo(texto, nivel = 1) {
  checkY(50)
  if (nivel === 1) {
    doc.fontSize(22).font('Helvetica-Bold').fillColor(C.azulEsc).text(texto, 50, y, { width: PW })
    y += doc.currentLineHeight() + 10
  } else if (nivel === 2) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor(C.azul).text(texto, 50, y, { width: PW })
    y += doc.currentLineHeight() + 6
  } else {
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.cinzaEsc).text(texto, 50, y, { width: PW })
    y += doc.currentLineHeight() + 4
  }
}

function paragrafo(texto, opcoes = {}) {
  checkY(40)
  doc.fontSize(10).font('Helvetica').fillColor(C.cinza).text(texto, 50, y, { width: PW, lineGap: 3, ...opcoes })
  y += doc.heightOfString(texto, { width: PW, lineGap: 3 }) + 8
}

function destaque(texto) {
  checkY(40)
  doc.rect(50, y, PW, doc.heightOfString(texto, { width: PW - 30, lineGap: 3 }) + 16)
    .fillColor(C.cinzaCla).fill()
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.azulEsc)
    .text(texto, 65, y + 8, { width: PW - 30, lineGap: 3 })
  y += doc.heightOfString(texto, { width: PW - 30, lineGap: 3 }) + 26
}

function badge(texto, cor = C.azul) {
  const w = doc.widthOfString(texto, { fontSize: 8 }) + 16
  checkY(24)
  doc.roundedRect(50, y, w, 18, 4).fillColor(cor).fill()
  doc.fontSize(8).font('Helvetica-Bold').fillColor(C.branco).text(texto, 58, y + 5)
  y += 26
}

function item(texto, cor = C.azul, indent = 50) {
  checkY(30)
  doc.circle(indent + 5, y + 6, 3).fillColor(cor).fill()
  doc.fontSize(10).font('Helvetica').fillColor(C.cinza)
    .text(texto, indent + 16, y, { width: PW - (indent - 50) - 16, lineGap: 2 })
  y += doc.heightOfString(texto, { width: PW - (indent - 50) - 16, lineGap: 2 }) + 6
}

function itemCheck(texto, checked = true) {
  checkY(24)
  const emoji = checked ? '✓' : '○'
  const corEmoji = checked ? C.verde : C.cinzaMed
  doc.fontSize(10).font('Helvetica-Bold').fillColor(corEmoji).text(emoji, 50, y)
  doc.fontSize(10).font('Helvetica').fillColor(C.cinza).text(texto, 70, y, { width: PW - 20 })
  y += 18
}

function caixa(titulo_box, linhas, corBorda = C.azul) {
  const alturaTexto = linhas.reduce((acc, l) => acc + doc.heightOfString(l, { width: PW - 30, lineGap: 2 }) + 6, 0)
  const h = alturaTexto + 40
  checkY(h)
  doc.roundedRect(50, y, PW, h, 6).lineWidth(1.5).strokeColor(corBorda).stroke()
  doc.fontSize(9).font('Helvetica-Bold').fillColor(corBorda).text(titulo_box, 65, y + 10)
  let ly = y + 28
  linhas.forEach(l => {
    doc.fontSize(9).font('Helvetica').fillColor(C.cinza).text(l, 65, ly, { width: PW - 30, lineGap: 2 })
    ly += doc.heightOfString(l, { width: PW - 30, lineGap: 2 }) + 6
  })
  y += h + 12
}

function tabelaMetricas(rows) {
  const cols = [180, 120, 100]
  const headers = ['Métrica', 'Meta', 'Frequência']
  const hTotal = rows.length * 22 + 28
  checkY(hTotal + 20)

  // Header
  doc.rect(50, y, PW, 22).fillColor(C.azul).fill()
  let cx = 50
  headers.forEach((h, i) => {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.branco).text(h, cx + 6, y + 7, { width: cols[i] })
    cx += cols[i]
  })
  y += 22

  rows.forEach((row, ri) => {
    if (ri % 2 === 0) doc.rect(50, y, PW, 22).fillColor('#F8FAFC').fill()
    let cx2 = 50
    row.forEach((cell, ci) => {
      const cor = ci === 0 ? C.cinzaEsc : ci === 1 ? C.verde : C.cinzaMed
      doc.fontSize(9).font(ci === 0 ? 'Helvetica-Bold' : 'Helvetica').fillColor(cor)
        .text(cell, cx2 + 6, y + 7, { width: cols[ci] })
      cx2 += cols[ci]
    })
    y += 22
  })
  y += 12
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAPA
// ═══════════════════════════════════════════════════════════════════════════════

doc.rect(0, 0, 595, 842).fillColor(C.azulEsc).fill()

// Logo MC
doc.roundedRect(50, 60, 52, 52, 10).fillColor(C.azul).fill()
doc.fontSize(22).font('Helvetica-Bold').fillColor(C.branco).text('MC', 62, 76)

doc.fontSize(32).font('Helvetica-Bold').fillColor(C.branco).text('MeuCanga', 115, 68)
doc.fontSize(13).font('Helvetica').fillColor('#93C5FD').text('Finanças para Segurança Pública', 115, 103)

// Linha decorativa
doc.moveTo(50, 135).lineTo(545, 135).lineWidth(1).strokeColor('#3B82F6').stroke()

// Título principal
doc.fontSize(28).font('Helvetica-Bold').fillColor(C.branco).text('Plano Estratégico de', 50, 170)
doc.fontSize(36).font('Helvetica-Bold').fillColor('#FCD34D').text('Marketing & Vendas', 50, 205)
doc.fontSize(18).font('Helvetica').fillColor('#93C5FD').text('Conversão Free → PRO', 50, 248)

// Badge nível
doc.roundedRect(50, 295, 180, 30, 6).fillColor(C.âmbar).fill()
doc.fontSize(12).font('Helvetica-Bold').fillColor(C.branco).text('NÍVEL SENIOR — FINTECH', 60, 306)

// Descrição
doc.fontSize(11).font('Helvetica').fillColor('#BFDBFE')
  .text('Estratégia completa para conduzir o cliente desde\na primeira visita ao site até a assinatura PRO —\nbased em Product-Led Growth (PLG), as mesmas\nestratégias usadas por Nubank, Revolut e Inter.', 50, 350, { lineGap: 4 })

// Sumário rápido
const sumario = [
  '01  Modelo Mental — Product-Led Growth',
  '02  Jornada Completa do Cliente (AARRR)',
  '03  Landing Page — Conversão',
  '04  Onboarding — Os Primeiros 7 Minutos',
  '05  Paywall Inteligente — Dentro do App',
  '06  Estratégia de Preços e Ancoragem',
  '07  Retenção e Anti-Churn',
  '08  Crescimento Viral — Indicações',
  '09  Comunicação e Tom de Voz',
  '10  Métricas North Star',
  '11  Roadmap de Implementação',
]
let sy = 460
sumario.forEach(s => {
  doc.fontSize(9.5).font('Helvetica').fillColor('#93C5FD').text(s, 50, sy)
  sy += 16
})

// Rodapé capa
doc.fontSize(9).font('Helvetica').fillColor('#60A5FA').text('Confidencial — MeuCanga © 2026', 50, 800)
doc.fontSize(9).fillColor('#60A5FA').text('Documento gerado automaticamente', 350, 800, { align: 'right', width: 195 })

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 1 — MODELO MENTAL
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('01', C.azul)
espaço(4)
titulo('Modelo Mental: Product-Led Growth (PLG)', 1)
linha(C.azul, 1)
espaço(4)

paragrafo('A maior fintech do Brasil — Nubank — não cresceu com força de vendas tradicional. Cresceu porque o produto vende ele mesmo. O MeuCanga deve seguir exatamente o mesmo caminho: o plano Free não é caridade para o usuário, é o funil de vendas da empresa.')

destaque('PRINCÍPIO CENTRAL: Cada tela, cada limite atingido, cada notificação é uma oportunidade de conversão — sem ser agressivo, sem ser chato. O usuário deve sentir que ELE QUER o PRO, não que você está empurrando.')

espaço(4)
titulo('O que é PLG na prática?', 3)
item('O produto entrega valor ANTES de pedir dinheiro')
item('O usuário experimenta, se engaja e naturalmente quer mais')
item('O limite do Free é estratégico: alto o suficiente para provar valor, baixo o suficiente para frustrar quem usa sério')
item('Cada feature PRO que o usuário "toca" é um touchpoint de conversão')
item('O suporte é o marketing — usuário satisfeito indica, usuário indicado converte mais fácil')

espaço(8)
titulo('Por que PLG funciona para o MeuCanga?', 3)
paragrafo('Policiais formam comunidades fechadas e de alta confiança. Um PM não compra software indicado por anúncio — compra o que o colega de viatura usa e recomenda. PLG alimenta exatamente esse ciclo: o produto fica tão bom que a indicação acontece naturalmente.')

caixa('BENCHMARK — Como as fintechs líderes usam PLG', [
  'Nubank: conta grátis sem taxa → engajamento → cartão sem anuidade → crédito pessoal → investimentos',
  'Revolut: conta básica grátis → limites de câmbio → Revolut Premium/Metal',
  'Notion: uso pessoal grátis → convida equipe → empresa paga → enterprise',
  'MeuCanga: Free com limites → valor provado → PRO inevitável para quem usa sério',
], C.azul)

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 2 — JORNADA AARRR
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('02', C.cinzaEsc)
espaço(4)
titulo('Jornada Completa do Cliente — AARRR', 1)
linha(C.cinzaEsc, 1)
espaço(4)

paragrafo('O framework AARRR (criado por Dave McClure, Sequoia Capital) mapeia todo o ciclo de vida do cliente. Cada fase exige estratégias diferentes e métricas próprias.')

const fases = [
  ['AWARENESS', 'Descoberta', C.cinzaMed, 'O cliente ainda não te conhece. Precisa encontrar o MeuCanga antes de precisar dele.'],
  ['ACQUISITION', 'Captação', C.azul, 'Ele encontrou. Agora precisa criar conta. A landing page converte ou descarta aqui.'],
  ['ACTIVATION', 'Ativação', C.verde, 'Criou conta. Precisa ter o momento "AHA" — ver valor real em menos de 7 minutos.'],
  ['RETENTION', 'Retenção', C.âmbar, 'Voltou no dia seguinte? Na semana seguinte? Retenção = habit formation.'],
  ['REVENUE', 'Receita', '#7C3AED', 'Converteu para PRO. O momento que o negócio se sustenta.'],
  ['REFERRAL', 'Indicação', C.azulEsc, 'Indica para colegas. Custo de aquisição zero. Canal mais valioso de todos.'],
]

fases.forEach(([sigla, nome, cor, desc]) => {
  checkY(55)
  doc.roundedRect(50, y, 70, 42, 4).fillColor(cor).fill()
  doc.fontSize(8).font('Helvetica-Bold').fillColor(C.branco).text(sigla, 53, y + 7, { width: 64, align: 'center' })
  doc.fontSize(11).font('Helvetica-Bold').fillColor(C.branco).text(nome, 53, y + 20, { width: 64, align: 'center' })
  doc.fontSize(9.5).font('Helvetica').fillColor(C.cinza).text(desc, 132, y + 10, { width: PW - 82 })
  y += 52
})

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 3 — AWARENESS + LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('03', C.verde)
espaço(4)
titulo('Awareness — Como o Cliente te Encontra', 1)
linha(C.verde, 1)
espaço(4)

titulo('Canal Primário: SEO Semântico de Nicho', 2)
paragrafo('Este é o canal mais barato e mais poderoso para o MeuCanga. Policiais pesquisam no Google termos que nenhum concorrente está disputando:')
item('"como controlar RAS policial"')
item('"financeiro PM — planilha gratuita"')
item('"quanto ganha soldado com RAS por mês"')
item('"direitos RAS policial militar [estado]"')
item('"calculadora horas extras PM"')

paragrafo('Zero concorrência nessas palavras. Uma página de conteúdo bem escrita para cada termo captura tráfego qualificado permanentemente — sem pagar por clique.')

espaço(4)
titulo('Canal Comunidade (O mais eficiente do Brasil)', 2)
item('Grupos de WhatsApp e Facebook de PM por estado (PMSP, PMERJ, PMBA, etc.)')
item('Postar valor real: "Como calcular se seu RAS foi pago certo" — não anúncio')
item('Criar presença como especialista, não como vendedor')
item('Quando a comunidade confia, a indicação vira automática')

espaço(4)
titulo('Canal Parcerias Estratégicas', 2)
item('Associações de classe: ASPRA, ASSPESP, Sindicato dos Delegados')
item('Negociar acesso à base de associados em troca de desconto especial para membros')
item('Uma parceria com associação de 5.000 PMs = 5.000 leads qualificados de graça')

espaço(8)
titulo('Landing Page — Anatomia da Conversão', 2)
linha()

paragrafo('A landing page atual não tem seção de preços e o CTA é genérico. Abaixo está a estrutura ideal baseada em testes A/B de fintechs líderes:')

const landing = [
  ['NAV (fixo no topo)', 'Logo | Recursos | Preços | Entrar | [Criar conta grátis]', C.azul],
  ['HERO (above the fold)', '"Você trabalha num RAS e não sabe se vai receber certo. O MeuCanga sabe." + CTA primário', C.verde],
  ['PROVA SOCIAL', 'Número de usuários + depoimentos reais de PMs com nome e estado', C.âmbar],
  ['FEATURES', 'RAS, Escala, Finanças, Investimentos — com screenshots reais do app', C.cinzaMed],
  ['PRICING (obrigatório)', 'Cards Free vs PRO com toggle mensal/anual — o usuário decide antes de criar conta', C.vermelho],
  ['FAQ', 'Objeções reais: "Cancelo quando quiser?", "Funciona no meu estado?", "Dados seguros?"', C.azul],
  ['CTA FINAL', 'Banner com urgência real + garantia de 7 dias', C.verde],
]

landing.forEach(([sec, desc, cor]) => {
  checkY(36)
  doc.rect(50, y, 4, 30).fillColor(cor).fill()
  doc.fontSize(9).font('Helvetica-Bold').fillColor(cor).text(sec, 62, y + 3)
  doc.fontSize(9).font('Helvetica').fillColor(C.cinza).text(desc, 62, y + 15, { width: PW - 12 })
  y += 38
})

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 4 — ONBOARDING + ATIVAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('04', C.verde)
espaço(4)
titulo('Ativação — Os Primeiros 7 Minutos', 1)
linha(C.verde, 1)
espaço(4)

destaque('DADO CRÍTICO: 60% dos usuários que chegam ao dia 3 sem ter tido um momento "AHA" abandonam para sempre. O onboarding é a parte mais importante do produto.')

espaço(6)
titulo('Momento AHA do MeuCanga', 2)
paragrafo('O usuário lança o primeiro RAS e vê o valor projetado para o mês aparecer automaticamente no painel. Esse é o momento em que ele pensa: "isso é meu dinheiro que eu não estava controlando". A partir daí, ele está engajado.')

espaço(4)
titulo('Checklist Gamificada de Boas-Vindas', 2)
paragrafo('Deve aparecer no dashboard nos primeiros 7 dias, com barra de progresso visual:')

itemCheck('Conta criada ✓ (já vem marcado)')
itemCheck('Adicione sua primeira conta bancária', false)
itemCheck('Registre um RAS', false)
itemCheck('Adicione um lançamento financeiro', false)
itemCheck('Configure uma recorrência mensal', false)

paragrafo('Quando o usuário completa 100%: popup de upgrade com oferta especial de boas-vindas — 30% de desconto no primeiro mês, válido por 48 horas.')

espaço(6)
titulo('Sequência de Emails de Ativação', 2)

const emails = [
  ['D+0 (imediato)', '"Bem-vindo, [Nome]. Veja o que o MeuCanga descobriu sobre sua renda"', 'Guia de início + link direto para criar primeiro RAS'],
  ['D+2 (não ativou)', '"[Nome], seu painel está esperando por você"', 'Lembrete com screenshot do que ele vai encontrar'],
  ['D+7 (sem RAS criado)', '"Você sabia que PMs perdem em média R$340/mês em RAS?"', 'Conteúdo educacional + CTA para registrar primeiro RAS'],
  ['D+14 (ativo, sem PRO)', '"Você está usando 80% do seu limite Free"', 'Alerta de limite + oferta de upgrade com 20% off'],
]

emails.forEach(([quando, assunto, corpo]) => {
  checkY(52)
  doc.roundedRect(50, y, PW, 48, 4).fillColor('#EFF6FF').fill()
  doc.roundedRect(50, y, 4, 48, 0).fillColor(C.azul).fill()
  doc.fontSize(8).font('Helvetica-Bold').fillColor(C.azulEsc).text(quando, 62, y + 6)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.cinzaEsc).text(`Assunto: ${assunto}`, 62, y + 18, { width: PW - 20 })
  doc.fontSize(8.5).font('Helvetica').fillColor(C.cinzaMed).text(corpo, 62, y + 32, { width: PW - 20 })
  y += 56
})

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 5 — PAYWALL INTELIGENTE
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('05', C.âmbar)
espaço(4)
titulo('Paywall Inteligente — Dentro do App', 1)
linha(C.âmbar, 1)
espaço(4)

destaque('REGRA DE OURO: Nunca bloqueie o usuário com um muro frio. Mostre o valor PRIMEIRO, depois bloqueie. O usuário deve sentir que está sendo ajudado, não punido.')

espaço(6)
titulo('4 Tipos de Gatilho de Upgrade', 2)

caixa('TIPO 1 — Gatilho de Limite (Hard | quando atinge o teto)', [
  'TRIGGER: Usuário tenta criar o 5º RAS no mês',
  'MODAL: "Você usou seus 4 RAS do plano Free 🛡️. Os profissionais mais organizados',
  'registram em média 8 RAS por mês. Desbloqueie o PRO e tenha RAS ilimitado."',
  'CTAs: [Assinar PRO — R$21,90/mês]  [Continuar no Free]',
], C.âmbar)

caixa('TIPO 2 — Gatilho de Feature (Soft | quando toca em recurso bloqueado)', [
  'TRIGGER: Usuário clica em "Investimentos" ou "Agente IA"',
  'MODAL com preview desfocado da tela: "Acompanhe seus aportes, resgates e',
  'rentabilidade. Policiais PRO investem em média 18% mais da renda mensal."',
  'CTAs: [Desbloquear agora]  [Ver depois]',
], C.azul)

caixa('TIPO 3 — Gatilho Contextual (Insight | proativo, não reativo)', [
  'TRIGGER: Após 3 semanas de uso ativo',
  'BANNER no dashboard: "📊 Você registrou R$3.200 em RAS este mês. No PRO,',
  'você teria acesso à Visão Anual e saberia quanto disso vira desconto de IR."',
  'CTA: [Saiba mais] — abre modal de upgrade com contexto específico',
], C.verde)

caixa('TIPO 4 — Gatilho de Perda (Loss Aversion | o mais poderoso)', [
  'TRIGGER: Usuário está no limite de 3 contas (falta 1 para o teto)',
  'BANNER: "⚠️ Você está quase no limite de contas. Se precisar adicionar sua',
  'conta poupança, precisará do PRO. Garanta agora antes de precisar."',
  'Psicologia: medo de perder > desejo de ganhar (Kahneman, Prospect Theory)',
], C.vermelho)

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 6 — ESTRATÉGIA DE PREÇO
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('06', '#7C3AED')
espaço(4)
titulo('Estratégia de Preços e Psicologia de Compra', 1)
linha('#7C3AED', 1)
espaço(4)

titulo('Ancoragem de Preço — A Estrutura Ideal', 2)
paragrafo('Sempre apresentar o plano anual como padrão selecionado. Nubank, Spotify, iCloud, Notion — todos fazem isso. A razão é simples: quem vê o preço mensal primeiro pensa em custo mensal. Quem vê o anual pensa em investimento.')

checkY(90)
// Tabela de preços visual
doc.rect(50, y, PW / 3 - 5, 80).fillColor(C.cinzaCla).fill()
doc.rect(50 + PW / 3, y, PW / 3 - 5, 80).fillColor('#EEF2FF').fill()
doc.rect(50 + (PW / 3) * 2, y, PW / 3, 80).fillColor(C.azul).fill()

// FREE
doc.fontSize(10).font('Helvetica-Bold').fillColor(C.cinzaMed).text('FREE', 55, y + 8)
doc.fontSize(20).font('Helvetica-Bold').fillColor(C.cinzaEsc).text('R$ 0', 55, y + 22)
doc.fontSize(9).font('Helvetica').fillColor(C.cinzaMed).text('/mês, para sempre', 55, y + 46)
doc.fontSize(8).font('Helvetica').fillColor(C.cinzaMed).text('Com limites', 55, y + 62)

// MENSAL
doc.fontSize(10).font('Helvetica-Bold').fillColor(C.azul).text('PRO MENSAL', 50 + PW / 3 + 5, y + 8)
doc.fontSize(20).font('Helvetica-Bold').fillColor(C.cinzaEsc).text('R$21,90', 50 + PW / 3 + 5, y + 22)
doc.fontSize(9).font('Helvetica').fillColor(C.cinzaMed).text('/mês', 50 + PW / 3 + 5, y + 46)
doc.fontSize(8).font('Helvetica').fillColor(C.cinzaMed).text('Cobrado mensalmente', 50 + PW / 3 + 5, y + 62)

// ANUAL
doc.fontSize(10).font('Helvetica-Bold').fillColor('#FCD34D').text('PRO ANUAL ← PADRÃO', 50 + (PW / 3) * 2 + 5, y + 8)
doc.fontSize(20).font('Helvetica-Bold').fillColor(C.branco).text('R$18,25', 50 + (PW / 3) * 2 + 5, y + 22)
doc.fontSize(9).font('Helvetica').fillColor('#BFDBFE').text('/mês — R$219/ano', 50 + (PW / 3) * 2 + 5, y + 46)
doc.fontSize(8).font('Helvetica-Bold').fillColor('#FCD34D').text('ECONOMIZE R$43,80 (2 meses grátis)', 50 + (PW / 3) * 2 + 5, y + 62)
y += 92

espaço(8)
titulo('Ofertas por Gatilho — Urgência Real', 2)

const ofertas = [
  ['Oferta de Boas-Vindas', '30% off no primeiro mês', 'Ativada em D+0, expira em 48h após o cadastro', C.verde],
  ['Oferta de Limit Hit', '7 dias de PRO gratuito para testar', 'Ativada quando atinge qualquer limite pela primeira vez', C.azul],
  ['Oferta de Retorno', '20% off por 24h', 'Usuário sem login por 7 dias recebe email personalizado', C.âmbar],
  ['Oferta de Churn', '50% off por 3 meses', 'Exibida na tela de cancelamento — último recurso', C.vermelho],
]

ofertas.forEach(([nome, desc, trigger, cor]) => {
  checkY(44)
  doc.circle(58, y + 10, 5).fillColor(cor).fill()
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.cinzaEsc).text(nome, 72, y + 4)
  doc.fontSize(11).font('Helvetica-Bold').fillColor(cor).text(desc, 72, y + 18)
  doc.fontSize(8.5).font('Helvetica').fillColor(C.cinzaMed).text(`Trigger: ${trigger}`, 72, y + 32)
  y += 46
})

espaço(6)
titulo('Psicologia de Compra — O que Funciona', 2)
item('Anual como padrão — o usuário tem que escolher ativamente o mensal (mais barato = mais compromisso)')
item('Garantia de 7 dias destacada — elimina o medo do arrependimento')
item('CTA: "Começar PRO agora" — não "Assinar", não "Comprar" (verbo de ação, não de gasto)')
item('Preço por dia: "Menos de R$0,75/dia" — âncora com café da manhã')
item('Social proof no botão: "Junte-se a 847 PMs que já são PRO"')

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 7 — RETENÇÃO E ANTI-CHURN
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('07', C.verde)
espaço(4)
titulo('Retenção e Anti-Churn', 1)
linha(C.verde, 1)
espaço(4)

destaque('DADO DE MERCADO: Aumentar retenção em 5% pode aumentar lucro em até 95% (Bain & Company). Um usuário que cancela custa 5x mais para recuperar do que manter.')

espaço(6)
titulo('Early Warning System — Detectar Churn Antes', 2)
paragrafo('Monitorar comportamento e agir ANTES do cancelamento:')

const sinais = [
  ['Sem login há 7 dias', 'Email de reengajamento com resumo do que ele perdeu', C.âmbar],
  ['Sem login há 14 dias', 'Email "Novidades que você perdeu" com screenshot das novas features', C.âmbar],
  ['Sem login há 21 dias', 'Oferta de 20% de desconto no próximo mês — urgência de 48h', C.vermelho],
  ['Acessou a página de config', 'Banner proativo: "Precisa de ajuda? Fale conosco" antes de clicar em cancelar', C.azul],
]

sinais.forEach(([sinal, acao, cor]) => {
  checkY(44)
  doc.roundedRect(50, y, PW, 40, 4).strokeColor(cor).lineWidth(1).stroke()
  doc.rect(50, y, 3, 40).fillColor(cor).fill()
  doc.fontSize(9).font('Helvetica-Bold').fillColor(cor).text(`SINAL: ${sinal}`, 62, y + 6)
  doc.fontSize(9).font('Helvetica').fillColor(C.cinza).text(`AÇÃO: ${acao}`, 62, y + 22, { width: PW - 20 })
  y += 48
})

espaço(6)
titulo('Tela de Cancelamento com Fricção Inteligente', 2)
paragrafo('Quando o usuário clica em "Cancelar assinatura" em Configurações, em vez de cancelar direto, mostrar 3 etapas:')

const cancelSteps = [
  ['ETAPA 1 — Mostrar o que vai perder', 'Lista personalizada dos recursos PRO que ele REALMENTE usou no mês. Não genérica — dados reais: "Você exportou 3 PDFs e usou o Agente IA 7 vezes este mês."'],
  ['ETAPA 2 — Oferta de Pausa', '"Não quer cancelar agora? Pause sua assinatura por 30 dias — seus dados ficam seguros e você volta quando quiser." (Muitos aceitam — evita churn)'],
  ['ETAPA 3 — Último recurso', '"Qual o motivo?" → Se financeiro → "Entendemos. Que tal 50% de desconto por 3 meses?" → Muitos ficam com essa oferta.'],
]

cancelSteps.forEach(([etapa, desc]) => {
  checkY(52)
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.azul).text(etapa, 50, y)
  y += 16
  doc.fontSize(9.5).font('Helvetica').fillColor(C.cinza).text(desc, 50, y, { width: PW })
  y += doc.heightOfString(desc, { width: PW }) + 10
})

espaço(4)
titulo('Entrega de Valor Contínua — Nunca Deixar Esfriar', 2)
item('Email mensal automático: "Seu resumo financeiro de [mês]" gerado com dados reais do usuário')
item('Notificação: "Você registrou R$X em RAS este mês — sabia que isso representa Y% da sua renda?"')
item('Gamificação: streak de dias consecutivos usando o app (como Duolingo)')
item('Aniversário: "1 mês de PRO! Você economizou X horas de controle manual." — reforça valor percebido')

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 8 — INDICAÇÕES + COMUNICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('08', C.azulEsc)
espaço(4)
titulo('Crescimento Viral — Programa de Indicações', 1)
linha(C.azulEsc, 1)
espaço(4)

paragrafo('O policial que usa indica para o colega de viatura. É o canal mais barato e mais eficiente possível. Custo de aquisição via indicação = R$0 em mídia.')

caixa('ESTRUTURA DO PROGRAMA', [
  '→ Cada usuário recebe um link único de indicação (ex: meucanga.com.br/r/JOAO123)',
  '→ Indicado se cadastra → indicador ganha 1 mês gratuito de PRO',
  '→ Indicado ganha 30 dias de PRO para experimentar (sem cartão)',
  '→ Dashboard de indicações dentro do app: "Você indicou 3 amigos — ganhou 3 meses grátis"',
  '→ Mensagem pré-formatada para WhatsApp com 1 clique',
], C.azulEsc)

paragrafo('Mensagem pré-formatada sugerida:')
destaque('"Irmão, tô usando o MeuCanga para controlar meu RAS e financeiro. Tô economizando uma grana que nem sabia que existia. Cria sua conta grátis pelo meu link e você ainda ganha 30 dias do PRO: [link]"')

espaço(8)
badge('09', C.âmbar)
espaço(4)
titulo('Tom de Voz e Comunicação', 1)
linha(C.âmbar, 1)
espaço(4)

titulo('O que funciona com policiais militares:', 2)
item('Linguagem direta, objetiva, sem enrolação — como a comunicação militar')
item('Dados concretos, não promessas vagas: "R$340/mês em média" não "economize mais"')
item('Autoridade baseada em evidências: "Testado com 200 PMs de 5 estados"')
item('Pertencimento: "feito por quem entende a realidade da farda"')
item('Resposta rápida no suporte — policial valoriza eficiência e respeito ao tempo')

espaço(6)
titulo('O que NUNCA fazer:', 2)
item('Linguagem corporativa genérica ("solução integrada de gestão financeira")', C.vermelho)
item('Prometer sem provar ("o melhor app financeiro do Brasil")', C.vermelho)
item('Pop-ups agressivos a cada clique', C.vermelho)
item('Bloquear o app sem explicar o motivo do limite', C.vermelho)
item('Tratar PM como consumidor comum — eles têm cultura, hierarquia e linguagem própria', C.vermelho)

espaço(6)
titulo('Micro-copy que converte:', 2)
paragrafo('Cada texto dentro do app é uma oportunidade de reforçar valor ou converter. Exemplos:')

const copies = [
  ['Botão de upgrade', '"Assinar PRO agora"  →  NÃO: "Fazer upgrade"'],
  ['Limite atingido', '"Você chegou longe no Free — PRO não tem limites"  →  NÃO: "Limite excedido"'],
  ['Feature PRO bloqueada', '"Disponível no PRO — veja o que você pode fazer"  →  NÃO: "Recurso bloqueado"'],
  ['Garantia', '"7 dias de garantia — cancele quando quiser, sem perguntas"'],
  ['Preço', '"Menos de R$0,75 por dia — menos que um café"'],
]

copies.forEach(([contexto, texto]) => {
  checkY(38)
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.cinzaEsc).text(contexto, 50, y)
  doc.fontSize(9).font('Helvetica').fillColor(C.azul).text(texto, 50, y + 14, { width: PW })
  y += 34
})

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 9 — MÉTRICAS + ROADMAP
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

badge('10', C.verde)
espaço(4)
titulo('Métricas North Star — O que Medir', 1)
linha(C.verde, 1)
espaço(4)

paragrafo('Não é possível melhorar o que não se mede. Estas são as métricas que definem o sucesso do negócio:')

tabelaMetricas([
  ['Activation Rate (AHA em 7 dias)', '>40%', 'Semanal'],
  ['Free → PRO Conversion', '>8%', 'Mensal'],
  ['MRR (Receita Recorrente Mensal)', 'Crescer 20%/mês', 'Mensal'],
  ['Churn Rate', '<5%/mês', 'Mensal'],
  ['LTV (Lifetime Value)', '>R$262 (12 meses)', 'Mensal'],
  ['CAC (Custo por Aquisição)', '<R$30', 'Mensal'],
  ['NPS (Satisfação)', '>50', 'Trimestral'],
  ['DAU/MAU (Engajamento)', '>30%', 'Semanal'],
  ['Referral Rate (% que indica)', '>15%', 'Mensal'],
])

espaço(6)
badge('11', C.azul)
espaço(4)
titulo('Roadmap de Implementação', 1)
linha(C.azul, 1)
espaço(4)

const sprints = [
  {
    nome: 'SPRINT A — Conversão Imediata (semana 1)',
    cor: C.vermelho,
    items: [
      'Seção Pricing na landing page (Free vs PRO com toggle)',
      'Modal de paywall ao atingir limites (com mensagem de valor)',
      'Oferta de boas-vindas: 30% off nas primeiras 48h após cadastro',
      'Email D+0 automático após cadastro via Brevo',
      'Tela de cadastro com seleção de plano no passo final',
    ]
  },
  {
    nome: 'SPRINT B — Ativação e Retenção (semana 2-3)',
    cor: C.âmbar,
    items: [
      'Checklist de onboarding gamificado no dashboard',
      'Email D+7 para quem não ativou o app',
      'Tela de cancelamento com fricção inteligente e oferta de pausa',
      'Resumo mensal automático por email com dados do usuário',
      'Banner de oferta contextual no dashboard (D+14 sem PRO)',
    ]
  },
  {
    nome: 'SPRINT C — Crescimento Viral (semana 4+)',
    cor: C.verde,
    items: [
      'Programa de indicação com link único e dashboard de referrals',
      'Early warning system de churn (7, 14 e 21 dias sem login)',
      'SEO — páginas de conteúdo para termos de nicho policial',
      'Parcerias com associações de classe',
      'Gamificação: streak e conquistas dentro do app',
    ]
  },
]

sprints.forEach(sprint => {
  checkY(120)
  doc.fontSize(11).font('Helvetica-Bold').fillColor(sprint.cor).text(sprint.nome, 50, y)
  y += 18
  sprint.items.forEach(it => {
    item(it, sprint.cor, 55)
  })
  espaço(8)
})

// ═══════════════════════════════════════════════════════════════════════════════
// ÚLTIMA PÁGINA — CONCLUSÃO
// ═══════════════════════════════════════════════════════════════════════════════
novaSecao()

doc.rect(0, 0, 595, 842).fillColor(C.azulEsc).fill()

doc.fontSize(28).font('Helvetica-Bold').fillColor(C.branco).text('O Resumo de Tudo', 50, 60)
doc.moveTo(50, 100).lineTo(545, 100).lineWidth(1).strokeColor('#3B82F6').stroke()

doc.fontSize(11).font('Helvetica').fillColor('#BFDBFE').text(
  'O MeuCanga tem um produto forte e um nicho de mercado com demanda real e zero competição direta. O que falta é a arquitetura de conversão que transforma usuários em clientes pagantes.',
  50, 120, { width: PW, lineGap: 4 }
)

const conclusoes = [
  ['PLG primeiro', 'O produto convence melhor do que qualquer anúncio. Cada feature PRO que o usuário experimenta é um argumento de venda.'],
  ['Freemium estratégico', 'Os limites do Free foram calibrados para provar valor sem satisfazer completamente. Quem usa sério vai querer o PRO.'],
  ['Onboarding é tudo', 'Os primeiros 7 minutos decidem se o usuário fica para sempre ou abandona. Investir aqui é o maior ROI possível.'],
  ['Churn mata SaaS', 'Um cliente que cancela custa 5x mais para recuperar. Invista em retenção antes de em aquisição.'],
  ['Policiais indicam policiais', 'Custo de aquisição via comunidade e indicação é zero. Facilite esse caminho com o programa de referral.'],
]

let cy = 200
conclusoes.forEach(([titulo_c, desc]) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#FCD34D').text(`${titulo_c}`, 50, cy)
  doc.fontSize(10).font('Helvetica').fillColor('#93C5FD').text(desc, 50, cy + 16, { width: PW, lineGap: 3 })
  cy += doc.heightOfString(desc, { width: PW, lineGap: 3 }) + 30
})

doc.fontSize(9).font('Helvetica').fillColor('#60A5FA').text('MeuCanga © 2026 — Documento confidencial de estratégia interna', 50, 800)
doc.fontSize(9).fillColor('#60A5FA').text('Gerado automaticamente', 380, 800, { align: 'right', width: 165 })

doc.end()
console.log(`PDF gerado: ${OUT}`)

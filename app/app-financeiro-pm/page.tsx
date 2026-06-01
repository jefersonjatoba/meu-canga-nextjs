import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Melhor App Financeiro para Policial Militar em 2026 | MeuCanga',
  description: 'Comparamos os melhores aplicativos financeiros para policial militar. Descubra qual app realmente entende a realidade do PM: RAS, escalas, plantões e renda variável.',
  keywords: ['app financeiro policial', 'aplicativo PM financeiro', 'melhor app policial militar', 'controle financeiro PM', 'app RAS policial'],
  openGraph: {
    title: 'Melhor App Financeiro para Policial Militar em 2026',
    description: 'Qual app financeiro realmente funciona para PM? Comparamos as opções e apresentamos a ferramenta feita especificamente para policiais.',
    type: 'article',
  },
}

const apps = [
  {
    nome: 'MeuCanga',
    nota: 5,
    temRAS: true,
    temEscala: true,
    feitoPM: true,
    gratuito: true,
    destaque: 'Único app feito especificamente para policiais militares brasileiros',
  },
  {
    nome: 'Mobills',
    nota: 3,
    temRAS: false,
    temEscala: false,
    feitoPM: false,
    gratuito: false,
    destaque: 'App genérico. Bom para finanças pessoais básicas, mas sem funcionalidades para PM.',
  },
  {
    nome: 'Organizze',
    nota: 3,
    temRAS: false,
    temEscala: false,
    feitoPM: false,
    gratuito: false,
    destaque: 'Interface simples. Não entende renda variável de escalas nem RAS.',
  },
  {
    nome: 'Planilhas (Excel/Sheets)',
    nota: 2,
    temRAS: false,
    temEscala: false,
    feitoPM: false,
    gratuito: true,
    destaque: 'Flexível mas trabalhoso. Sem alertas, sem automações, sem mobile.',
  },
]

export default function AppFinanceiroPmPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <article>
        <header className="mb-10">
          <div className="inline-block bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            Comparativo 2026
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            Melhor App Financeiro para Policial Militar em 2026
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Testamos os principais aplicativos de finanças pessoais disponíveis no Brasil e avaliamos quais realmente atendem às necessidades do policial militar: RAS, escalas variáveis, plantões e renda irregular.
          </p>
        </header>

        <section className="prose prose-gray max-w-none">
          <h2>O que um app financeiro precisa ter para funcionar para PM?</h2>
          <p>
            Apps genéricos de finanças foram feitos para quem tem renda fixa previsível. A realidade do PM é diferente: salário base + RAS variável + extras eventuais. Para funcionar de verdade, o app precisa:
          </p>
          <ul>
            <li>Suportar <strong>registro de escalas e RAS</strong> por dia/turno</li>
            <li>Projetar a renda do mês antes do contracheque</li>
            <li>Separar renda fixa de renda variável automaticamente</li>
            <li>Ter <strong>alertas de confirmação de RAS</strong></li>
            <li>Funcionar bem no celular, durante o plantão</li>
          </ul>

          <h2>Comparativo dos principais apps</h2>
        </section>

        <div className="mt-6 mb-8 space-y-4">
          {apps.map((app) => (
            <div
              key={app.nome}
              className={`rounded-2xl border p-5 ${app.feitoPM ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{app.nome}</h3>
                    {app.feitoPM && (
                      <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        RECOMENDADO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{app.destaque}</p>
                </div>
                <div className="text-2xl font-extrabold text-gray-900 shrink-0">
                  {'★'.repeat(app.nota)}{'☆'.repeat(5 - app.nota)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${app.temRAS ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {app.temRAS ? '✓ Gestão de RAS' : '✗ Sem gestão de RAS'}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${app.temEscala ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {app.temEscala ? '✓ Escalas e plantões' : '✗ Sem escalas'}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${app.gratuito ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {app.gratuito ? '✓ Plano grátis' : 'Pago'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <section className="prose prose-gray max-w-none">
          <h2>Por que o MeuCanga é o melhor app para PM?</h2>
          <p>
            O MeuCanga não é um app genérico adaptado para policiais. Foi desenvolvido do zero, com base nas dores reais de quem vive a rotina do policial militar brasileiro.
          </p>

          <h3>Funcionalidades exclusivas para PM</h3>
          <ul>
            <li><strong>RAS em tempo real</strong>: registre cada escala e veja a projeção do mês instantaneamente</li>
            <li><strong>Alerta 72h</strong>: notificação automática antes da confirmação de cada RAS</li>
            <li><strong>Escala do mês</strong>: visão da próxima escala diretamente no dashboard</li>
            <li><strong>Relatório mensal automático</strong>: email com resumo de receitas, despesas e RAS</li>
            <li><strong>Conquistas e streaks</strong>: gamificação que mantém a disciplina financeira</li>
          </ul>

          <h3>Plano gratuito vs. PRO</h3>
          <p>
            O MeuCanga oferece plano gratuito para começar, com limites de lançamentos e funcionalidades. Para quem quer controle total — investimentos, agente IA e relatórios avançados — o plano PRO custa apenas <strong>R$ 21,90/mês</strong>.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-8">
            <h3 className="text-amber-900 font-bold text-lg mb-2">Comece grátis, sem cartão de crédito</h3>
            <p className="text-amber-800 mb-4">
              Crie sua conta agora e veja seu RAS projetado em menos de 2 minutos. Sem compromisso.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-amber-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
            >
              Criar conta gratuita →
            </Link>
          </div>
        </section>
      </article>

      <nav className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-4">Artigos relacionados:</p>
        <div className="flex flex-col gap-2">
          <Link href="/como-controlar-ras-policial" className="text-blue-600 hover:underline text-sm">
            → Como controlar o RAS do policial militar
          </Link>
          <Link href="/financeiro-policial-militar" className="text-blue-600 hover:underline text-sm">
            → Guia completo: finanças para policial militar
          </Link>
        </div>
      </nav>
    </main>
  )
}

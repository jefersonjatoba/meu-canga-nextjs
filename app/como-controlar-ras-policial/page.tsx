import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como Controlar o RAS de Policial Militar — Guia Completo | MeuCanga',
  description: 'Aprenda a controlar o RAS (Regime de Adicional por Serviço Extraordinário) da PM de forma simples. Calcule horas, projete ganhos e organize suas finanças de policial.',
  keywords: ['RAS policial', 'controle RAS PM', 'regime adicional serviço extraordinário', 'financeiro policial militar', 'app policial financeiro'],
  openGraph: {
    title: 'Como Controlar o RAS de Policial Militar',
    description: 'Calcule e projete seu RAS automaticamente. Ferramenta criada por policiais para policiais.',
    type: 'article',
  },
}

export default function ComoControlarRasPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <article>
        <header className="mb-10">
          <div className="inline-block bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            Guia Prático
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            Como Controlar o RAS de Policial Militar (Guia Completo 2026)
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            O RAS (Regime de Adicional por Serviço Extraordinário) é uma das maiores fontes de renda variável do policial militar. Mas sem controle, esse dinheiro some antes do fim do mês. Neste guia, você aprende a monitorar, projetar e organizar seu RAS de forma simples.
          </p>
        </header>

        <section className="prose prose-gray max-w-none">
          <h2>O que é o RAS?</h2>
          <p>
            O RAS é o pagamento por serviços extras que o policial realiza além da jornada regular. Diferente do salário fixo, o valor do RAS varia todo mês conforme o número de plantões, escalas e serviços extras realizados.
          </p>
          <p>
            Essa variabilidade cria um desafio financeiro: <strong>como planejar o mês sem saber exatamente quanto vai entrar?</strong>
          </p>

          <h2>Por que policiais perdem o controle do RAS?</h2>
          <ul>
            <li>O valor só aparece no contracheque no final do mês</li>
            <li>Não há como saber antecipadamente quantas horas serão pagas</li>
            <li>Descontos e impostos reduzem o valor final de forma imprevisível</li>
            <li>A mistura com salário fixo dificulta o rastreamento</li>
          </ul>

          <h2>Como calcular seu RAS antecipado</h2>
          <p>
            A fórmula básica é: <strong>Horas de RAS × Valor/hora = Projeção bruta</strong>
          </p>
          <p>
            O problema é que o valor/hora varia conforme a patente, tempo de serviço e categoria do serviço (diurno, noturno, feriado). Por isso, a forma mais prática é registrar cada escala conforme acontece.
          </p>

          <h2>Como o MeuCanga resolve isso</h2>
          <p>
            O MeuCanga foi desenvolvido especificamente para policiais militares. Com ele você:
          </p>
          <ul>
            <li><strong>Registra cada escala de RAS</strong> com data, horário e tipo de serviço</li>
            <li><strong>Vê a projeção do mês</strong> em tempo real conforme adiciona serviços</li>
            <li><strong>Recebe alertas 72h antes</strong> da confirmação de cada RAS</li>
            <li><strong>Separa o RAS do salário fixo</strong> automaticamente</li>
            <li><strong>Acompanha meses anteriores</strong> para entender seu padrão</li>
          </ul>

          <h2>Passo a passo: configurar seu RAS no MeuCanga</h2>
          <ol>
            <li>Crie sua conta gratuitamente</li>
            <li>Acesse a seção <strong>RAS</strong> no menu lateral</li>
            <li>Adicione cada escala: data, horário de início e fim</li>
            <li>O sistema projeta automaticamente o valor a receber</li>
            <li>Marque como confirmado quando o pagamento for efetivado</li>
          </ol>

          <h2>Dicas de controle financeiro para policiais</h2>
          <ol>
            <li><strong>Separe o RAS do salário</strong>: trate-o como renda extra, não como renda fixa</li>
            <li><strong>Reserve 30% do RAS</strong> antes de gastar — pague-se primeiro</li>
            <li><strong>Compare mês a mês</strong>: identifique épocas de mais/menos RAS no ano</li>
            <li><strong>Inclua o RAS nas suas metas</strong>: use-o para quitar dívidas ou investir</li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 my-8">
            <h3 className="text-blue-900 font-bold text-lg mb-2">Comece grátis agora</h3>
            <p className="text-blue-800 mb-4">
              Mais de 500 policiais militares já controlam seu RAS com o MeuCanga. Crie sua conta gratuita e veja seu RAS projetado em menos de 2 minutos.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Criar conta gratuita →
            </Link>
          </div>
        </section>
      </article>

      <nav className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-4">Artigos relacionados:</p>
        <div className="flex flex-col gap-2">
          <Link href="/financeiro-policial-militar" className="text-blue-600 hover:underline text-sm">
            → Guia completo: finanças para policial militar
          </Link>
          <Link href="/app-financeiro-pm" className="text-blue-600 hover:underline text-sm">
            → Melhor app financeiro para PM em 2026
          </Link>
        </div>
      </nav>
    </main>
  )
}

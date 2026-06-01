import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Finanças para Policial Militar — Como Organizar com RAS, Cartão e Investimentos | MeuCanga',
  description: 'Guia definitivo de finanças para policial militar: como controlar RAS, cartão de crédito, dívidas e investir com salário variável. Ferramenta gratuita para PMs.',
  keywords: ['finanças policial militar', 'controle financeiro PM', 'organizar dinheiro policial', 'RAS PM', 'investimento policial militar', 'app financeiro policial'],
  openGraph: {
    title: 'Finanças para Policial Militar — Guia Completo',
    description: 'Como organizar as finanças com salário variável, RAS e plantões. Guia criado para policiais militares.',
    type: 'article',
  },
}

export default function FinanceiroPoticialMilitarPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <article>
        <header className="mb-10">
          <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            Guia Definitivo
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            Finanças para Policial Militar: O Guia Que Ninguém te Deu na Academia
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Salário variável, RAS, plantões extras, cartão corporativo, previdência militar — a vida financeira de um policial militar é complexa. Este guia foi escrito para desmistificar o controle financeiro para quem vive na farda.
          </p>
        </header>

        <section className="prose prose-gray max-w-none">
          <h2>Por que policiais têm mais dificuldade financeira?</h2>
          <p>
            Não é falta de renda. O salário médio de um PM com RAS pode superar R$ 8.000/mês. O problema é a <strong>irregularidade da renda</strong>. Com salário fixo + RAS variável, muitos policiais tratam o mês como se o RAS fosse garantido — e quando ele cai menos, a conta não fecha.
          </p>
          <p>
            Soma-se a isso: plantões cansativos que levam ao consumismo impulsivo, pressão de custo de vida nas grandes cidades, e ausência de educação financeira específica para o contexto policial.
          </p>

          <h2>Os 4 pilares das finanças para PM</h2>

          <h3>1. Separar renda fixa de renda variável</h3>
          <p>
            Seu orçamento deve ser construído apenas com o salário fixo. O RAS é <em>bônus</em>. Se você planeja os gastos incluindo RAS e ele não vem, você entra no negativo.
          </p>
          <p><strong>Regra prática:</strong> cubra todas as despesas fixas com o salário-base. Destine o RAS para metas: dívidas, reserva de emergência ou investimentos.</p>

          <h3>2. Controlar o RAS em tempo real</h3>
          <p>
            Cada escala registrada = dinheiro projetado. Sem registro, você fica no escuro até o contracheque aparecer. Use um aplicativo que permita registrar as escalas conforme elas acontecem.
          </p>

          <h3>3. Cartão de crédito: aliado ou inimigo</h3>
          <p>
            O cartão de crédito é o maior vilão das finanças do PM quando usado sem controle. Com faturas que vencem em épocas ruins do mês, é fácil perder o ritmo.
          </p>
          <p><strong>Dica:</strong> nunca deixe o limite do cartão ultrapassar 30% da sua renda mensal total (salário + RAS médio dos últimos 3 meses).</p>

          <h3>4. Reserva de emergência primeiro</h3>
          <p>
            Policiais têm riscos profissionais específicos: afastamentos por lesão, processos, mudanças de escala. Uma reserva de emergência de 6 meses de gastos é fundamental antes de qualquer investimento.
          </p>

          <h2>Quanto um policial militar pode investir?</h2>
          <p>
            Com controle real das finanças, policiais com 5+ anos de carreira conseguem investir entre 15% e 30% da renda mensal. O segredo está em saber quanto sobra — e isso só é possível com registro preciso.
          </p>

          <h2>Como o MeuCanga ajuda policiais militares</h2>
          <p>
            O MeuCanga foi desenvolvido especificamente para a realidade do PM brasileiro. Não é um app genérico de finanças — foi construído do zero com funcionalidades que fazem sentido para quem está na farda:
          </p>
          <ul>
            <li><strong>Gestão de RAS</strong>: registre escalas e veja a projeção do mês</li>
            <li><strong>Alertas 72h</strong>: saiba antes quando um RAS será confirmado</li>
            <li><strong>Controle de cartão</strong>: visualize faturas e limite disponível</li>
            <li><strong>Metas financeiras</strong>: defina objetivos e acompanhe o progresso</li>
            <li><strong>Recorrências</strong>: automatize despesas fixas como aluguel e mensalidades</li>
            <li><strong>Relatório mensal</strong>: email automático com resumo de receitas e despesas</li>
          </ul>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 my-8">
            <h3 className="text-emerald-900 font-bold text-lg mb-2">Feito por policiais, para policiais</h3>
            <p className="text-emerald-800 mb-4">
              Crie sua conta gratuita e comece a controlar suas finanças hoje. Leva menos de 2 minutos.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Criar conta gratuita →
            </Link>
          </div>

          <h2>Checklist: você está no controle?</h2>
          <ul>
            <li>☐ Sei exatamente quanto entrou de RAS nos últimos 3 meses?</li>
            <li>☐ Tenho reserva de emergência de pelo menos 3 meses de gastos?</li>
            <li>☐ A fatura do cartão nunca ultrapassa 30% da minha renda?</li>
            <li>☐ Invisto ao menos 10% do que ganho todo mês?</li>
            <li>☐ Sei o saldo exato das minhas contas agora?</li>
          </ul>
          <p>Se você não sabe a resposta para a maioria dessas perguntas, está na hora de organizar as finanças. E a primeira ferramenta é o registro — feito todo dia, de forma simples.</p>
        </section>
      </article>

      <nav className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-4">Artigos relacionados:</p>
        <div className="flex flex-col gap-2">
          <Link href="/como-controlar-ras-policial" className="text-blue-600 hover:underline text-sm">
            → Como controlar o RAS do policial militar
          </Link>
          <Link href="/app-financeiro-pm" className="text-blue-600 hover:underline text-sm">
            → Melhor app financeiro para PM em 2026
          </Link>
        </div>
      </nav>
    </main>
  )
}

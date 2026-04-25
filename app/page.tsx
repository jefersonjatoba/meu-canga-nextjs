import { Button } from '@/components/Button'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-accent-blue via-precision-black to-accent-green">
      <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Fintech para Segurança Pública
          </h1>
          <p className="text-xl text-gray-200">
            Gerencie sua vida financeira, escala de trabalho e RAS em um único lugar.
            Pensado especialmente para profissionais de segurança pública.
          </p>
          <div className="flex gap-4 pt-4">
            <Link href="/auth/login">
              <Button size="lg" className="bg-white text-precision-black hover:bg-gray-100">
                Fazer Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-sm">Saldo Total</p>
                <p className="text-3xl font-bold text-success mt-2">R$ 12.500,00</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Receita', 'Despesa', 'Investido'].map((item) => (
                  <div key={item} className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                    <p className="text-white/50 text-xs">{item}</p>
                    <p className="text-white font-semibold text-sm mt-1">R$ 0,00</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-dark-gray py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-precision-black dark:text-light-gray mb-16">
            Recursos Principais
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Gerenciamento Financeiro',
                description: 'Controle receitas, despesas, investimentos e metas em um único lugar',
              },
              {
                title: 'Escala de Trabalho',
                description: 'Organize seus turnos e visualize sua agenda de trabalho',
              },
              {
                title: 'RAS (Regime Adicional)',
                description: 'Gerencie seus serviços adicionais e acompanhe valores',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-precision-black dark:text-light-gray mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-accent-blue dark:bg-dark-gray py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white dark:text-light-gray mb-6">
            Comece sua jornada financeira hoje
          </h2>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-accent-blue hover:bg-gray-100">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

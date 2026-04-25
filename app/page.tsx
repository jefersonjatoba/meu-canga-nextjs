import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-blue-600 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Meu Canga - Fintech</h1>
        <p className="text-xl mb-8">
          SaaS para gerenciamento financeiro de profissionais de segurança pública.
        </p>

        <div className="bg-white/10 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Plataforma Financeira</h2>
          <p>Gerencie escalas, RAS, lançamentos financeiros, investimentos e metas em um só lugar.</p>
          <p className="mt-4 text-sm text-blue-200">Desenvolvido exclusivamente para profissionais de segurança pública.</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded font-bold hover:bg-gray-100 transition-colors"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    </main>
  )
}

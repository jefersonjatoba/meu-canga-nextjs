export default function Home() {
  return (
    <main className="min-h-screen bg-blue-600 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Meu Canga - Fintech</h1>
        <p className="text-xl mb-8">
          SaaS para gerenciamento financeiro de profissionais de segurança pública.
        </p>

        <div className="bg-white/10 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Teste Simples</h2>
          <p>Se esta página está carregando sem refresh infinito, o problema estava no código JavaScript complexo.</p>
          <p className="mt-4 text-sm text-gray-300">Esta é uma página estática HTML pura - nenhum hook, nenhum NextAuth, nenhuma dinâmica.</p>
        </div>

        <div className="space-y-4">
          <a
            href="/auth/login"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded font-bold hover:bg-gray-100"
          >
            Fazer Login
          </a>
          <div className="text-sm text-gray-300">
            <p>Timestamp: {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </main>
  )
}

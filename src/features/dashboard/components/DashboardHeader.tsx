interface DashboardHeaderProps {
  periodoLabel: string
  userName?: string | null
}

export function DashboardHeader({ periodoLabel, userName }: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {firstName ? `Olá, ${firstName}.` : 'Painel Financeiro'}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Resumo financeiro de{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{periodoLabel}</span>
      </p>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title */}
      <div className="h-7 w-52 bg-gray-200 dark:bg-white/[0.07] rounded-lg" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-white/[0.07] rounded-2xl" />
        ))}
      </div>

      {/* Content rows */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 bg-gray-200 dark:bg-white/[0.07] rounded-2xl" />
        <div className="h-64 bg-gray-200 dark:bg-white/[0.07] rounded-2xl" />
      </div>

      <div className="h-48 bg-gray-200 dark:bg-white/[0.07] rounded-2xl" />
    </div>
  )
}

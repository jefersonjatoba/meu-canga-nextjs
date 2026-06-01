'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Achievement } from '@/lib/achievements'

interface AchievementsCardProps {
  achievements: Achievement[]
  streakDays: number
  longestStreak: number
}

export function AchievementsCard({ achievements, streakDays, longestStreak }: AchievementsCardProps) {
  const [expanded, setExpanded] = useState(false)

  const conquistadas = achievements.filter((achievement) => achievement.conquistado)
  const total = achievements.length
  const pct = Math.round((conquistadas.length / total) * 100)
  const exibidas = expanded ? achievements : achievements.slice(0, 6)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#1a1a1a]">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
          <Trophy size={16} className="text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Conquistas</p>
          <p className="text-xs text-gray-500">
            {conquistadas.length}/{total} desbloqueadas • melhor sequência {longestStreak}d
          </p>
        </div>

        {streakDays > 0 && (
          <div className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 dark:border-orange-800/40 dark:bg-orange-900/20">
            <span className="text-sm leading-none">🔥</span>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streakDays}d</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-gray-400">{pct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pb-3 sm:grid-cols-6">
        {exibidas.map((achievement) => (
          <div
            key={achievement.id}
            title={
              achievement.conquistado
                ? `${achievement.titulo} — ${achievement.descricao}`
                : `🔒 ${achievement.titulo} — ${achievement.descricao}`
            }
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl p-2 transition-all',
              achievement.conquistado
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : 'bg-gray-50 opacity-40 grayscale dark:bg-white/[0.03]',
            )}
          >
            <span className="text-xl leading-none">{achievement.emoji}</span>
            <span className="line-clamp-2 text-center text-[9px] font-medium leading-tight text-gray-600 dark:text-gray-400">
              {achievement.titulo}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-center gap-1 border-t border-gray-100 py-2.5 text-xs text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:border-white/[0.06] dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
      >
        {expanded ? (
          <>
            <ChevronUp size={13} /> Ver menos
          </>
        ) : (
          <>
            <ChevronDown size={13} /> Ver todas ({Math.max(total - 6, 0)} restantes)
          </>
        )}
      </button>
    </div>
  )
}

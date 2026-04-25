'use client'

import * as React from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

export interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-precision-black">
      {/* Minimal top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold text-gray-900 dark:text-gray-100 hover:opacity-80 transition-opacity"
        >
          Meu<span className="text-accent-blue">Canga</span>
        </Link>
        <ThemeToggle size="sm" />
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {(title || subtitle) && (
            <div className="mb-8 text-center">
              {title && (
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          &copy; {new Date().getFullYear()} MeuCanga. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}

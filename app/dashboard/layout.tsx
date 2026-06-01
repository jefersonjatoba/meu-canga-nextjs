'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SessionPing } from '@/components/ui/SessionPing'
import { ReactNode } from 'react'

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>
      <SessionPing />
      {children}
    </DashboardLayout>
  )
}

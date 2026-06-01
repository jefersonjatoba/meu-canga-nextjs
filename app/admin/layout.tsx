import type { ReactNode } from 'react'

export const metadata = {
  robots: 'noindex,nofollow',
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {children}
    </div>
  )
}

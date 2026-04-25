import { authConfig } from '@/lib/auth'
import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'

const { handlers } = NextAuth(authConfig)

// Next.js 16 requires explicit typed route handlers.
// NextAuth v5's handlers are compatible but need explicit type assertion.
export const GET = handlers.GET as (req: NextRequest) => Promise<Response>
export const POST = handlers.POST as (req: NextRequest) => Promise<Response>

// ─── /api/ras/agendamentos ────────────────────────────────────────────────────
// Alias routes that delegate to the canonical /api/ras handlers.
// Allows consuming code to use the more explicit path /api/ras/agendamentos.

import type { NextRequest } from 'next/server'
import { GET as getHandler, POST as postHandler } from '../route'

export const GET = (request: NextRequest) => getHandler(request)
export const POST = (request: NextRequest) => postHandler(request)

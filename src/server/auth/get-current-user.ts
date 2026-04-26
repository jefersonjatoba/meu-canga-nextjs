// Centralized auth access point for server-side code.
// All API routes and services MUST use this instead of calling getApiUser() directly.
// Swap the implementation here to change auth strategy project-wide.

import { getApiUser, type ApiUser } from '@/lib/api-auth'

export { type ApiUser }

export async function getCurrentUser(): Promise<ApiUser | null> {
  return getApiUser()
}

export async function requireCurrentUser(): Promise<ApiUser> {
  const user = await getApiUser()
  if (!user) throw new AuthError()
  return user
}

export class AuthError extends Error {
  readonly statusCode = 401
  constructor(message = 'Não autorizado') {
    super(message)
    this.name = 'AuthError'
  }
}

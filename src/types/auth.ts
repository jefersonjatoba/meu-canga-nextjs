export type User = {
  id: string
  email: string
  cpf?: string
  name?: string
  created_at: string
}

export type AuthError = {
  message: string
  code?: string
}
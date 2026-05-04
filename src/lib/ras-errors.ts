// RAS Error Codes — canonical error vocabulary for the RAS domain.
// Use these in service/repository layers and map them to HTTP responses in routes.

// ─── Error code enum ──────────────────────────────────────────────────────────

export enum RasErrorCode {
  DUPLICATE_RAS            = 'RAS_DUPLICATE',
  MONTHLY_HOURS_EXCEEDED   = 'RAS_MONTHLY_HOURS_EXCEEDED',
  ESCALA_CONFLICT          = 'RAS_ESCALA_CONFLICT',
  MIN_REST_VIOLATED        = 'RAS_MIN_REST_VIOLATED',
  TRANSITION_INVALID       = 'RAS_TRANSITION_INVALID',
  NOT_FOUND                = 'RAS_NOT_FOUND',
  FORBIDDEN                = 'RAS_FORBIDDEN',
}

// ─── Error response shape ─────────────────────────────────────────────────────

export interface RasErrorResponse {
  code: RasErrorCode
  message: string
  details?: Record<string, unknown>
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Constructs a typed RasErrorResponse.
 * Usage: throw rasError(RasErrorCode.NOT_FOUND, 'RAS não encontrado')
 */
export function rasError(
  code: RasErrorCode,
  message: string,
  details?: Record<string, unknown>,
): RasErrorResponse {
  return { code, message, details }
}

// ─── Domain error class ───────────────────────────────────────────────────────
// Throw this in services so routes can catch it and return the right HTTP status.

export class RasDomainError extends Error {
  readonly response: RasErrorResponse

  constructor(code: RasErrorCode, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'RasDomainError'
    this.response = rasError(code, message, details)
  }
}

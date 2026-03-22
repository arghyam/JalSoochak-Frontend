import type { ValidationFieldError } from '@/shared/components/common'

/**
 * Safely extracts and validates a `ValidationFieldError[]` from an unknown
 * API error response body.
 *
 * - Returns an empty array for any non-conforming input (null, missing keys,
 *   wrong types, non-JSON bodies, etc.) instead of throwing.
 * - Filters out malformed items so callers always receive a clean, typed array.
 * - Coerces `row` from string or number to number for resilience against
 *   API serialisation differences between endpoints.
 */
export function extractUploadValidationErrors(data: unknown): ValidationFieldError[] {
  if (data === null || typeof data !== 'object') return []

  const raw = data as Record<string, unknown>
  if (!Array.isArray(raw.fieldErrors)) return []

  return raw.fieldErrors
    .filter((item): item is Record<string, unknown> => {
      if (item === null || typeof item !== 'object') return false
      const it = item as Record<string, unknown>
      const rowOk = typeof it.row === 'number' || typeof it.row === 'string'
      const fieldOk = typeof it.field === 'string'
      const messageOk = typeof it.message === 'string'
      return rowOk && fieldOk && messageOk
    })
    .map((item) => ({
      row: Number(item.row),
      field: item.field as string,
      message: item.message as string,
    }))
    .filter((item) => !Number.isNaN(item.row))
}

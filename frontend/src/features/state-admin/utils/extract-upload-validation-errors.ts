import type { ValidationFieldError } from '@/shared/components/common'

/**
 * Safely extracts and validates a `ValidationFieldError[]` from an unknown
 * API error response body.
 *
 * - Returns an empty array for any non-conforming input (null, missing keys,
 *   wrong types, non-JSON bodies, etc.) instead of throwing.
 * - Filters out malformed items so callers always receive a clean, typed array.
 */
export function extractUploadValidationErrors(data: unknown): ValidationFieldError[] {
  if (data === null || typeof data !== 'object') return []

  const raw = data as Record<string, unknown>
  if (!Array.isArray(raw.fieldErrors)) return []

  return raw.fieldErrors
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).row === 'number' &&
        typeof (item as Record<string, unknown>).field === 'string' &&
        typeof (item as Record<string, unknown>).message === 'string'
    )
    .map((item) => ({
      row: item.row as number,
      field: item.field as string,
      message: item.message as string,
    }))
}

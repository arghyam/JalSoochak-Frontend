import type { ValidationFieldError } from '@/shared/components/common'

/**
 * Safely extracts and validates a `ValidationFieldError[]` from an unknown
 * API error response body.
 *
 * Handles two response shapes used by different endpoints:
 *   - `{ fieldErrors: [{ row, field, message }] }`   — staff upload
 *   - `{ errors:      [{ rowNumber, field, message }] }` — scheme / scheme-mappings upload
 *
 * In both cases `row`/`rowNumber` may be a number or a string; it is coerced
 * to a number. Items missing required keys or producing NaN rows are dropped.
 */
export function extractUploadValidationErrors(data: unknown): ValidationFieldError[] {
  if (data === null || typeof data !== 'object') return []

  const raw = data as Record<string, unknown>

  // Accept either the `fieldErrors` or `errors` array, whichever is present.
  const items = Array.isArray(raw.fieldErrors)
    ? raw.fieldErrors
    : Array.isArray(raw.errors)
      ? raw.errors
      : null

  if (!items) return []

  return items
    .filter((item): item is Record<string, unknown> => {
      if (item === null || typeof item !== 'object') return false
      const it = item as Record<string, unknown>
      // Accept `row` (staff) or `rowNumber` (schemes/mappings)
      const rawRow = it.row ?? it.rowNumber
      const rowOk = typeof rawRow === 'number' || typeof rawRow === 'string'
      const fieldOk = typeof it.field === 'string'
      const messageOk = typeof it.message === 'string'
      return rowOk && fieldOk && messageOk
    })
    .map((item) => {
      const rawRow = item.row ?? item.rowNumber
      return {
        row: Number(rawRow),
        field: item.field as string,
        message: item.message as string,
      }
    })
    .filter((item) => !Number.isNaN(item.row))
}

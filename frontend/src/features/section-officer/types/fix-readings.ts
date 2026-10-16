export interface YesterdayFinalReadingItem {
  schemeId: number
  schemeName: string
  yesterdayFinalReading: number
}

export interface YesterdayFinalReadingResponse {
  content: YesterdayFinalReadingItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface UpdateFinalReadingPayload {
  reading: number
}

export interface UpdateFinalReadingResponse {
  success: boolean
  schemeId: number
  readingDate: string | null
  finalReading: number
  message: string
}

/**
 * - `unauthorized`: 401 survived the token refresh — session must be ended.
 * - `forbidden`: 403 — user is not an SO/SDO or not mapped to the scheme.
 * - `rejected`: backend envelope with `success: false` (2xx, 400, 404).
 * - `unknown`: network/timeout/anything else.
 */
export type UpdateFinalReadingErrorKind = 'unauthorized' | 'forbidden' | 'rejected' | 'unknown'

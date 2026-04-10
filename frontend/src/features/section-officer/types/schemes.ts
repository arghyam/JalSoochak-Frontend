export interface SchemesListItem {
  schemeId: number
  stateSchemeId: string
  schemeName: string
  pumpOperatorNames: string[]
  lastReading: number
  lastReadingAt: string
  yesterdayReading: number
  lastWaterSupplied: number | null
}

export interface SchemesListResponse {
  content: SchemesListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface SchemeDetails {
  schemeId: number
  stateSchemeId: string
  schemeName: string
  lastSubmissionAt: string
  reportingRatePercent: number
}

export interface SchemeReadingRow {
  pumpOperatorId: number
  pumpOperatorName: string
  submittedAt: string
  readingValue: number
  waterSupplied: number
}

export interface SchemeReadingsResponse {
  content: SchemeReadingRow[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

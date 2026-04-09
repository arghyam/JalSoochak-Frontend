export interface PumpOperatorScheme {
  schemeId: number
  schemeName: string
  stateSchemeId: string
}

export interface PumpOperatorListItem extends Record<string, unknown> {
  id: number
  uuid: string
  name: string
  status: string
  schemes: PumpOperatorScheme[]
  reportingRatePercent: number | null
  lastSubmissionAt: string | null
  lastWaterSupplied: number | null
}

export interface PumpOperatorsListResponse {
  content: PumpOperatorListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface PumpOperatorDetails {
  id: number
  uuid: string
  name: string
  email: string
  phoneNumber: string
  status: string
  schemeId: number
  schemeName: string
  schemeLatitude: number
  schemeLongitude: number
  lastSubmissionAt: string | null
  firstSubmissionDate: string | null
  totalDaysSinceFirstSubmission: number | null
  submittedDays: number
  reportingRatePercent: number | null
  missedSubmissionDays: number | null
}

export interface PumpOperatorReading extends Record<string, unknown> {
  schemeId: number
  schemeName: string
  stateSchemeId: string
  readingAt: string
  readingValue: number
  waterSupplied: number | null
}

export interface PumpOperatorReadingsResponse {
  content: PumpOperatorReading[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface OperatorAttendanceRecord {
  date: string
  attendance: number
}

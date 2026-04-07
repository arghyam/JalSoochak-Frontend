export interface StatusOption {
  code: number
  label: string
}

export interface StatusOptionsResponse {
  success: boolean
  data: StatusOption[]
}

export interface AnomalyItem extends Record<string, unknown> {
  id: number
  uuid: string
  type: string
  userId: number
  schemeId: number
  tenantId: number
  aiReading: number | null
  aiConfidencePercentage: number | null
  overriddenReading: number | null
  retries: number
  previousReading: number | null
  previousReadingDate: string | null
  consecutiveDaysMissed: number
  reason: string | null
  remarks: string | null
  correlationId: string
  resolvedBy: number | null
  resolvedAt: string | null
  deletedAt: string | null
  deletedBy: number | null
  createdAt: string
  updatedAt: string
  scheme_name: string
  status: string
}

export interface AnomaliesListResponse {
  success: boolean
  page: number
  limit: number
  anomalies: AnomalyItem[]
  total_count: number
}

export interface EscalationItem extends Record<string, unknown> {
  id: number
  tenantId: number
  schemeId: number
  escalationType: string
  message: string
  correlationId: string
  userId: number
  remark: string | null
  createdAt: string
  updatedAt: string
  scheme_name: string
  resolution_status: string
}

export interface EscalationsListResponse {
  success: boolean
  page: number
  limit: number
  escalations: EscalationItem[]
  total_count: number
}

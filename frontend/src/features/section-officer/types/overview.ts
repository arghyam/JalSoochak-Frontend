export interface SchemesCountResponse {
  schemeCount: number
}

export interface DashboardStatsResponse {
  totalEscalationCount: number
  totalAnomalyCount: number
  totalWaterSupplied: number
}

export interface OutageReasonsResponse {
  userId: number
  startDate: string
  endDate: string
  schemeCount: number
  outageReasonSchemeCount: Record<string, number>
  dailyOutageReasonDistribution: Array<{
    date: string
    outageReasonSchemeCount: Record<string, number>
  }>
}

export interface NonSubmissionReasonsResponse {
  userId: number
  startDate: string
  endDate: string
  schemeCount: number
  nonSubmissionReasonSchemeCount: Record<string, number>
  dailyNonSubmissionReasonDistribution: Array<{
    date: string
    nonSubmissionReasonSchemeCount: Record<string, number>
  }>
}

export interface SubmissionStatusResponse {
  userId: number
  startDate: string
  endDate: string
  schemeCount: number
  compliantSubmissionCount: number
  anomalousSubmissionCount: number
  dailySubmissionSchemeDistribution: Array<{
    date: string
    submittedSchemeCount: number
  }>
}

import { apiClient } from '@/shared/lib/axios'
import type { WaterSupplyOutageData, EntityPerformance } from '@/features/dashboard/types'
import type {
  SchemesCountResponse,
  DashboardStatsResponse,
  OutageReasonsResponse,
  NonSubmissionReasonsResponse,
  SubmissionStatusResponse,
} from '../../types/overview'

type ApiEnvelope<T> = { data: T }

const EMPTY_OUTAGE_FIELDS = {
  electricityFailure: 0,
  pipelineLeak: 0,
  pumpFailure: 0,
  valveIssue: 0,
  sourceDrying: 0,
}

export function mapOutageReasonsToPieData(res: OutageReasonsResponse): WaterSupplyOutageData[] {
  return [
    {
      label: '',
      reasons: res.outageReasonSchemeCount,
      ...EMPTY_OUTAGE_FIELDS,
    },
  ]
}

export function mapOutageReasonsToHistogramData(
  res: OutageReasonsResponse
): WaterSupplyOutageData[] {
  return res.dailyOutageReasonDistribution.map((entry) => ({
    label: entry.date,
    reasons: entry.outageReasonSchemeCount,
    ...EMPTY_OUTAGE_FIELDS,
  }))
}

export function mapNonSubmissionToPieData(
  res: NonSubmissionReasonsResponse
): WaterSupplyOutageData[] {
  return [
    {
      label: '',
      reasons: res.nonSubmissionReasonSchemeCount,
      ...EMPTY_OUTAGE_FIELDS,
    },
  ]
}

export function mapNonSubmissionToHistogramData(
  res: NonSubmissionReasonsResponse
): WaterSupplyOutageData[] {
  return res.dailyNonSubmissionReasonDistribution.map((entry) => ({
    label: entry.date,
    reasons: entry.nonSubmissionReasonSchemeCount,
    ...EMPTY_OUTAGE_FIELDS,
  }))
}

export function mapSubmissionToPieData(res: SubmissionStatusResponse): WaterSupplyOutageData[] {
  return [
    {
      label: '',
      reasons: {
        compliant: res.compliantSubmissionCount,
        anomalous: res.anomalousSubmissionCount,
      },
      ...EMPTY_OUTAGE_FIELDS,
    },
  ]
}

export function mapSubmissionToBarData(res: SubmissionStatusResponse): EntityPerformance[] {
  const schemeCount = res.schemeCount > 0 ? res.schemeCount : 1
  return res.dailySubmissionSchemeDistribution.map((entry) => ({
    id: entry.date,
    name: entry.date,
    regularity: Math.min(100, (entry.submittedSchemeCount / schemeCount) * 100),
    coverage: 0,
    continuity: 0,
    quantity: 0,
    compositeScore: 0,
    status: 'good' as const,
  }))
}

export const overviewApi = {
  getSchemesCount: async (personId: string, tenantCode: string): Promise<SchemesCountResponse> => {
    const response = await apiClient.get<ApiEnvelope<SchemesCountResponse>>(
      `/api/v1/pumpoperator/person/${personId}/schemes/count`,
      { params: { tenantCode } }
    )
    return response.data.data
  },

  getDashboardStats: async (tenantId: string, userId: string): Promise<DashboardStatsResponse> => {
    const response = await apiClient.get<ApiEnvelope<DashboardStatsResponse>>(
      '/api/v1/analytics/officer/dashboard',
      { params: { tenant_id: tenantId, user_id: userId } }
    )
    return response.data.data
  },

  getOutageReasons: async (
    startDate: string,
    endDate: string
  ): Promise<{
    pieData: WaterSupplyOutageData[]
    histogramData: WaterSupplyOutageData[]
  }> => {
    const response = await apiClient.get<ApiEnvelope<OutageReasonsResponse>>(
      '/api/v1/analytics/outage-reasons/user',
      { params: { start_date: startDate, end_date: endDate } }
    )
    const res = response.data.data
    return {
      pieData: mapOutageReasonsToPieData(res),
      histogramData: mapOutageReasonsToHistogramData(res),
    }
  },

  getNonSubmissionReasons: async (
    startDate: string,
    endDate: string
  ): Promise<{
    pieData: WaterSupplyOutageData[]
    histogramData: WaterSupplyOutageData[]
  }> => {
    const response = await apiClient.get<ApiEnvelope<NonSubmissionReasonsResponse>>(
      '/api/v1/analytics/non-submission-reasons/user',
      { params: { start_date: startDate, end_date: endDate } }
    )
    const res = response.data.data
    return {
      pieData: mapNonSubmissionToPieData(res),
      histogramData: mapNonSubmissionToHistogramData(res),
    }
  },

  getSubmissionStatus: async (
    startDate: string,
    endDate: string
  ): Promise<{
    pieData: WaterSupplyOutageData[]
    barData: EntityPerformance[]
  }> => {
    const response = await apiClient.get<ApiEnvelope<SubmissionStatusResponse>>(
      '/api/v1/analytics/submission-status/user',
      { params: { start_date: startDate, end_date: endDate } }
    )
    const res = response.data.data
    return {
      pieData: mapSubmissionToPieData(res),
      barData: mapSubmissionToBarData(res),
    }
  },
}

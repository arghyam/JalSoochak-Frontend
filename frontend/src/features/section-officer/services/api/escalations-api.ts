import { apiClient } from '@/shared/lib/axios'
import type { EscalationsListResponse } from '../../types/anomalies-escalations'

export interface GetEscalationsParams {
  userId: string
  tenantId: string
  page: number
  limit: number
  schemeName?: string
  status?: string
  startDate?: string
  endDate?: string
}

export const escalationsApi = {
  getEscalationsList: async (params: GetEscalationsParams): Promise<EscalationsListResponse> => {
    const { userId, tenantId, page, limit, schemeName, status, startDate, endDate } = params
    const response = await apiClient.get<EscalationsListResponse>('/api/v1/analytics/escalations', {
      params: {
        user_id: userId,
        tenant_id: tenantId,
        page_number: page,
        limit,
        ...(schemeName ? { scheme_name: schemeName } : {}),
        ...(status ? { status } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      },
    })
    return response.data
  },
}

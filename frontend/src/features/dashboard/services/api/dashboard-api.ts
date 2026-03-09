import { apiClient } from '@/shared/lib/axios'
import type { DashboardData, DashboardLevel, TenantListResponse } from '../../types'
import { dashboardMockService } from '../mock/dashboard-mock'

export interface DashboardQueryParams {
  level: DashboardLevel
  entityId?: string
}

const ensureValidParams = ({ level, entityId }: DashboardQueryParams): void => {
  if (level !== 'central' && !entityId) {
    throw new Error(`entityId is required for dashboard level: ${level}`)
  }
}

export const dashboardApi = {
  getDashboardData: async ({ level, entityId }: DashboardQueryParams): Promise<DashboardData> => {
    ensureValidParams({ level, entityId })
    if (level === 'central') {
      return dashboardMockService.getDashboardData(level, entityId)
    }

    const endpoint = `/api/dashboard/${level}/${entityId}`
    const response = await apiClient.get<DashboardData>(endpoint)
    return response.data
  },
  getTenants: async (
    params: { page?: number; size?: number } = {}
  ): Promise<TenantListResponse> => {
    const { page = 0, size = 100 } = params
    const response = await apiClient.get<TenantListResponse>('/tenants', {
      params: { page, size },
    })
    return response.data
  },
}

import { publicApiClient } from '@/shared/lib/axios'
import type { DashboardData } from '../../types'
import type { DashboardQueryParams } from './dashboard-api'
import {
  isDashboardDataPayload,
  normalizeDashboardData,
} from './normalizers/dashboard-api-normalizers'

const ensureValidParams = ({ level, entityId }: DashboardQueryParams): void => {
  if (!entityId) {
    throw new Error(`entityId is required for dashboard level: ${level}`)
  }
}

export const dashboardDataApi = {
  getDashboardData: async ({ level, entityId }: DashboardQueryParams): Promise<DashboardData> => {
    ensureValidParams({ level, entityId })
    const endpoint = `/api/dashboard/${level}/${entityId}`
    const response = await publicApiClient.get<DashboardData>(endpoint)
    if (!isDashboardDataPayload(response.data)) {
      throw new Error('Dashboard API returned an invalid payload')
    }

    return normalizeDashboardData(response.data)
  },
}

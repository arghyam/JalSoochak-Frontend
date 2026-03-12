import { apiClient } from '@/shared/lib/axios'
import type { DashboardData, DashboardLevel } from '../../types'
import { dashboardMockService } from '../mock/dashboard-mock'

export interface DashboardQueryParams {
  level: DashboardLevel
  entityId?: string
}

export type TenantListItem = {
  id?: number
  uuid: string
  name: string
  status: string
}

export type TenantListContainer = {
  content?: TenantListItem[]
  totalElements?: number
}

export type TenantListResponse = {
  data?: TenantListContainer | { data?: TenantListContainer }
  content?: TenantListItem[]
  totalElements?: number
}

type DashboardDataProvider = {
  getDashboardData: (params: DashboardQueryParams) => Promise<DashboardData>
}

const ensureValidParams = ({ level, entityId }: DashboardQueryParams): void => {
  if (level !== 'central' && !entityId) {
    throw new Error(`entityId is required for dashboard level: ${level}`)
  }
}

const httpProvider: DashboardDataProvider = {
  getDashboardData: async ({ level, entityId }) => {
    ensureValidParams({ level, entityId })
    const endpoint =
      level === 'central' ? '/api/dashboard/central' : `/api/dashboard/${level}/${entityId}`
    const response = await apiClient.get<DashboardData>(endpoint)
    return response.data
  },
}

const mockProvider: DashboardDataProvider = {
  getDashboardData: ({ level, entityId }) => {
    ensureValidParams({ level, entityId })
    return dashboardMockService.getDashboardData(level, entityId)
  },
}

const DASHBOARD_PROVIDER = import.meta.env.VITE_DASHBOARD_DATA_PROVIDER ?? 'mock'

const provider: DashboardDataProvider = DASHBOARD_PROVIDER === 'http' ? httpProvider : mockProvider

export const dashboardApi = {
  getDashboardData: (params: DashboardQueryParams): Promise<DashboardData> => {
    return provider.getDashboardData(params)
  },
  getTenants: async (): Promise<TenantListResponse> => {
    const response = await apiClient.get<TenantListResponse>('/api/v1/tenants')
    return response.data
  },
}

import { apiClient } from '@/shared/lib/axios'
import type { DashboardData, DashboardLevel } from '../../types'
import { dashboardMockService } from '../mock/dashboard-mock'

export interface DashboardQueryParams {
  level: DashboardLevel
  entityId?: string
}

export type HierarchyType = 'LGD' | 'DEPARTMENT' | 'DEPARTMENTAL' | 'DEPT'

export type TenantListItem = {
  id?: number
  uuid: string
  name: string
  stateCode?: string
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

export type LocationHierarchyLevelName = {
  title?: string
}

export type LocationHierarchyLevel = {
  level?: number
  levelName?: LocationHierarchyLevelName[]
}

export type TenantLocationHierarchyData = {
  hierarchyType?: string
  levels?: LocationHierarchyLevel[]
}

export type TenantLocationHierarchyResponse = {
  data?: TenantLocationHierarchyData
}

export type TenantChildLocation = {
  id?: number
  uuid?: string
  title?: string
  lgdCode?: number
  parentId?: number
  status?: string
}

export type TenantChildLocationsResponse = {
  data?: TenantChildLocation[]
}

const normalizeHierarchyType = (hierarchyType: string) =>
  String(hierarchyType)
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()

const getHierarchyTypeCandidates = (hierarchyType: HierarchyType): string[] => {
  const normalized = normalizeHierarchyType(hierarchyType)
  if (normalized === 'LGD') {
    return ['LGD']
  }

  // Different backend environments may use different tokens for departmental hierarchy.
  return ['DEPARTMENT', 'DEPARTMENTAL', 'DEPT']
}

const hierarchyTypeResolutionCache = new Map<string, string>()

const getHierarchyCacheKey = (tenantId: number, hierarchyType: HierarchyType) => {
  const normalized = normalizeHierarchyType(hierarchyType)
  const modeKey = normalized === 'LGD' ? 'LGD' : 'DEPARTMENT'
  return `${tenantId}:${modeKey}`
}

const getOrderedHierarchyTypeCandidates = (tenantId: number, hierarchyType: HierarchyType) => {
  const cacheKey = getHierarchyCacheKey(tenantId, hierarchyType)
  const cached = hierarchyTypeResolutionCache.get(cacheKey)
  const baseCandidates = getHierarchyTypeCandidates(hierarchyType)
  if (!cached) {
    return baseCandidates
  }

  return [cached, ...baseCandidates.filter((candidate) => candidate !== cached)]
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
  getTenantLocationHierarchy: async (params: {
    tenantId: number
    hierarchyType: HierarchyType
    tenantCode?: string
  }): Promise<TenantLocationHierarchyResponse> => {
    const { tenantId, hierarchyType } = params
    const hierarchyTypeCandidates = getOrderedHierarchyTypeCandidates(tenantId, hierarchyType)
    const cacheKey = getHierarchyCacheKey(tenantId, hierarchyType)
    let lastError: unknown = null

    for (const candidate of hierarchyTypeCandidates) {
      const endpoint = `/api/v1/tenants/${tenantId}/location-hierarchy/${candidate}`
      try {
        const response = await apiClient.get<TenantLocationHierarchyResponse>(endpoint)
        hierarchyTypeResolutionCache.set(cacheKey, candidate)
        return response.data
      } catch (error) {
        lastError = error
      }
    }

    throw lastError
  },
  getTenantChildLocations: async (params: {
    tenantId: number
    hierarchyType: HierarchyType
    parentId: number
    tenantCode?: string
  }): Promise<TenantChildLocationsResponse> => {
    const { tenantId, hierarchyType, parentId } = params
    const hierarchyTypeCandidates = getOrderedHierarchyTypeCandidates(tenantId, hierarchyType)
    const cacheKey = getHierarchyCacheKey(tenantId, hierarchyType)
    let lastError: unknown = null

    for (const candidate of hierarchyTypeCandidates) {
      const endpoint = `/api/v1/tenants/${tenantId}/locations/${candidate}/children/${parentId}`
      try {
        const response = await apiClient.get<TenantChildLocationsResponse>(endpoint)
        hierarchyTypeResolutionCache.set(cacheKey, candidate)
        return response.data
      } catch (error) {
        lastError = error
      }
    }

    throw lastError
  },
}

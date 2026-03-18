import { apiClient } from '@/shared/lib/axios'
import { isAxiosError } from 'axios'
import type {
  AverageSchemeRegularityQueryParams,
  AverageSchemeRegularityResponse,
  NationalDashboardQueryParams,
  NationalDashboardResponse,
  AverageWaterSupplyPerRegionQueryParams,
  AverageWaterSupplyPerRegionResponse,
  DashboardData,
  DashboardLevel,
  OutageReasonsQueryParams,
  OutageReasonsResponse,
  ReadingComplianceQueryParams,
  ReadingComplianceResponse,
  PumpOperatorDetailsQueryParams,
  PumpOperatorDetailsResponse,
  PumpOperatorsBySchemeQueryParams,
  PumpOperatorsBySchemeResponse,
  ReadingSubmissionRateQueryParams,
  ReadingSubmissionRateResponse,
  SchemePerformanceQueryParams,
  SchemePerformanceResponse,
  SubmissionStatusQueryParams,
  SubmissionStatusResponse,
} from '../../types'
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

const TENANTS_PAGE_SIZE = 10
const TENANTS_MAX_PAGES = 1000

const toTenantListContainer = (value: unknown): TenantListContainer | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<TenantListContainer>
  return {
    content: Array.isArray(candidate.content) ? (candidate.content as TenantListItem[]) : undefined,
    totalElements:
      typeof candidate.totalElements === 'number' ? candidate.totalElements : undefined,
  }
}

const resolveTenantListContainer = (value: TenantListResponse | undefined): TenantListContainer => {
  if (!value) {
    return {}
  }

  const firstLevel = toTenantListContainer(value)
  const secondLevel =
    value.data && typeof value.data === 'object'
      ? toTenantListContainer((value.data as { data?: unknown }).data)
      : null
  const dataLevel = toTenantListContainer(value.data)

  return secondLevel ?? dataLevel ?? firstLevel ?? {}
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

const hasInvalidHierarchyIndicator = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return false
  }

  const responseData = error.response?.data as { type?: unknown; message?: unknown } | undefined

  if (typeof responseData?.type === 'string' && responseData.type === 'invalid-hierarchy') {
    return true
  }

  if (
    typeof responseData?.message === 'string' &&
    responseData.message.toLowerCase().includes('invalid-hierarchy')
  ) {
    return true
  }

  return false
}

const shouldRethrowHierarchyResolutionError = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return true
  }

  const status = error.response?.status

  if (status === 401 || status === 403) {
    return true
  }

  if (typeof status === 'number' && status >= 500) {
    return true
  }

  const isNetworkOrTimeoutError =
    !error.response ||
    error.code === 'ECONNABORTED' ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('timeout'))

  if (isNetworkOrTimeoutError) {
    return true
  }

  return !hasInvalidHierarchyIndicator(error)
}

type DashboardDataProvider = {
  getDashboardData: (params: DashboardQueryParams) => Promise<DashboardData>
}

const isDashboardDataPayload = (value: unknown): value is DashboardData => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<DashboardData>

  return (
    Array.isArray(candidate.kpis) &&
    Array.isArray(candidate.mapData) &&
    Array.isArray(candidate.demandSupply) &&
    Array.isArray(candidate.readingSubmissionStatus) &&
    Array.isArray(candidate.readingCompliance) &&
    Array.isArray(candidate.pumpOperators) &&
    Array.isArray(candidate.waterSupplyOutages) &&
    Array.isArray(candidate.topPerformers) &&
    Array.isArray(candidate.worstPerformers) &&
    Array.isArray(candidate.regularityData) &&
    Array.isArray(candidate.continuityData)
  )
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

const httpWithMockFallbackProvider: DashboardDataProvider = {
  getDashboardData: async (params) => {
    try {
      const response = await httpProvider.getDashboardData(params)
      if (isDashboardDataPayload(response)) {
        return response
      }
    } catch (error) {
      console.warn('Dashboard API failed, falling back to mock data.', error)
    }

    return mockProvider.getDashboardData(params)
  },
}

const DASHBOARD_PROVIDER = import.meta.env.VITE_DASHBOARD_DATA_PROVIDER ?? 'http-first'

const provider: DashboardDataProvider =
  DASHBOARD_PROVIDER === 'mock'
    ? mockProvider
    : DASHBOARD_PROVIDER === 'http'
      ? httpProvider
      : httpWithMockFallbackProvider

export const dashboardApi = {
  getDashboardData: (params: DashboardQueryParams): Promise<DashboardData> => {
    if (params.level === 'central') {
      return mockProvider.getDashboardData(params)
    }

    return provider.getDashboardData(params)
  },
  getNationalDashboard: async (
    params: NationalDashboardQueryParams
  ): Promise<NationalDashboardResponse> => {
    const response = await apiClient.get<NationalDashboardResponse>(
      '/api/v1/analytics/national/dashboard',
      {
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
        },
      }
    )

    return response.data
  },
  getAverageWaterSupplyPerRegion: async (
    params: AverageWaterSupplyPerRegionQueryParams
  ): Promise<AverageWaterSupplyPerRegionResponse> => {
    const response = await apiClient.get<AverageWaterSupplyPerRegionResponse>(
      '/api/v1/analytics/water-supply/average-per-region',
      {
        params: {
          tenant_id: params.tenantId,
          parent_lgd_id: params.parentLgdId,
          parent_department_id: params.parentDepartmentId,
          scope: params.scope ?? 'child',
          start_date: params.startDate,
          end_date: params.endDate,
        },
      }
    )

    return response.data
  },
  getAverageSchemeRegularity: async (
    params: AverageSchemeRegularityQueryParams
  ): Promise<AverageSchemeRegularityResponse> => {
    const response = await apiClient.get<AverageSchemeRegularityResponse>(
      '/api/v1/analytics/scheme-regularity/average',
      {
        params: {
          parent_lgd_id: params.parentLgdId,
          parent_department_id: params.parentDepartmentId,
          scope: params.scope ?? 'child',
          start_date: params.startDate,
          end_date: params.endDate,
        },
      }
    )

    return response.data
  },
  getReadingSubmissionRate: async (
    params: ReadingSubmissionRateQueryParams
  ): Promise<ReadingSubmissionRateResponse> => {
    const response = await apiClient.get<ReadingSubmissionRateResponse>(
      '/api/v1/analytics/reading-submission-rate',
      {
        params: {
          parent_lgd_id: params.parentLgdId,
          parent_department_id: params.parentDepartmentId,
          scope: params.scope ?? 'child',
          start_date: params.startDate,
          end_date: params.endDate,
        },
      }
    )

    return response.data
  },
  getSchemePerformance: async (
    params: SchemePerformanceQueryParams
  ): Promise<SchemePerformanceResponse> => {
    const response = await apiClient.get<SchemePerformanceResponse>(
      '/api/v1/analytics/schemes/dashboard',
      {
        params: {
          parent_lgd_id: params.parentLgdId,
          parent_department_id: params.parentDepartmentId,
          start_date: params.startDate,
          end_date: params.endDate,
          scheme_count: params.schemeCount ?? 10,
        },
      }
    )

    return response.data
  },
  getPumpOperatorDetails: async (
    params: PumpOperatorDetailsQueryParams
  ): Promise<PumpOperatorDetailsResponse> => {
    const response = await apiClient.get<PumpOperatorDetailsResponse>(
      `/api/v1/pumpoperator/pump-operators/${params.pumpOperatorId}`,
      {
        params: {
          tenant_code: params.tenant_code,
        },
      }
    )

    return response.data
  },
  getPumpOperatorsByScheme: async (
    params: PumpOperatorsBySchemeQueryParams
  ): Promise<PumpOperatorsBySchemeResponse> => {
    const response = await apiClient.get<PumpOperatorsBySchemeResponse>(
      '/api/v1/pumpoperator/pump-operators/by-scheme',
      {
        params: {
          tenant_code: params.tenant_code,
          scheme_id: params.scheme_id,
        },
      }
    )

    return response.data
  },
  getReadingCompliance: async (
    params: ReadingComplianceQueryParams
  ): Promise<ReadingComplianceResponse> => {
    const response = await apiClient.get<ReadingComplianceResponse>(
      '/api/v1/pumpoperator/pump-operators/reading-compliance',
      {
        params: {
          tenant_code: params.tenant_code,
        },
      }
    )

    return response.data
  },
  getSubmissionStatus: async (
    params: SubmissionStatusQueryParams
  ): Promise<SubmissionStatusResponse> => {
    const response = await apiClient.get<SubmissionStatusResponse>(
      '/api/v1/analytics/submission-status/user',
      {
        params: {
          user_id: params.userId,
          start_date: params.startDate,
          end_date: params.endDate,
        },
      }
    )

    return response.data
  },
  getOutageReasons: async (params: OutageReasonsQueryParams): Promise<OutageReasonsResponse> => {
    const response = await apiClient.get<OutageReasonsResponse>(
      '/api/v1/analytics/outage-reasons',
      {
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
          parent_lgd_id: params.parentLgdId,
          parent_department_id: params.parentDepartmentId,
        },
      }
    )

    return response.data
  },
  getTenants: async (): Promise<TenantListResponse> => {
    const tenants: TenantListItem[] = []
    let page = 0
    let iterations = 0
    let totalElements = 0
    let lastPayload: TenantListResponse | undefined

    while (true) {
      if (iterations >= TENANTS_MAX_PAGES) {
        const lastResolved = resolveTenantListContainer(lastPayload)
        throw new Error(
          `getTenants pagination exceeded ${TENANTS_MAX_PAGES} pages (page=${page}, pageSize=${TENANTS_PAGE_SIZE}, tenantsCollected=${tenants.length}, totalElements=${lastResolved.totalElements ?? totalElements ?? 'unknown'})`
        )
      }
      iterations += 1

      const response = await apiClient.get<TenantListResponse>('/api/v1/tenants', {
        params: { page, size: TENANTS_PAGE_SIZE },
      })
      const payload = response.data
      const resolved = resolveTenantListContainer(payload)
      const content = resolved.content ?? []

      lastPayload = payload
      tenants.push(...content)
      totalElements = resolved.totalElements ?? tenants.length

      if (tenants.length >= totalElements || content.length === 0) {
        break
      }

      page += 1
    }

    const aggregatedContainer: TenantListContainer = {
      content: tenants,
      totalElements,
    }

    if (lastPayload?.data && typeof lastPayload.data === 'object' && 'data' in lastPayload.data) {
      return {
        ...lastPayload,
        data: {
          ...(lastPayload.data as { data?: TenantListContainer }),
          data: aggregatedContainer,
        },
        content: tenants,
        totalElements,
      }
    }

    return {
      ...lastPayload,
      data: aggregatedContainer,
      content: tenants,
      totalElements,
    }
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
        if (shouldRethrowHierarchyResolutionError(error)) {
          throw error
        }
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
        if (shouldRethrowHierarchyResolutionError(error)) {
          throw error
        }
        lastError = error
      }
    }

    throw lastError
  },
}

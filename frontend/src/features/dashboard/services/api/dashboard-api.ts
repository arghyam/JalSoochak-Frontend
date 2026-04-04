import { apiClient } from '@/shared/lib/axios'
import { isAxiosError } from 'axios'
import type {
  AverageSchemeRegularityQueryParams,
  AverageSchemeRegularityResponse,
  GeoJsonGeometry,
  NationalSchemeRegularityPeriodicQueryParams,
  NationalSchemeRegularityPeriodicResponse,
  NationalDashboardQueryParams,
  NationalDashboardResponse,
  AverageWaterSupplyPerRegionQueryParams,
  AverageWaterSupplyPerRegionResponse,
  DashboardData,
  DashboardLevel,
  OutageReasonsQueryParams,
  OutageReasonsPeriodicQueryParams,
  OutageReasonsPeriodicResponse,
  OutageReasonsResponse,
  ReadingComplianceQueryParams,
  ReadingComplianceResponse,
  PumpOperatorDetailsQueryParams,
  PumpOperatorDetailsResponse,
  PumpOperatorsBySchemeQueryParams,
  PumpOperatorsBySchemeResponse,
  ReadingSubmissionRateQueryParams,
  ReadingSubmissionRateResponse,
  SchemeRegularityPeriodicQueryParams,
  SchemeRegularityPeriodicResponse,
  SchemePerformanceQueryParams,
  SchemePerformanceResponse,
  SubmissionStatusQueryParams,
  SubmissionStatusResponse,
  TenantBoundaryQueryParams,
  TenantBoundaryResponse,
  WaterQuantityPeriodicQueryParams,
  WaterQuantityPeriodicResponse,
} from '../../types'

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

export type TenantPublicDateFormatConfig = {
  dateFormat: string | null
  timeFormat: string | null
  timezone: string | null
}

export type TenantPublicConfig = {
  averageMembersPerHousehold: number
  dateFormatScreen: TenantPublicDateFormatConfig
}

const TENANTS_PAGE_SIZE = 10
const TENANTS_MAX_PAGES = 1000

type RawPumpOperatorDetailsResponse = Omit<PumpOperatorDetailsResponse, 'data'> & {
  data: Omit<PumpOperatorDetailsResponse['data'], 'missedSubmissionDays'> & {
    missedSubmissionDays: number | string[] | null
  }
}

type RawNationalDashboardPayload = {
  success?: boolean
  data?: NationalDashboardResponse
}

type RawAverageWaterSupplyPerRegionPayload = {
  success?: boolean
  data?: AverageWaterSupplyPerRegionResponse
}

type WrappedAnalyticsResponse<T> = {
  success?: boolean
  data?: T
}

type ApiEnvelope<T> = {
  data: T
}

type TenantPublicConfigMap = {
  DATE_FORMAT_SCREEN?: TenantPublicDateFormatConfig
  AVERAGE_MEMBERS_PER_HOUSEHOLD?: { value?: string | null }
}

type TenantBoundaryChildRegionAlias = {
  childLgdId?: number
  childLgdTitle?: string
  childDepartmentId?: number
  childDepartmentTitle?: string
  childBoundaryGeoJson?: string | null
  boundaryGeoJson?: unknown
}

const parseBoundaryGeoJson = (value: unknown, context: string) => {
  if (value == null) {
    return null
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      throw new Error(`Invalid ${context} response: boundary GeoJSON is not valid JSON`)
    }
  }

  return value && typeof value === 'object' ? value : null
}

const isGeoJsonGeometry = (value: unknown): value is GeoJsonGeometry =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof (value as { type?: unknown }).type === 'string'

type AnalyticsChildRegionAlias = {
  lgdId?: number
  departmentId?: number
  title?: string
  childLgdId?: number
  childDepartmentId?: number
  childLgdTitle?: string
  childDepartmentTitle?: string
}

const normalizeMissedSubmissionDays = (
  value: RawPumpOperatorDetailsResponse['data']['missedSubmissionDays']
) => {
  if (Array.isArray(value)) {
    return value.length
  }

  return typeof value === 'number' ? value : null
}

const normalizeNationalDashboardResponse = (
  response: NationalDashboardResponse | RawNationalDashboardPayload
): NationalDashboardResponse => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid national dashboard response: expected an object payload')
  }

  if ('stateWiseQuantityPerformance' in response) {
    return response
  }

  const payload = response.data
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid national dashboard response: missing data payload')
  }

  if (!('stateWiseQuantityPerformance' in payload)) {
    throw new Error(
      'Invalid national dashboard response: data payload is missing stateWiseQuantityPerformance'
    )
  }

  return payload
}

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

const unwrapAnalyticsResponse = <T>(
  response: T | WrappedAnalyticsResponse<T>,
  context: string
): T | undefined => {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as WrappedAnalyticsResponse<T>).data
    if (data == null) {
      throw new Error(`Invalid ${context} response: wrapped payload is missing data`)
    }

    return data
  }

  return response as T
}

const normalizeAnalyticsChildRegion = <T extends AnalyticsChildRegionAlias>(region: T): T => ({
  ...region,
  lgdId: region.lgdId !== undefined ? region.lgdId : (region.childLgdId ?? 0),
  departmentId:
    region.departmentId !== undefined ? region.departmentId : (region.childDepartmentId ?? 0),
  title:
    region.title !== undefined
      ? region.title
      : (region.childDepartmentTitle ?? region.childLgdTitle ?? ''),
})

const normalizeAverageWaterSupplyResponse = (
  response: AverageWaterSupplyPerRegionResponse
): AverageWaterSupplyPerRegionResponse => ({
  ...response,
  childRegions: Array.isArray(response.childRegions)
    ? response.childRegions.map((region) => normalizeAnalyticsChildRegion(region))
    : [],
})

const normalizeAverageSchemeRegularityResponse = (
  response: AverageSchemeRegularityResponse
): AverageSchemeRegularityResponse => ({
  ...response,
  childRegions: Array.isArray(response.childRegions)
    ? response.childRegions.map((region) => normalizeAnalyticsChildRegion(region))
    : [],
})

const normalizeTenantBoundaryChildRegion = <T extends TenantBoundaryChildRegionAlias>(
  region: T,
  context: string
) => ({
  ...region,
  childLgdId: region.childLgdId ?? region.childDepartmentId ?? 0,
  childLgdTitle: region.childLgdTitle ?? region.childDepartmentTitle ?? '',
  boundaryGeoJson: (() => {
    const parsed = parseBoundaryGeoJson(
      region.boundaryGeoJson ?? region.childBoundaryGeoJson,
      `${context} child region`
    )
    return isGeoJsonGeometry(parsed) ? parsed : null
  })(),
})

const normalizeTenantBoundaryResponse = (
  response: TenantBoundaryResponse,
  context = 'tenant boundary analytics'
): TenantBoundaryResponse => ({
  ...response,
  parsedBoundaryGeoJson: (() => {
    const parsed = parseBoundaryGeoJson(response.boundaryGeoJson, context)
    return isGeoJsonGeometry(parsed) ? parsed : null
  })(),
  childRegions: Array.isArray(response.childRegions)
    ? response.childRegions.map((region) => normalizeTenantBoundaryChildRegion(region, context))
    : [],
})

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

const isDashboardDataPayload = (value: unknown): value is DashboardData => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<DashboardData>
  const kpis = candidate.kpis as Partial<DashboardData['kpis']> | undefined
  const hasValidKpis =
    !!kpis &&
    typeof kpis === 'object' &&
    Number.isFinite(kpis.totalSchemes) &&
    Number.isFinite(kpis.totalRuralHouseholds) &&
    Number.isFinite(kpis.functionalTapConnections)
  const hasValidReadingCompliance =
    Array.isArray(candidate.readingCompliance) ||
    ((candidate.level === 'block' || candidate.level === 'gram-panchayat') &&
      candidate.readingCompliance == null)

  return (
    hasValidKpis &&
    Array.isArray(candidate.mapData) &&
    Array.isArray(candidate.demandSupply) &&
    Array.isArray(candidate.readingSubmissionStatus) &&
    hasValidReadingCompliance &&
    Array.isArray(candidate.pumpOperators) &&
    Array.isArray(candidate.waterSupplyOutages) &&
    Array.isArray(candidate.topPerformers) &&
    Array.isArray(candidate.worstPerformers) &&
    Array.isArray(candidate.regularityData) &&
    Array.isArray(candidate.continuityData)
  )
}

const ensureValidParams = ({ level, entityId }: DashboardQueryParams): void => {
  if (!entityId) {
    throw new Error(`entityId is required for dashboard level: ${level}`)
  }
}

const normalizeDashboardData = (data: DashboardData): DashboardData => ({
  ...data,
  readingCompliance: data.readingCompliance ?? [],
})

const httpProvider: {
  getDashboardData: (params: DashboardQueryParams) => Promise<DashboardData>
} = {
  getDashboardData: async ({ level, entityId }: DashboardQueryParams) => {
    ensureValidParams({ level, entityId })
    const endpoint = `/api/dashboard/${level}/${entityId}`
    const response = await apiClient.get<DashboardData>(endpoint)
    if (!isDashboardDataPayload(response.data)) {
      throw new Error('Dashboard API returned an invalid payload')
    }

    return normalizeDashboardData(response.data)
  },
}

export const dashboardApi = {
  getDashboardData: (params: DashboardQueryParams): Promise<DashboardData> =>
    httpProvider.getDashboardData(params),
  getNationalDashboard: async (
    params: NationalDashboardQueryParams
  ): Promise<NationalDashboardResponse> => {
    const response = await apiClient.get<NationalDashboardResponse | RawNationalDashboardPayload>(
      '/api/v1/analytics/national/dashboard',
      {
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
        },
      }
    )

    return normalizeNationalDashboardResponse(response.data)
  },
  getAverageWaterSupplyPerRegion: async (
    params: AverageWaterSupplyPerRegionQueryParams
  ): Promise<AverageWaterSupplyPerRegionResponse> => {
    const response = await apiClient.get<
      AverageWaterSupplyPerRegionResponse | RawAverageWaterSupplyPerRegionPayload
    >('/api/v1/analytics/water-supply/average-per-region', {
      params: {
        tenant_id: params.tenantId,
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
        scope: params.scope ?? 'child',
        start_date: params.startDate,
        end_date: params.endDate,
      },
    })

    if ('childRegions' in response.data) {
      return normalizeAverageWaterSupplyResponse(response.data)
    }

    return normalizeAverageWaterSupplyResponse(
      response.data.data ?? {
        tenantId: params.tenantId,
        stateCode: '',
        parentLgdLevel: 0,
        parentDepartmentLevel: 0,
        startDate: params.startDate,
        endDate: params.endDate,
        daysInRange: 0,
        schemeCount: 0,
        childRegionCount: 0,
        schemes: [],
        childRegions: [],
      }
    )
  },
  getTenantPublicConfig: async (tenantId: number): Promise<TenantPublicConfig> => {
    const response = await apiClient.get<ApiEnvelope<{ configs?: TenantPublicConfigMap }>>(
      `/api/v1/tenants/${tenantId}/config/public`
    )
    const configs = response.data.data.configs

    return {
      averageMembersPerHousehold: Number(configs?.AVERAGE_MEMBERS_PER_HOUSEHOLD?.value) || 0,
      dateFormatScreen: configs?.DATE_FORMAT_SCREEN ?? {
        dateFormat: null,
        timeFormat: null,
        timezone: null,
      },
    }
  },
  getWaterQuantityPeriodic: async (
    params: WaterQuantityPeriodicQueryParams
  ): Promise<WaterQuantityPeriodicResponse> => {
    const response = await apiClient.get<
      WaterQuantityPeriodicResponse | WrappedAnalyticsResponse<WaterQuantityPeriodicResponse>
    >('/api/v1/analytics/water-quantity/periodic', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        scale: params.scale,
        lgd_id: params.lgdId,
        department_id: params.departmentId,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'water quantity periodic analytics') ?? {
        lgdId: params.lgdId ?? 0,
        departmentId: params.departmentId ?? 0,
        scale: params.scale,
        startDate: params.startDate,
        endDate: params.endDate,
        periodCount: 0,
        metrics: [],
      }
    )
  },
  getAverageSchemeRegularity: async (
    params: AverageSchemeRegularityQueryParams
  ): Promise<AverageSchemeRegularityResponse> => {
    const response = await apiClient.get<
      AverageSchemeRegularityResponse | WrappedAnalyticsResponse<AverageSchemeRegularityResponse>
    >('/api/v1/analytics/scheme-regularity/average', {
      params: {
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
        scope: params.scope ?? 'child',
        start_date: params.startDate,
        end_date: params.endDate,
      },
    })

    return normalizeAverageSchemeRegularityResponse(
      unwrapAnalyticsResponse(response.data, 'average scheme regularity analytics') ?? {
        lgdId: 0,
        parentDepartmentId: 0,
        parentLgdLevel: 0,
        parentDepartmentLevel: 0,
        scope: params.scope ?? 'child',
        startDate: params.startDate,
        endDate: params.endDate,
        daysInRange: 0,
        schemeCount: 0,
        totalSupplyDays: 0,
        averageRegularity: 0,
        childRegionCount: 0,
        childRegions: [],
      }
    )
  },
  getTenantBoundaries: async (
    params: TenantBoundaryQueryParams
  ): Promise<TenantBoundaryResponse> => {
    const response = await apiClient.get<
      TenantBoundaryResponse | WrappedAnalyticsResponse<TenantBoundaryResponse>
    >('/api/v1/analytics/tenant_data', {
      params: {
        tenant_id: params.tenantId,
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
        start_date: params.startDate,
        end_date: params.endDate,
      },
    })

    return normalizeTenantBoundaryResponse(
      unwrapAnalyticsResponse(response.data, 'tenant boundary analytics') ?? {
        tenantId: params.tenantId,
        stateCode: '',
        childBoundaryCount: 0,
        boundaryGeoJson: null,
        averageSchemeRegularity: 0,
        readingSubmissionRate: 0,
        averagePerformanceScore: 0,
        childRegions: [],
      }
    )
  },
  getSchemeRegularityPeriodic: async (
    params: SchemeRegularityPeriodicQueryParams
  ): Promise<SchemeRegularityPeriodicResponse> => {
    const response = await apiClient.get<
      SchemeRegularityPeriodicResponse | WrappedAnalyticsResponse<SchemeRegularityPeriodicResponse>
    >('/api/v1/analytics/scheme-regularity/periodic', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        scale: params.scale,
        lgd_id: params.lgdId,
        department_id: params.departmentId,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'scheme regularity periodic analytics') ?? {
        lgdId: params.lgdId ?? 0,
        departmentId: params.departmentId ?? 0,
        schemeCount: 0,
        scale: params.scale,
        startDate: params.startDate,
        endDate: params.endDate,
        periodCount: 0,
        metrics: [],
      }
    )
  },
  getNationalSchemeRegularityPeriodic: async (
    params: NationalSchemeRegularityPeriodicQueryParams
  ): Promise<NationalSchemeRegularityPeriodicResponse> => {
    const response = await apiClient.get<
      | NationalSchemeRegularityPeriodicResponse
      | WrappedAnalyticsResponse<NationalSchemeRegularityPeriodicResponse>
    >('/api/v1/analytics/scheme-regularity/periodic/national', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        scale: params.scale,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'national scheme regularity periodic analytics') ?? {
        schemeCount: 0,
        scale: params.scale,
        startDate: params.startDate,
        endDate: params.endDate,
        periodCount: 0,
        metrics: [],
      }
    )
  },
  getReadingSubmissionRate: async (
    params: ReadingSubmissionRateQueryParams
  ): Promise<ReadingSubmissionRateResponse> => {
    const response = await apiClient.get<
      ReadingSubmissionRateResponse | WrappedAnalyticsResponse<ReadingSubmissionRateResponse>
    >('/api/v1/analytics/reading-submission-rate', {
      params: {
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
        scope: params.scope ?? 'child',
        start_date: params.startDate,
        end_date: params.endDate,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'reading submission rate analytics') ?? {
        parentLgdId: 0,
        parentDepartmentId: 0,
        parentLgdLevel: 0,
        parentDepartmentLevel: 0,
        scope: params.scope ?? 'child',
        startDate: params.startDate,
        endDate: params.endDate,
        daysInRange: 0,
        schemeCount: 0,
        totalSubmissionDays: 0,
        readingSubmissionRate: 0,
        childRegionCount: 0,
        childRegions: [],
      }
    )
  },
  getSchemePerformance: async (
    params: SchemePerformanceQueryParams
  ): Promise<SchemePerformanceResponse> => {
    const response = await apiClient.get<
      SchemePerformanceResponse | WrappedAnalyticsResponse<SchemePerformanceResponse>
    >('/api/v1/analytics/schemes/dashboard', {
      params: {
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
        start_date: params.startDate,
        end_date: params.endDate,
        scheme_count: params.schemeCount ?? 10,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'scheme performance analytics') ?? {
        parentLgdId: params.parentLgdId ?? 0,
        parentDepartmentId: params.parentDepartmentId ?? 0,
        parentLgdCName: '',
        parentDepartmentCName: '',
        parentLgdTitle: '',
        parentDepartmentTitle: '',
        startDate: params.startDate,
        endDate: params.endDate,
        daysInRange: 0,
        activeSchemeCount: 0,
        inactiveSchemeCount: 0,
        topSchemeCount: 0,
        topSchemes: [],
      }
    )
  },
  getPumpOperatorDetails: async (
    params: PumpOperatorDetailsQueryParams
  ): Promise<PumpOperatorDetailsResponse> => {
    const response = await apiClient.get<RawPumpOperatorDetailsResponse>(
      `/api/v1/pumpoperator/pump-operators/${params.pumpOperatorId}`,
      {
        params: {
          tenantCode: params.tenant_code,
        },
      }
    )

    return {
      ...response.data,
      data: {
        ...response.data.data,
        missedSubmissionDays: normalizeMissedSubmissionDays(
          response.data.data.missedSubmissionDays
        ),
      },
    }
  },
  getPumpOperatorsByScheme: async (
    params: PumpOperatorsBySchemeQueryParams
  ): Promise<PumpOperatorsBySchemeResponse> => {
    const response = await apiClient.get<PumpOperatorsBySchemeResponse>(
      '/api/v1/pumpoperator/pump-operators/by-scheme',
      {
        params: {
          tenantCode: params.tenant_code,
          schemeId: params.scheme_id,
        },
      }
    )

    return response.data
  },
  getReadingCompliance: async (
    params: ReadingComplianceQueryParams
  ): Promise<ReadingComplianceResponse> => {
    const response = await apiClient.get<ReadingComplianceResponse>(
      params.scheme_id != null
        ? '/api/v1/pumpoperator/pump-operators/by-scheme/reading-compliance'
        : '/api/v1/pumpoperator/pump-operators/reading-compliance',
      {
        params: {
          tenantCode: params.tenant_code,
          schemeId: params.scheme_id,
          page: params.page ?? 0,
          size: params.size ?? 50,
        },
      }
    )

    return response.data
  },
  getSubmissionStatus: async (
    params: SubmissionStatusQueryParams
  ): Promise<SubmissionStatusResponse> => {
    const response = await apiClient.get<
      SubmissionStatusResponse | WrappedAnalyticsResponse<SubmissionStatusResponse>
    >('/api/v1/analytics/submission-status', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        lgd_id: params.lgdId,
        department_id: params.departmentId,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'submission status analytics') ?? {
        startDate: params.startDate,
        endDate: params.endDate,
        schemeCount: 0,
        compliantSubmissionCount: 0,
        anomalousSubmissionCount: 0,
      }
    )
  },
  getOutageReasons: async (params: OutageReasonsQueryParams): Promise<OutageReasonsResponse> => {
    const response = await apiClient.get<
      OutageReasonsResponse | WrappedAnalyticsResponse<OutageReasonsResponse>
    >('/api/v1/analytics/outage-reasons', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'outage reasons analytics') ?? {
        lgdId: params.parentLgdId ?? 0,
        departmentId: params.parentDepartmentId ?? 0,
        startDate: params.startDate,
        endDate: params.endDate,
        parentLgdLevel: 0,
        parentDepartmentLevel: 0,
        outageReasonSchemeCount: {},
        childRegionCount: 0,
        childRegions: [],
      }
    )
  },
  getOutageReasonsPeriodic: async (
    params: OutageReasonsPeriodicQueryParams
  ): Promise<OutageReasonsPeriodicResponse> => {
    const response = await apiClient.get<
      OutageReasonsPeriodicResponse | WrappedAnalyticsResponse<OutageReasonsPeriodicResponse>
    >('/api/v1/analytics/outage-reasons/periodic', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        scale: params.scale,
        lgd_id: params.lgdId,
        department_id: params.departmentId,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'outage reasons periodic analytics') ?? {
        lgdId: params.lgdId ?? 0,
        departmentId: params.departmentId ?? 0,
        scale: params.scale,
        startDate: params.startDate,
        endDate: params.endDate,
        periodCount: 0,
        metrics: [],
      }
    )
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
    parentId?: number
    tenantCode?: string
  }): Promise<TenantChildLocationsResponse> => {
    const { tenantId, hierarchyType, parentId } = params
    const hierarchyTypeCandidates = getOrderedHierarchyTypeCandidates(tenantId, hierarchyType)
    const cacheKey = getHierarchyCacheKey(tenantId, hierarchyType)
    let lastError: unknown = null

    for (const candidate of hierarchyTypeCandidates) {
      const endpoint =
        typeof parentId === 'number'
          ? `/api/v1/tenants/${tenantId}/locations/${candidate}?parentId=${parentId}`
          : `/api/v1/tenants/${tenantId}/locations/${candidate}`
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

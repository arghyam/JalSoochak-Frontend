import { publicApiClient } from '@/shared/lib/axios'
import type {
  AverageSchemeRegularityQueryParams,
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionQueryParams,
  AverageWaterSupplyPerRegionResponse,
  ContinuousSchemesQueryParams,
  ContinuousSchemesResponse,
  CriticalSchemesQueryParams,
  CriticalSchemesResponse,
  NationalDashboardBoundaryResponse,
  NationalDashboardQueryParams,
  NationalDashboardResponse,
  NationalSchemeRegularityPeriodicQueryParams,
  NationalSchemeRegularityPeriodicResponse,
  OutageReasonsPeriodicQueryParams,
  OutageReasonsPeriodicResponse,
  OutageReasonsQueryParams,
  OutageReasonsResponse,
  ReadingSubmissionRateQueryParams,
  ReadingSubmissionRateResponse,
  SchemePerformanceQueryParams,
  SchemePerformanceResponse,
  SchemeRegularityPeriodicQueryParams,
  SchemeRegularityPeriodicResponse,
  SubmissionStatusQueryParams,
  SubmissionStatusResponse,
  TenantBoundaryGeoJsonQueryParams,
  TenantBoundaryGeoJsonResponse,
  TenantBoundaryQueryParams,
  TenantBoundaryResponse,
  WaterQuantityPeriodicQueryParams,
  WaterQuantityPeriodicResponse,
  WaterQuantityRegionWiseQueryParams,
  WaterQuantityRegionWiseResponse,
} from '../../types'
import {
  type RawAverageWaterSupplyPerRegionPayload,
  type RawNationalDashboardBoundaryPayload,
  type RawNationalDashboardPayload,
  type WrappedAnalyticsResponse,
  normalizeAverageSchemeRegularityResponse,
  normalizeAverageWaterSupplyResponse,
  normalizeNationalDashboardBoundaryResponse,
  normalizeNationalDashboardResponse,
  normalizeTenantBoundaryGeoJsonResponse,
  normalizeTenantBoundaryResponse,
  normalizeWaterQuantityRegionWiseResponse,
  unwrapAnalyticsResponse,
} from './normalizers/dashboard-api-normalizers'

export const analyticsApi = {
  getNationalDashboard: async (
    params: NationalDashboardQueryParams
  ): Promise<NationalDashboardResponse> => {
    const response = await publicApiClient.get<
      NationalDashboardResponse | RawNationalDashboardPayload
    >('/api/v1/analytics/national/dashboard', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
      },
    })

    return normalizeNationalDashboardResponse(response.data)
  },
  getNationalDashboardBoundaries: async (): Promise<NationalDashboardBoundaryResponse> => {
    const response = await publicApiClient.get<
      NationalDashboardBoundaryResponse | RawNationalDashboardBoundaryPayload
    >('/api/v1/analytics/national/dashboard/boundary')

    return normalizeNationalDashboardBoundaryResponse(response.data)
  },
  getAverageWaterSupplyPerRegion: async (
    params: AverageWaterSupplyPerRegionQueryParams
  ): Promise<AverageWaterSupplyPerRegionResponse> => {
    const response = await publicApiClient.get<
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
  getWaterQuantityPeriodic: async (
    params: WaterQuantityPeriodicQueryParams
  ): Promise<WaterQuantityPeriodicResponse> => {
    const response = await publicApiClient.get<
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
  getWaterQuantityRegionWise: async (
    params: WaterQuantityRegionWiseQueryParams
  ): Promise<WaterQuantityRegionWiseResponse> => {
    const response = await publicApiClient.get<
      WaterQuantityRegionWiseResponse | WrappedAnalyticsResponse<WaterQuantityRegionWiseResponse>
    >('/api/v1/analytics/water-quantity/region-wise', {
      params: {
        tenant_id: params.tenantId,
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
        scope: params.scope ?? 'child',
        start_date: params.startDate,
        end_date: params.endDate,
      },
    })

    return normalizeWaterQuantityRegionWiseResponse(
      unwrapAnalyticsResponse(response.data, 'water quantity region-wise analytics') ?? {
        lgdId: 0,
        parentDepartmentId: 0,
        parentLgdLevel: 0,
        parentDepartmentLevel: 0,
        scope: params.scope ?? 'child',
        startDate: params.startDate,
        endDate: params.endDate,
        daysInRange: 0,
        schemeCount: 0,
        childRegionCount: 0,
        childRegions: [],
      }
    )
  },
  getAverageSchemeRegularity: async (
    params: AverageSchemeRegularityQueryParams
  ): Promise<AverageSchemeRegularityResponse> => {
    const response = await publicApiClient.get<
      AverageSchemeRegularityResponse | WrappedAnalyticsResponse<AverageSchemeRegularityResponse>
    >('/api/v1/analytics/scheme-regularity/average', {
      params: {
        tenant_id: params.tenantId,
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
    const response = await publicApiClient.get<
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
        parentLgdLevel: null,
        parentDepartmentLevel: null,
        childBoundaryCount: 0,
        averageSchemeRegularity: 0,
        readingSubmissionRate: 0,
        averagePerformanceScore: 0,
        childRegions: [],
      }
    )
  },
  getTenantBoundaryGeoJson: async (
    params: TenantBoundaryGeoJsonQueryParams
  ): Promise<TenantBoundaryGeoJsonResponse> => {
    const response = await publicApiClient.get<
      TenantBoundaryGeoJsonResponse | WrappedAnalyticsResponse<TenantBoundaryGeoJsonResponse>
    >('/api/v1/analytics/tenant_boundaries', {
      params: {
        tenant_id: params.tenantId,
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
      },
    })

    return normalizeTenantBoundaryGeoJsonResponse(
      unwrapAnalyticsResponse(response.data, 'tenant boundary geojson analytics') ?? {
        tenantId: params.tenantId,
        stateCode: '',
        parentLgdLevel: null,
        parentDepartmentLevel: null,
        childBoundaryCount: 0,
        childRegionCount: 0,
        parentBoundaryGeoJson: null,
        childRegions: [],
      }
    )
  },
  getSchemeRegularityPeriodic: async (
    params: SchemeRegularityPeriodicQueryParams
  ): Promise<SchemeRegularityPeriodicResponse> => {
    const response = await publicApiClient.get<
      SchemeRegularityPeriodicResponse | WrappedAnalyticsResponse<SchemeRegularityPeriodicResponse>
    >('/api/v1/analytics/scheme-regularity/periodic', {
      params: {
        tenant_id: params.tenantId,
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
    const response = await publicApiClient.get<
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
    const response = await publicApiClient.get<
      ReadingSubmissionRateResponse | WrappedAnalyticsResponse<ReadingSubmissionRateResponse>
    >('/api/v1/analytics/reading-submission-rate', {
      params: {
        tenant_id: params.tenantId,
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
    const response = await publicApiClient.get<
      SchemePerformanceResponse | WrappedAnalyticsResponse<SchemePerformanceResponse>
    >('/api/v1/analytics/schemes/dashboard', {
      params: {
        tenant_id: params.tenantId,
        parent_lgd_id: params.parentLgdId,
        parent_department_id: params.parentDepartmentId,
        start_date: params.startDate,
        end_date: params.endDate,
        page_number: params.pageNumber ?? 1,
        limit: params.limit ?? 15,
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
        totalCount: 0,
        topSchemeCount: 0,
        topSchemes: [],
      }
    )
  },
  getCriticalSchemes: async (
    params: CriticalSchemesQueryParams
  ): Promise<CriticalSchemesResponse> => {
    const response = await publicApiClient.get<
      CriticalSchemesResponse | WrappedAnalyticsResponse<CriticalSchemesResponse>
    >('/api/v1/analytics/critical-schemes', {
      params: {
        tenant_id: params.tenantId,
        lgd_id: params.lgdId,
        department_id: params.departmentId,
        start_date: params.startDate,
        end_date: params.endDate,
        list: params.list ?? false,
        page: params.page,
        limit: params.limit,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'critical schemes analytics') ?? {
        criticalSchemeCount: 0,
        list: params.list ?? false,
        page: params.page ?? null,
        limit: params.limit ?? null,
        schemes: null,
      }
    )
  },
  getContinuousSchemes: async (
    params: ContinuousSchemesQueryParams
  ): Promise<ContinuousSchemesResponse> => {
    const response = await publicApiClient.get<
      ContinuousSchemesResponse | WrappedAnalyticsResponse<ContinuousSchemesResponse>
    >('/api/v1/analytics/continuous-schemes', {
      params: {
        tenant_id: params.tenantId,
        lgd_id: params.lgdId,
        department_id: params.departmentId,
        start_date: params.startDate,
        end_date: params.endDate,
        list: params.list ?? false,
        page: params.page,
        limit: params.limit,
      },
    })

    return (
      unwrapAnalyticsResponse(response.data, 'continuous schemes analytics') ?? {
        continuousSchemeCount: 0,
        list: params.list ?? false,
        page: params.page ?? null,
        limit: params.limit ?? null,
        startDate: params.startDate,
        endDate: params.endDate,
        daysInRange: 0,
        schemes: null,
      }
    )
  },
  getSubmissionStatus: async (
    params: SubmissionStatusQueryParams
  ): Promise<SubmissionStatusResponse> => {
    const response = await publicApiClient.get<
      SubmissionStatusResponse | WrappedAnalyticsResponse<SubmissionStatusResponse>
    >('/api/v1/analytics/submission-status', {
      params: {
        tenant_id: params.tenantId,
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
    const response = await publicApiClient.get<
      OutageReasonsResponse | WrappedAnalyticsResponse<OutageReasonsResponse>
    >('/api/v1/analytics/outage-reasons', {
      params: {
        tenant_id: params.tenantId,
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
    const response = await publicApiClient.get<
      OutageReasonsPeriodicResponse | WrappedAnalyticsResponse<OutageReasonsPeriodicResponse>
    >('/api/v1/analytics/outage-reasons/periodic', {
      params: {
        tenant_id: params.tenantId,
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
}

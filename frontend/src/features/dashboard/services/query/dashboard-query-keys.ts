import type {
  AverageSchemeRegularityQueryParams,
  AverageWaterSupplyPerRegionQueryParams,
  DashboardLevel,
  NationalDashboardQueryParams,
  OutageReasonsQueryParams,
  ReadingComplianceQueryParams,
  PumpOperatorDetailsQueryParams,
  PumpOperatorsBySchemeQueryParams,
  ReadingSubmissionRateQueryParams,
  SchemeRegularityPeriodicQueryParams,
  SchemePerformanceQueryParams,
  SubmissionStatusQueryParams,
  WaterQuantityPeriodicQueryParams,
} from '../../types'

const DEFAULT_ANALYTICS_SCOPE = 'child'
const DEFAULT_SCHEME_COUNT = 10

const normalizeAnalyticsScope = <T extends { scope?: 'current' | 'child' } | null>(params: T) =>
  params?.scope ?? DEFAULT_ANALYTICS_SCOPE

const normalizeSchemeCount = <T extends { schemeCount?: number } | null>(params: T) =>
  params?.schemeCount ?? DEFAULT_SCHEME_COUNT

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  data: (level: DashboardLevel, entityId?: string) =>
    ['dashboard', 'data', level, entityId] as const,
  nationalDashboard: (params: NationalDashboardQueryParams | null) =>
    ['dashboard', 'analytics', 'national-dashboard', params?.startDate, params?.endDate] as const,
  averageWaterSupplyPerRegion: (params: AverageWaterSupplyPerRegionQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'average-water-supply-per-region',
      params?.tenantId,
      params?.parentLgdId,
      params?.parentDepartmentId,
      normalizeAnalyticsScope(params),
      params?.startDate,
      params?.endDate,
    ] as const,
  waterQuantityPeriodic: (params: WaterQuantityPeriodicQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'water-quantity-periodic',
      params?.lgdId,
      params?.departmentId,
      params?.scale,
      params?.startDate,
      params?.endDate,
    ] as const,
  schemeRegularityPeriodic: (params: SchemeRegularityPeriodicQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'scheme-regularity-periodic',
      params?.lgdId,
      params?.departmentId,
      params?.scale,
      params?.startDate,
      params?.endDate,
    ] as const,
  averageSchemeRegularity: (params: AverageSchemeRegularityQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'average-scheme-regularity',
      params?.parentLgdId,
      params?.parentDepartmentId,
      normalizeAnalyticsScope(params),
      params?.startDate,
      params?.endDate,
    ] as const,
  readingSubmissionRate: (params: ReadingSubmissionRateQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'reading-submission-rate',
      params?.parentLgdId,
      params?.parentDepartmentId,
      normalizeAnalyticsScope(params),
      params?.startDate,
      params?.endDate,
    ] as const,
  schemePerformance: (params: SchemePerformanceQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'scheme-performance',
      params?.parentLgdId,
      params?.parentDepartmentId,
      params?.startDate,
      params?.endDate,
      normalizeSchemeCount(params),
    ] as const,
  pumpOperatorsByScheme: (params: PumpOperatorsBySchemeQueryParams | null) =>
    ['dashboard', 'pump-operator', 'by-scheme', params?.tenant_code, params?.scheme_id] as const,
  pumpOperatorDetails: (params: PumpOperatorDetailsQueryParams | null) =>
    ['dashboard', 'pump-operator', 'details', params?.pumpOperatorId, params?.tenant_code] as const,
  readingCompliance: (params: ReadingComplianceQueryParams | null) =>
    [
      'dashboard',
      'pump-operator',
      'reading-compliance',
      params?.tenant_code,
      params?.scheme_id,
      params?.page,
      params?.size,
    ] as const,
  submissionStatus: (params: SubmissionStatusQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'submission-status',
      params?.lgdId,
      params?.departmentId,
      params?.startDate,
      params?.endDate,
    ] as const,
  outageReasons: (params: OutageReasonsQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'outage-reasons',
      params?.parentLgdId,
      params?.parentDepartmentId,
      params?.startDate,
      params?.endDate,
    ] as const,
}

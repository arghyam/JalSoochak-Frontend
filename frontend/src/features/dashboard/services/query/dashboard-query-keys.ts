import type {
  AverageSchemeRegularityQueryParams,
  AverageWaterSupplyPerRegionQueryParams,
  DashboardLevel,
  NationalDashboardQueryParams,
  OutageReasonsQueryParams,
  ReadingComplianceQueryParams,
  PumpOperatorDetailsQueryParams,
  ReadingSubmissionRateQueryParams,
  SchemePerformanceQueryParams,
  SubmissionStatusQueryParams,
} from '../../types'

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
      params?.scope,
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
      params?.scope,
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
      params?.scope,
      params?.startDate,
      params?.endDate,
    ] as const,
  schemePerformance: (params: SchemePerformanceQueryParams | null) =>
    ['dashboard', 'analytics', 'scheme-performance', params?.tenantId, params?.schemeId] as const,
  pumpOperatorDetails: (params: PumpOperatorDetailsQueryParams | null) =>
    ['dashboard', 'pump-operator', 'details', params?.pumpOperatorId, params?.tenantCode] as const,
  readingCompliance: (params: ReadingComplianceQueryParams | null) =>
    ['dashboard', 'pump-operator', 'reading-compliance', params?.tenantCode] as const,
  submissionStatus: (params: SubmissionStatusQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'submission-status',
      params?.userId,
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

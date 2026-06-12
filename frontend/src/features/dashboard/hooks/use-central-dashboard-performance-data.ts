import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  DashboardData,
  EntityPerformance,
  NationalDashboardResponse,
  NationalSchemeRegularityPeriodicResponse,
  OutageReasonsPeriodicResponse,
  ReadingSubmissionRateResponse,
  SchemePerformanceResponse,
  SchemeRegularityPeriodicResponse,
  SubmissionStatusResponse,
  VillagePumpOperatorDetails,
  WaterQuantityPeriodicResponse,
} from '../types'
import { sortByMetricDescending } from '../utils/central-dashboard-helpers'
import { toCapitalizedWords } from '../utils/format-location-label'
import {
  mapQuantityPerformanceFromNationalDashboard,
  mapReadingSubmissionRateFromNationalDashboard,
  mapReadingSubmissionRateFromAnalytics,
  mapReadingSubmissionStatusFromAnalytics,
  mapRegularityPerformanceFromNationalDashboard,
  mapSchemePerformanceToPumpOperators,
  mapSchemePerformanceToTable,
  mapQuantityPerformanceFromAnalytics,
  mapRegularityPerformanceFromAnalytics,
} from '../utils/formulas'
import {
  mapNationalQuantityTrendPoints,
  mapNationalRegularityTrendPoints,
  mapOutageReasonsPeriodicToTrendPoints,
  mapSchemeRegularityPeriodicToTrendPoints,
  mapWaterQuantityPeriodicToTrendPoints,
} from '../utils/quantity-periodic'

type TenantBoundaryRegion = {
  childDepartmentId?: number
  childDepartmentTitle?: string
  childLgdId?: number
  childLgdTitle?: string
  departmentId?: number
  lgdId?: number
  title?: string
}

type BuildCentralDashboardPerformanceDataParams = {
  averagePersonsPerHousehold: number
  averageSchemeRegularityData?: AverageSchemeRegularityResponse
  averageWaterSupplyData?: AverageWaterSupplyPerRegionResponse
  dashboardData: DashboardData
  emptyEntityPerformance: EntityPerformance[]
  filteredNationalDashboardData?: NationalDashboardResponse
  hierarchyType: 'LGD' | 'DEPARTMENT' | 'DEPARTMENTAL' | 'DEPT'
  isCentralLandingView: boolean
  isHierarchyLeafSelected: boolean
  litersPerPersonPerDay: number
  nationalDefaultAverageMembersPerHousehold: number
  nationalDefaultWaterNormLitersPerPersonPerDay: number
  nationalDemandInputsByTenantId: Map<
    number,
    { averagePersonsPerHousehold: number; litersPerPersonPerDay: number } | undefined
  >
  nationalSchemeQuantityPeriodicData?: NationalSchemeRegularityPeriodicResponse
  nationalSchemeRegularityPeriodicData?: NationalSchemeRegularityPeriodicResponse
  outageReasonsPeriodicData?: OutageReasonsPeriodicResponse
  readingSubmissionRateData?: ReadingSubmissionRateResponse
  schemePerformanceData?: SchemePerformanceResponse
  schemeRegularityPeriodicData?: SchemeRegularityPeriodicResponse
  screenDateFormat: string
  selectedSchemeId?: number
  shouldFetchSchemePerformanceAnalytics: boolean
  submissionStatusData?: SubmissionStatusResponse
  tenantBoundaryRegions?: TenantBoundaryRegion[]
  waterQuantityPeriodicData?: WaterQuantityPeriodicResponse
}

export function buildCentralDashboardPerformanceData({
  averagePersonsPerHousehold,
  averageSchemeRegularityData,
  averageWaterSupplyData,
  dashboardData,
  emptyEntityPerformance,
  filteredNationalDashboardData,
  hierarchyType,
  isCentralLandingView,
  isHierarchyLeafSelected,
  litersPerPersonPerDay,
  nationalDefaultAverageMembersPerHousehold,
  nationalDefaultWaterNormLitersPerPersonPerDay,
  nationalDemandInputsByTenantId,
  nationalSchemeQuantityPeriodicData,
  nationalSchemeRegularityPeriodicData,
  outageReasonsPeriodicData,
  readingSubmissionRateData,
  schemePerformanceData,
  schemeRegularityPeriodicData,
  screenDateFormat,
  selectedSchemeId,
  shouldFetchSchemePerformanceAnalytics,
  submissionStatusData,
  tenantBoundaryRegions,
  waterQuantityPeriodicData,
}: BuildCentralDashboardPerformanceDataParams) {
  const quantityPerformanceData = sortByMetricDescending(
    isCentralLandingView
      ? mapQuantityPerformanceFromNationalDashboard(
          filteredNationalDashboardData,
          emptyEntityPerformance,
          nationalDefaultAverageMembersPerHousehold,
          nationalDefaultWaterNormLitersPerPersonPerDay,
          (state) => nationalDemandInputsByTenantId.get(state.tenantId)
        )
      : mapQuantityPerformanceFromAnalytics(
          averageWaterSupplyData,
          emptyEntityPerformance,
          averagePersonsPerHousehold,
          litersPerPersonPerDay
        ),
    'quantity'
  )
  const regularityPerformanceData = sortByMetricDescending(
    isCentralLandingView
      ? mapRegularityPerformanceFromNationalDashboard(
          filteredNationalDashboardData,
          emptyEntityPerformance
        )
      : mapRegularityPerformanceFromAnalytics(averageSchemeRegularityData, emptyEntityPerformance),
    'regularity'
  )
  const supplySubmissionRateData = sortByMetricDescending(
    isCentralLandingView
      ? mapReadingSubmissionRateFromNationalDashboard(filteredNationalDashboardData, [])
      : mapReadingSubmissionRateFromAnalytics(readingSubmissionRateData, []),
    'regularity'
  )
  const readingSubmissionStatusData = mapReadingSubmissionStatusFromAnalytics(
    submissionStatusData,
    []
  )
  const pumpOperatorsData = mapSchemePerformanceToPumpOperators(
    schemePerformanceData,
    shouldFetchSchemePerformanceAnalytics ? [] : (dashboardData?.pumpOperators ?? [])
  )
  const tenantBoundaryBlockLookup = (tenantBoundaryRegions ?? []).reduce(
    (lookup, region) => {
      const normalizedTitle = (
        region.title ??
        region.childLgdTitle ??
        region.childDepartmentTitle ??
        ''
      ).trim()
      if (!normalizedTitle) {
        return lookup
      }

      const lgdId = region.childLgdId ?? region.lgdId
      const departmentId = region.childDepartmentId ?? region.departmentId

      if (typeof lgdId === 'number' && lgdId > 0) {
        lookup.idLookup[lgdId] = normalizedTitle
        lookup.lgdLookup[lgdId] = normalizedTitle
      }

      if (typeof departmentId === 'number' && departmentId > 0) {
        lookup.idLookup[departmentId] = normalizedTitle
        lookup.lgdLookup[departmentId] = normalizedTitle
      }

      return lookup
    },
    { idLookup: {}, lgdLookup: {} } as {
      idLookup: Record<number, string>
      lgdLookup: Record<number, string>
    }
  )
  const operatorsPerformanceAnalyticsTable = mapSchemePerformanceToTable(
    schemePerformanceData,
    [],
    {
      blockTitleByParentId: tenantBoundaryBlockLookup,
      parentLgdTitleById: hierarchyType === 'LGD' ? undefined : tenantBoundaryBlockLookup,
      useDepartmentHierarchyTitles: hierarchyType !== 'LGD',
    }
  )
  const derivedVillageSchemeId = isHierarchyLeafSelected
    ? (selectedSchemeId ?? schemePerformanceData?.topSchemes?.[0]?.schemeId)
    : undefined
  const derivedVillageScheme =
    (typeof derivedVillageSchemeId === 'number'
      ? schemePerformanceData?.topSchemes?.find(
          (scheme) => scheme.schemeId === derivedVillageSchemeId
        )
      : undefined) ?? (isHierarchyLeafSelected ? schemePerformanceData?.topSchemes?.[0] : undefined)
  const periodicQuantityTimeTrendData = mapWaterQuantityPeriodicToTrendPoints(
    waterQuantityPeriodicData,
    screenDateFormat
  )
  const periodicRegularityTimeTrendData = mapSchemeRegularityPeriodicToTrendPoints(
    schemeRegularityPeriodicData,
    screenDateFormat
  )
  const quantityTimeTrendData = isCentralLandingView
    ? mapNationalQuantityTrendPoints(
        nationalSchemeQuantityPeriodicData,
        screenDateFormat,
        nationalDefaultAverageMembersPerHousehold
      )
    : periodicQuantityTimeTrendData.length > 0
      ? periodicQuantityTimeTrendData
      : []
  const regularityTimeTrendData = isCentralLandingView
    ? mapNationalRegularityTrendPoints(nationalSchemeRegularityPeriodicData, screenDateFormat)
    : periodicRegularityTimeTrendData.length > 0
      ? periodicRegularityTimeTrendData
      : []
  const outageReasonsTimeTrendData = mapOutageReasonsPeriodicToTrendPoints(
    outageReasonsPeriodicData,
    screenDateFormat
  )
  const villagePumpOperatorDetails: VillagePumpOperatorDetails = {
    schemeId: derivedVillageSchemeId,
    schemeName: derivedVillageScheme?.schemeName
      ? toCapitalizedWords(derivedVillageScheme.schemeName)
      : undefined,
    name: 'N/A',
    scheme:
      derivedVillageScheme?.schemeName && derivedVillageSchemeId
        ? `${toCapitalizedWords(derivedVillageScheme.schemeName)} / ${derivedVillageSchemeId}`
        : 'N/A',
    stationLocation: 'N/A',
    lastSubmission: 'N/A',
    reportingRate: 'N/A',
    missingSubmissionCount: 'N/A',
    inactiveDays: 'N/A',
  }

  return {
    derivedVillageSchemeId,
    operatorsPerformanceAnalyticsTable,
    outageReasonsTimeTrendData,
    pumpOperatorsData,
    quantityPerformanceData,
    quantityTimeTrendData,
    readingSubmissionStatusData,
    regularityPerformanceData,
    regularityTimeTrendData,
    supplySubmissionRateData,
    villagePumpOperatorDetails,
  }
}

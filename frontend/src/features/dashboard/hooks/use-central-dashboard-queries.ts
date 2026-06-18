import { useQueries } from '@tanstack/react-query'
import { dashboardApi } from '../services/api/dashboard-api'
import { useAverageSchemeRegularityQuery } from '../services/query/use-average-scheme-regularity-query'
import { useAverageWaterSupplyPerRegionQuery } from '../services/query/use-average-water-supply-per-region-query'
import { useContinuousSchemesQuery } from '../services/query/use-continuous-schemes-query'
import { useCriticalSchemesQuery } from '../services/query/use-critical-schemes-query'
import { dashboardQueryKeys } from '../services/query/dashboard-query-keys'
import { useNationalDashboardBoundariesQuery } from '../services/query/use-national-dashboard-boundaries-query'
import { useNationalDashboardQuery } from '../services/query/use-national-dashboard-query'
import { useNationalSchemeRegularityPeriodicQuery } from '../services/query/use-national-scheme-regularity-periodic-query'
import { useOutageReasonsPeriodicQuery } from '../services/query/use-outage-reasons-periodic-query'
import { useOutageReasonsQuery } from '../services/query/use-outage-reasons-query'
import { useReadingSubmissionRateQuery } from '../services/query/use-reading-submission-rate-query'
import { useSchemePerformanceQuery } from '../services/query/use-scheme-performance-query'
import { useSchemeRegularityPeriodicQuery } from '../services/query/use-scheme-regularity-periodic-query'
import { useSubmissionStatusQuery } from '../services/query/use-submission-status-query'
import { useTenantBoundariesQuery } from '../services/query/use-tenant-boundaries-query'
import { useTenantBoundaryGeoJsonQuery } from '../services/query/use-tenant-boundary-geojson-query'
import { useWaterQuantityPeriodicQuery } from '../services/query/use-water-quantity-periodic-query'
import { useWaterQuantityRegionWiseQuery } from '../services/query/use-water-quantity-region-wise-query'
import type { SchemePerformanceSortBy, StateUtOption } from '../types'
import {
  type OutageTimeScaleTab,
  type PerformanceTimeScaleTab,
  filterNationalDashboardBoundariesByTenantIds,
  filterNationalDashboardByTenantIds,
  resolvePositiveNumber,
} from '../utils/central-dashboard-helpers'
import { getPreviousPeriodRange } from '../utils/formulas'
import { resolveWaterQuantityPeriodicScale } from '../utils/quantity-periodic'

const SCHEME_PERFORMANCE_PAGE_SIZE = 15

type AnalyticsDateRange = {
  startDate: string
  endDate: string
}

type UseCentralDashboardQueriesParams = {
  activeTenantIds: Set<number>
  analyticsDateRange: AnalyticsDateRange
  analyticsParentId: number
  defaultAverageMembersPerHousehold: number
  defaultWaterNormLitersPerPersonPerDay: number
  hasCentralLandingFilters: boolean
  hasValidAnalyticsParentId: boolean
  hasValidSubmissionStatusParentId: boolean
  hierarchyType: 'LGD' | 'DEPARTMENT'
  isHierarchyFourthLevelSelected: boolean
  isHierarchyLeafSelected: boolean
  isHierarchySecondLevelSelected: boolean
  isHierarchyStateSelected: boolean
  isHierarchyThirdLevelSelected: boolean
  schemePerformancePage: number
  schemeSortBy: SchemePerformanceSortBy
  schemeSortDir: 'asc' | 'desc'
  selectedOutageApiScale: OutageTimeScaleTab
  selectedQuantityApiScale: PerformanceTimeScaleTab
  selectedRegularityApiScale: PerformanceTimeScaleTab
  selectedScheme: string
  selectedTenant?: StateUtOption
  shouldFetchTenantBoundaryGeoJson: boolean
  submissionStatusParentId: number
}

const isQueryPending = (enabled: boolean, isLoading: boolean, isFetching: boolean) =>
  enabled && (isLoading || isFetching)

export function useCentralDashboardQueries({
  activeTenantIds,
  analyticsDateRange,
  analyticsParentId,
  defaultAverageMembersPerHousehold,
  defaultWaterNormLitersPerPersonPerDay,
  hasCentralLandingFilters,
  hasValidAnalyticsParentId,
  hasValidSubmissionStatusParentId,
  hierarchyType,
  isHierarchyFourthLevelSelected,
  isHierarchyLeafSelected,
  isHierarchySecondLevelSelected,
  isHierarchyStateSelected,
  isHierarchyThirdLevelSelected,
  schemePerformancePage,
  schemeSortBy,
  schemeSortDir,
  selectedOutageApiScale,
  selectedQuantityApiScale,
  selectedRegularityApiScale,
  selectedScheme,
  selectedTenant,
  shouldFetchTenantBoundaryGeoJson,
  submissionStatusParentId,
}: UseCentralDashboardQueriesParams) {
  const quantityPeriodicAnalyticsParams = !hasValidAnalyticsParentId
    ? null
    : hierarchyType === 'LGD'
      ? {
          lgdId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          scale: selectedQuantityApiScale,
        }
      : {
          departmentId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          scale: selectedQuantityApiScale,
        }
  const regularityPeriodicAnalyticsParams =
    !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            lgdId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            scale: selectedRegularityApiScale,
          }
        : {
            tenantId: selectedTenant.tenantId,
            departmentId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            scale: selectedRegularityApiScale,
          }
  const nationalDashboardParams = hasCentralLandingFilters
    ? null
    : {
        startDate: analyticsDateRange.startDate,
        endDate: analyticsDateRange.endDate,
      }
  const nationalQuantityPeriodAnalyticsParams = hasCentralLandingFilters
    ? null
    : {
        startDate: analyticsDateRange.startDate,
        endDate: analyticsDateRange.endDate,
        scale: selectedQuantityApiScale,
      }
  const nationalRegularityPeriodAnalyticsParams = hasCentralLandingFilters
    ? null
    : {
        startDate: analyticsDateRange.startDate,
        endDate: analyticsDateRange.endDate,
        scale: selectedRegularityApiScale,
      }
  const analyticsParams =
    isHierarchyLeafSelected || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            parentLgdId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
        : {
            tenantId: selectedTenant.tenantId,
            parentDepartmentId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
  const tenantBoundaryAnalyticsParams =
    !hasCentralLandingFilters ||
    isHierarchyLeafSelected ||
    !selectedTenant?.tenantId ||
    !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            parentLgdId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
        : {
            tenantId: selectedTenant.tenantId,
            parentDepartmentId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
  const tenantBoundaryGeoJsonParams =
    !hasCentralLandingFilters ||
    isHierarchyLeafSelected ||
    !selectedTenant?.tenantId ||
    !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            parentLgdId: analyticsParentId,
          }
        : {
            tenantId: selectedTenant.tenantId,
            parentDepartmentId: analyticsParentId,
          }
  const regularityAnalyticsParams =
    isHierarchyLeafSelected || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            parentLgdId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
        : {
            tenantId: selectedTenant.tenantId,
            parentDepartmentId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
  const quantityRegionWiseAnalyticsParams =
    isHierarchyLeafSelected || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            parentLgdId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
        : {
            tenantId: selectedTenant.tenantId,
            parentDepartmentId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
  const readingSubmissionRateAnalyticsParams =
    isHierarchyLeafSelected || !selectedTenant?.tenantId
      ? null
      : hierarchyType === 'LGD'
        ? hasValidAnalyticsParentId
          ? {
              tenantId: selectedTenant.tenantId,
              parentLgdId: analyticsParentId,
              scope: 'child' as const,
              startDate: analyticsDateRange.startDate,
              endDate: analyticsDateRange.endDate,
            }
          : null
        : hasValidAnalyticsParentId
          ? {
              tenantId: selectedTenant.tenantId,
              parentDepartmentId: analyticsParentId,
              scope: 'child' as const,
              startDate: analyticsDateRange.startDate,
              endDate: analyticsDateRange.endDate,
            }
          : null
  const parsedSelectedSchemeId = Number.parseInt(selectedScheme, 10)
  const selectedSchemeId = Number.isFinite(parsedSelectedSchemeId)
    ? parsedSelectedSchemeId
    : undefined
  const shouldFetchSchemePerformanceAnalytics =
    (isHierarchyStateSelected ||
      isHierarchySecondLevelSelected ||
      isHierarchyThirdLevelSelected ||
      isHierarchyFourthLevelSelected ||
      isHierarchyLeafSelected) &&
    analyticsParentId > 0
  const schemePerformanceAnalyticsParams =
    !shouldFetchSchemePerformanceAnalytics || !selectedTenant?.tenantId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            parentLgdId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            pageNumber: schemePerformancePage,
            limit: SCHEME_PERFORMANCE_PAGE_SIZE,
            sortBy: schemeSortBy,
            sortDir: schemeSortDir,
          }
        : {
            tenantId: selectedTenant.tenantId,
            parentDepartmentId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            pageNumber: schemePerformancePage,
            limit: SCHEME_PERFORMANCE_PAGE_SIZE,
            sortBy: schemeSortBy,
            sortDir: schemeSortDir,
          }
  const criticalSchemesAnalyticsParams =
    !hasCentralLandingFilters || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            lgdId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            list: false,
          }
        : {
            tenantId: selectedTenant.tenantId,
            departmentId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            list: false,
          }
  const continuousSchemesAnalyticsParams =
    !hasCentralLandingFilters || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            lgdId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            list: false,
          }
        : {
            tenantId: selectedTenant.tenantId,
            departmentId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            list: false,
          }
  const submissionStatusAnalyticsParams =
    !hasCentralLandingFilters || !selectedTenant?.tenantId || !hasValidSubmissionStatusParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            lgdId: submissionStatusParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
        : {
            tenantId: selectedTenant.tenantId,
            departmentId: submissionStatusParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
  const outageReasonsAnalyticsParams =
    !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            parentLgdId: analyticsParentId,
          }
        : {
            tenantId: selectedTenant.tenantId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            parentDepartmentId: analyticsParentId,
          }
  const outageReasonsPeriodicAnalyticsParams =
    isHierarchyLeafSelected || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            lgdId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            scale: selectedOutageApiScale,
          }
        : {
            tenantId: selectedTenant.tenantId,
            departmentId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            scale: selectedOutageApiScale,
          }
  const activePreviousPeriodSource = analyticsParams ??
    nationalDashboardParams ?? {
      startDate: analyticsDateRange.startDate,
      endDate: analyticsDateRange.endDate,
    }
  const previousAnalyticsRange = getPreviousPeriodRange(
    activePreviousPeriodSource.startDate,
    activePreviousPeriodSource.endDate
  )
  const previousNationalDashboardParams = hasCentralLandingFilters
    ? null
    : {
        startDate: previousAnalyticsRange.startDate,
        endDate: previousAnalyticsRange.endDate,
      }
  const previousWaterSupplyAnalyticsParams =
    analyticsParams === null
      ? null
      : {
          ...analyticsParams,
          startDate: previousAnalyticsRange.startDate,
          endDate: previousAnalyticsRange.endDate,
        }
  const previousCriticalSchemesAnalyticsParams =
    criticalSchemesAnalyticsParams === null
      ? null
      : {
          ...criticalSchemesAnalyticsParams,
          startDate: previousAnalyticsRange.startDate,
          endDate: previousAnalyticsRange.endDate,
        }
  const previousContinuousSchemesAnalyticsParams =
    continuousSchemesAnalyticsParams === null
      ? null
      : {
          ...continuousSchemesAnalyticsParams,
          startDate: previousAnalyticsRange.startDate,
          endDate: previousAnalyticsRange.endDate,
        }
  const currentWaterSupplyAnalyticsParams =
    analyticsParams === null || isHierarchyStateSelected
      ? null
      : {
          ...analyticsParams,
          scope: 'current' as const,
        }
  const previousRegularityAnalyticsParams =
    regularityAnalyticsParams === null
      ? null
      : {
          ...regularityAnalyticsParams,
          scope: 'current' as const,
          startDate: previousAnalyticsRange.startDate,
          endDate: previousAnalyticsRange.endDate,
        }
  const currentRegularityAnalyticsParams =
    regularityAnalyticsParams === null
      ? null
      : {
          ...regularityAnalyticsParams,
          scope: 'current' as const,
        }

  const {
    data: averageWaterSupplyData,
    isLoading: isAverageWaterSupplyLoading = false,
    isFetching: isAverageWaterSupplyFetching = false,
    isError: isAverageWaterSupplyError = false,
  } = useAverageWaterSupplyPerRegionQuery({
    params: analyticsParams,
    enabled: Boolean(analyticsParams),
  })
  const {
    data: tenantBoundaryData,
    isLoading: isTenantBoundariesLoading = false,
    isFetching: isTenantBoundariesFetching = false,
  } = useTenantBoundariesQuery({
    params: tenantBoundaryAnalyticsParams,
    enabled: Boolean(tenantBoundaryAnalyticsParams),
  })
  const {
    data: tenantBoundaryGeoJsonData,
    isLoading: isTenantBoundaryGeoJsonLoading = false,
    isFetching: isTenantBoundaryGeoJsonFetching = false,
  } = useTenantBoundaryGeoJsonQuery({
    params: tenantBoundaryGeoJsonParams,
    enabled: shouldFetchTenantBoundaryGeoJson && Boolean(tenantBoundaryGeoJsonParams),
  })
  const {
    data: nationalDashboardData,
    isLoading: isNationalDashboardLoading = false,
    isFetching: isNationalDashboardFetching = false,
    isError: isNationalDashboardError = false,
  } = useNationalDashboardQuery({
    params: nationalDashboardParams,
    enabled: Boolean(nationalDashboardParams),
  })
  const {
    data: nationalDashboardBoundariesData,
    isLoading: isNationalDashboardBoundariesLoading = false,
    isFetching: isNationalDashboardBoundariesFetching = false,
  } = useNationalDashboardBoundariesQuery({
    enabled: !hasCentralLandingFilters,
  })
  const {
    data: nationalSchemeQuantityPeriodicData,
    isFetching: isNationalSchemeQuantityPeriodicFetching,
    isError: isNationalSchemeQuantityPeriodicError = false,
  } = useNationalSchemeRegularityPeriodicQuery({
    params: nationalQuantityPeriodAnalyticsParams,
    enabled: Boolean(nationalQuantityPeriodAnalyticsParams),
  })
  const {
    data: nationalSchemeRegularityPeriodicData,
    isFetching: isNationalSchemeRegularityPeriodicFetching,
    isError: isNationalSchemeRegularityPeriodicError = false,
  } = useNationalSchemeRegularityPeriodicQuery({
    params: nationalRegularityPeriodAnalyticsParams,
    enabled: Boolean(nationalRegularityPeriodAnalyticsParams),
  })
  const {
    data: waterQuantityPeriodicData,
    isFetching: isWaterQuantityPeriodicFetching,
    isError: isWaterQuantityPeriodicError = false,
    isAwaitingParams: isWaterQuantityPeriodicAwaitingParams,
  } = useWaterQuantityPeriodicQuery({
    params: quantityPeriodicAnalyticsParams,
    enabled: Boolean(quantityPeriodicAnalyticsParams),
  })
  const {
    data: schemeRegularityPeriodicData,
    isFetching: isSchemeRegularityPeriodicFetching,
    isError: isSchemeRegularityPeriodicError = false,
  } = useSchemeRegularityPeriodicQuery({
    params: regularityPeriodicAnalyticsParams,
    enabled: Boolean(regularityPeriodicAnalyticsParams),
  })
  const {
    data: outageReasonsPeriodicData,
    isLoading: isOutageReasonsPeriodicLoading = false,
    isFetching: isOutageReasonsPeriodicFetching = false,
  } = useOutageReasonsPeriodicQuery({
    params: outageReasonsPeriodicAnalyticsParams,
    enabled: Boolean(outageReasonsPeriodicAnalyticsParams),
  })
  const { data: previousNationalDashboardData } = useNationalDashboardQuery({
    params: previousNationalDashboardParams,
    enabled: Boolean(previousNationalDashboardParams),
  })
  const filteredNationalDashboardData = filterNationalDashboardByTenantIds(
    nationalDashboardData,
    activeTenantIds
  )
  const filteredPreviousNationalDashboardData = filterNationalDashboardByTenantIds(
    previousNationalDashboardData,
    activeTenantIds
  )
  const filteredNationalDashboardBoundaries = filterNationalDashboardBoundariesByTenantIds(
    nationalDashboardBoundariesData,
    activeTenantIds
  ) ?? {
    nationalBoundary: null,
    stateWiseBoundaries: [],
  }
  const { data: currentWaterSupplyKpiData } = useAverageWaterSupplyPerRegionQuery({
    params: currentWaterSupplyAnalyticsParams,
    enabled: Boolean(currentWaterSupplyAnalyticsParams),
  })
  const { data: previousWaterSupplyKpiData } = useAverageWaterSupplyPerRegionQuery({
    params: previousWaterSupplyAnalyticsParams,
    enabled: Boolean(previousWaterSupplyAnalyticsParams),
  })
  const {
    data: averageSchemeRegularityData,
    isLoading: isAverageSchemeRegularityLoading = false,
    isFetching: isAverageSchemeRegularityFetching = false,
    isError: isAverageSchemeRegularityError = false,
  } = useAverageSchemeRegularityQuery({
    params: regularityAnalyticsParams,
    enabled: Boolean(regularityAnalyticsParams),
  })
  const {
    data: waterQuantityRegionWiseData,
    isLoading: isWaterQuantityRegionWiseLoading = false,
    isFetching: isWaterQuantityRegionWiseFetching = false,
    isError: isWaterQuantityRegionWiseError = false,
  } = useWaterQuantityRegionWiseQuery({
    params: quantityRegionWiseAnalyticsParams,
    enabled: Boolean(quantityRegionWiseAnalyticsParams),
  })
  const {
    data: readingSubmissionRateData,
    isLoading: isReadingSubmissionRateLoading = false,
    isFetching: isReadingSubmissionRateFetching = false,
    isError: isReadingSubmissionRateError = false,
  } = useReadingSubmissionRateQuery({
    params: readingSubmissionRateAnalyticsParams,
    enabled: Boolean(readingSubmissionRateAnalyticsParams),
  })
  const {
    data: schemePerformanceData,
    isLoading: isSchemePerformanceLoading = false,
    isFetching: isSchemePerformanceFetching = false,
    isError: isSchemePerformanceErrorRaw = false,
  } = useSchemePerformanceQuery({
    params: schemePerformanceAnalyticsParams,
    enabled: Boolean(schemePerformanceAnalyticsParams),
  })
  const { data: criticalSchemesData } = useCriticalSchemesQuery({
    params: criticalSchemesAnalyticsParams,
    enabled: Boolean(criticalSchemesAnalyticsParams),
  })
  const { data: continuousSchemesData } = useContinuousSchemesQuery({
    params: continuousSchemesAnalyticsParams,
    enabled: Boolean(continuousSchemesAnalyticsParams),
  })
  const { data: previousCriticalSchemesData } = useCriticalSchemesQuery({
    params: previousCriticalSchemesAnalyticsParams,
    enabled: Boolean(previousCriticalSchemesAnalyticsParams),
  })
  const { data: previousContinuousSchemesData } = useContinuousSchemesQuery({
    params: previousContinuousSchemesAnalyticsParams,
    enabled: Boolean(previousContinuousSchemesAnalyticsParams),
  })
  const totalSchemePages = Math.ceil(
    (schemePerformanceData?.totalCount ?? 0) / SCHEME_PERFORMANCE_PAGE_SIZE
  )
  const {
    data: submissionStatusData,
    isLoading: isSubmissionStatusLoading = false,
    isFetching: isSubmissionStatusFetching = false,
    isError: isSubmissionStatusErrorRaw = false,
  } = useSubmissionStatusQuery({
    params: submissionStatusAnalyticsParams,
    enabled: Boolean(submissionStatusAnalyticsParams),
  })
  const {
    data: outageReasonsData,
    isLoading: isOutageReasonsLoading = false,
    isFetching: isOutageReasonsFetching = false,
    isError: isOutageReasonsError = false,
  } = useOutageReasonsQuery({
    params: outageReasonsAnalyticsParams,
    enabled: Boolean(outageReasonsAnalyticsParams),
  })
  const { data: currentRegularityKpiData } = useAverageSchemeRegularityQuery({
    params: currentRegularityAnalyticsParams,
    enabled: Boolean(currentRegularityAnalyticsParams),
  })
  const { data: previousRegularityKpiData } = useAverageSchemeRegularityQuery({
    params: previousRegularityAnalyticsParams,
    enabled: Boolean(previousRegularityAnalyticsParams),
  })
  const previousQuantityPeriodicAnalyticsParams =
    !isHierarchyLeafSelected || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            lgdId: analyticsParentId,
            startDate: previousAnalyticsRange.startDate,
            endDate: previousAnalyticsRange.endDate,
            scale: resolveWaterQuantityPeriodicScale(
              previousAnalyticsRange.startDate,
              previousAnalyticsRange.endDate
            ),
          }
        : {
            departmentId: analyticsParentId,
            startDate: previousAnalyticsRange.startDate,
            endDate: previousAnalyticsRange.endDate,
            scale: resolveWaterQuantityPeriodicScale(
              previousAnalyticsRange.startDate,
              previousAnalyticsRange.endDate
            ),
          }
  const previousRegularityPeriodicAnalyticsParams =
    !isHierarchyLeafSelected || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            lgdId: analyticsParentId,
            startDate: previousAnalyticsRange.startDate,
            endDate: previousAnalyticsRange.endDate,
            scale: resolveWaterQuantityPeriodicScale(
              previousAnalyticsRange.startDate,
              previousAnalyticsRange.endDate
            ),
          }
        : {
            tenantId: selectedTenant.tenantId,
            departmentId: analyticsParentId,
            startDate: previousAnalyticsRange.startDate,
            endDate: previousAnalyticsRange.endDate,
            scale: resolveWaterQuantityPeriodicScale(
              previousAnalyticsRange.startDate,
              previousAnalyticsRange.endDate
            ),
          }
  const { data: previousWaterQuantityPeriodicData } = useWaterQuantityPeriodicQuery({
    params: previousQuantityPeriodicAnalyticsParams,
    enabled: Boolean(previousQuantityPeriodicAnalyticsParams),
  })
  const { data: previousSchemeRegularityPeriodicData } = useSchemeRegularityPeriodicQuery({
    params: previousRegularityPeriodicAnalyticsParams,
    enabled: Boolean(previousRegularityPeriodicAnalyticsParams),
  })
  const previousQuantityTrendPeriodicAnalyticsParams =
    !isHierarchyLeafSelected || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            tenantId: selectedTenant.tenantId,
            lgdId: analyticsParentId,
            startDate: previousAnalyticsRange.startDate,
            endDate: previousAnalyticsRange.endDate,
            scale: resolveWaterQuantityPeriodicScale(
              previousAnalyticsRange.startDate,
              previousAnalyticsRange.endDate
            ),
          }
        : {
            tenantId: selectedTenant.tenantId,
            departmentId: analyticsParentId,
            startDate: previousAnalyticsRange.startDate,
            endDate: previousAnalyticsRange.endDate,
            scale: resolveWaterQuantityPeriodicScale(
              previousAnalyticsRange.startDate,
              previousAnalyticsRange.endDate
            ),
          }
  const { data: previousSchemeQuantityPeriodicData } = useSchemeRegularityPeriodicQuery({
    params: previousQuantityTrendPeriodicAnalyticsParams,
    enabled: Boolean(previousQuantityTrendPeriodicAnalyticsParams),
  })
  const isCentralLandingView = !hasCentralLandingFilters
  const nationalQuantityTenantIds = Array.from(
    new Set(
      (filteredNationalDashboardData?.stateWiseQuantityPerformance ?? [])
        .map((state) => state.tenantId)
        .filter((tenantId) => typeof tenantId === 'number' && tenantId > 0)
    )
  )
  const nationalTenantPublicConfigQueries = useQueries({
    queries: nationalQuantityTenantIds.map((tenantId) => ({
      queryKey: dashboardQueryKeys.tenantPublicConfig(tenantId),
      queryFn: () => dashboardApi.getTenantPublicConfig(tenantId),
      enabled: isCentralLandingView,
    })),
  })
  const isNationalDashboardPending = isQueryPending(
    Boolean(nationalDashboardParams),
    isNationalDashboardLoading,
    isNationalDashboardFetching
  )
  const isNationalDashboardBoundariesPending = isQueryPending(
    !hasCentralLandingFilters,
    isNationalDashboardBoundariesLoading,
    isNationalDashboardBoundariesFetching
  )
  const isNationalTenantPublicConfigPending = nationalTenantPublicConfigQueries.some(
    (query) => query.isLoading || query.isFetching
  )
  const isAverageWaterSupplyPending = isQueryPending(
    Boolean(analyticsParams),
    isAverageWaterSupplyLoading,
    isAverageWaterSupplyFetching
  )
  const isAverageSchemeRegularityPending = isQueryPending(
    Boolean(regularityAnalyticsParams),
    isAverageSchemeRegularityLoading,
    isAverageSchemeRegularityFetching
  )
  const isWaterQuantityRegionWisePending = isQueryPending(
    Boolean(quantityRegionWiseAnalyticsParams),
    isWaterQuantityRegionWiseLoading,
    isWaterQuantityRegionWiseFetching
  )
  const isReadingSubmissionRatePending = isQueryPending(
    Boolean(readingSubmissionRateAnalyticsParams),
    isReadingSubmissionRateLoading,
    isReadingSubmissionRateFetching
  )
  const isSchemePerformancePending = isQueryPending(
    Boolean(schemePerformanceAnalyticsParams),
    isSchemePerformanceLoading,
    isSchemePerformanceFetching
  )
  const isSubmissionStatusPending = isQueryPending(
    Boolean(submissionStatusAnalyticsParams),
    isSubmissionStatusLoading,
    isSubmissionStatusFetching
  )
  const isOutageReasonsPending = isQueryPending(
    Boolean(outageReasonsAnalyticsParams),
    isOutageReasonsLoading,
    isOutageReasonsFetching
  )
  const isOutageReasonsPeriodicPending = isQueryPending(
    Boolean(outageReasonsPeriodicAnalyticsParams),
    isOutageReasonsPeriodicLoading,
    isOutageReasonsPeriodicFetching
  )
  const isOverallPerformanceLoading = isCentralLandingView
    ? isNationalDashboardPending
    : isAverageWaterSupplyPending || isAverageSchemeRegularityPending
  const isQuantityPerformanceLoading = isCentralLandingView
    ? isNationalDashboardPending || isNationalTenantPublicConfigPending
    : isAverageWaterSupplyPending || isWaterQuantityRegionWisePending
  const isRegularityPerformanceLoading = isCentralLandingView
    ? isNationalDashboardPending
    : isAverageSchemeRegularityPending
  const isReadingSubmissionRateWidgetLoading = isCentralLandingView
    ? isNationalDashboardPending
    : isReadingSubmissionRatePending
  const isOutageReasonsWidgetLoading = isCentralLandingView
    ? isNationalDashboardPending
    : isOutageReasonsPending
  const isOutageDistributionWidgetLoading =
    isOutageReasonsWidgetLoading || isOutageReasonsPeriodicPending

  const isOverallPerformanceError = isCentralLandingView
    ? isNationalDashboardError
    : isAverageWaterSupplyError || isAverageSchemeRegularityError
  const isQuantityPerformanceError = isCentralLandingView
    ? isNationalDashboardError
    : isAverageWaterSupplyError || isWaterQuantityRegionWiseError
  const isRegularityPerformanceError = isCentralLandingView
    ? isNationalDashboardError
    : isAverageSchemeRegularityError
  const isQuantityTimeTrendError = isCentralLandingView
    ? isNationalSchemeQuantityPeriodicError
    : isWaterQuantityPeriodicError
  const isRegularityTimeTrendError = isCentralLandingView
    ? isNationalSchemeRegularityPeriodicError
    : isSchemeRegularityPeriodicError
  const isReadingSubmissionRateWidgetError = isCentralLandingView
    ? isNationalDashboardError
    : isReadingSubmissionRateError
  const isOutageReasonsWidgetError = isCentralLandingView
    ? isNationalDashboardError
    : isOutageReasonsError
  const isSchemePerformanceError = isSchemePerformanceErrorRaw
  const isSubmissionStatusError = isSubmissionStatusErrorRaw

  const nationalDemandInputsByTenantId = nationalQuantityTenantIds.reduce<
    Map<number, { averagePersonsPerHousehold: number; litersPerPersonPerDay: number }>
  >((acc, tenantId, index) => {
    const config = nationalTenantPublicConfigQueries[index]?.data
    acc.set(tenantId, {
      averagePersonsPerHousehold: resolvePositiveNumber(
        config?.averageMembersPerHousehold,
        defaultAverageMembersPerHousehold
      ),
      litersPerPersonPerDay: resolvePositiveNumber(
        config?.waterNorm,
        defaultWaterNormLitersPerPersonPerDay
      ),
    })
    return acc
  }, new Map())

  return {
    analyticsParams,
    averageSchemeRegularityData,
    averageWaterSupplyData,
    continuousSchemesData,
    criticalSchemesData,
    currentRegularityKpiData,
    currentWaterSupplyKpiData,
    filteredNationalDashboardBoundaries,
    filteredNationalDashboardData,
    filteredPreviousNationalDashboardData,
    isAverageSchemeRegularityPending,
    isAverageWaterSupplyPending,
    isCentralLandingView,
    isNationalDashboardBoundariesPending,
    isNationalDashboardPending,
    isOverallPerformanceError,
    isOverallPerformanceLoading,
    isOutageDistributionWidgetLoading,
    isOutageReasonsWidgetError,
    isOutageReasonsWidgetLoading,
    isQuantityPerformanceError,
    isQuantityPerformanceLoading,
    isQuantityTimeTrendError,
    isReadingSubmissionRateWidgetError,
    isReadingSubmissionRateWidgetLoading,
    isRegularityPerformanceError,
    isRegularityPerformanceLoading,
    isRegularityTimeTrendError,
    isSchemePerformanceError,
    isSchemePerformancePending,
    isSubmissionStatusError,
    isSubmissionStatusPending,
    isTenantBoundariesFetching,
    isTenantBoundariesLoading,
    isTenantBoundaryGeoJsonFetching,
    isTenantBoundaryGeoJsonLoading,
    isWaterQuantityPeriodicAwaitingParams,
    isWaterQuantityPeriodicFetching,
    isNationalSchemeQuantityPeriodicFetching,
    isNationalSchemeRegularityPeriodicFetching,
    isSchemeRegularityPeriodicFetching,
    nationalDemandInputsByTenantId,
    nationalDashboardBoundariesData,
    nationalSchemeQuantityPeriodicData,
    nationalSchemeRegularityPeriodicData,
    outageReasonsData,
    outageReasonsPeriodicData,
    previousAnalyticsRange,
    previousContinuousSchemesData,
    previousCriticalSchemesData,
    previousRegularityKpiData,
    previousSchemeQuantityPeriodicData,
    previousSchemeRegularityPeriodicData,
    previousWaterQuantityPeriodicData,
    previousWaterSupplyKpiData,
    readingSubmissionRateData,
    schemePerformanceAnalyticsParams,
    schemePerformanceData,
    schemeRegularityPeriodicData,
    selectedSchemeId,
    shouldFetchSchemePerformanceAnalytics,
    submissionStatusData,
    tenantBoundaryAnalyticsParams,
    tenantBoundaryData,
    tenantBoundaryGeoJsonData,
    totalSchemePages,
    waterQuantityPeriodicData,
    waterQuantityRegionWiseData,
  }
}

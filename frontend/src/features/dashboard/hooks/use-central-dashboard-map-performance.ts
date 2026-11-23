import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../services/api/dashboard-api'
import { dashboardQueryKeys } from '../services/query/dashboard-query-keys'
import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  EntityPerformance,
  NationalDashboardBoundaryResponse,
  NationalDashboardResponse,
  TenantBoundaryGeoJsonResponse,
  TenantBoundaryResponse,
  WaterQuantityRegionWiseResponse,
} from '../types'
import {
  type LocationOption,
  mapNationalBoundariesToPerformance,
} from '../utils/central-dashboard-helpers'
import {
  calculateAverageRegularityPercent,
  mapOverallPerformanceFromAnalytics,
  mapOverallPerformanceFromNationalDashboard,
  mapTenantBoundariesToPerformance,
  resolveDaysInRange,
} from '../utils/formulas'
import { slugify } from '../utils/format-location-label'
import {
  type ChildRegionIds,
  noRegionOnboarded,
  toOnboardedDistrictsByTenant,
} from '../utils/onboarded-regions'
import { retryTransientFailures } from '../utils/query-retry'
import { toStableLocationValue } from '../utils/stable-location-value'

type UseCentralDashboardMapPerformanceParams = {
  averagePersonsPerHousehold: number
  averageSchemeRegularityData?: AverageSchemeRegularityResponse
  averageWaterSupplyData?: AverageWaterSupplyPerRegionResponse
  emptyEntityPerformance: EntityPerformance[]
  expectedOverallPerformanceOptions: LocationOption[]
  filteredNationalDashboardBoundaries?: NationalDashboardBoundaryResponse
  filteredNationalDashboardData?: NationalDashboardResponse
  hoveredOverallPerformanceRow: EntityPerformance | null
  isCentralLandingView: boolean
  isDepartmentCircleSelected: boolean
  isDepartmentDivisionSelected: boolean
  isDepartmentStateSelected: boolean
  isDepartmentTabActive: boolean
  isDepartmentZoneSelected: boolean
  isHierarchyFourthLevelSelected: boolean
  isHierarchySecondLevelSelected: boolean
  isHierarchyStateSelected: boolean
  isHierarchyThirdLevelSelected: boolean
  isMapDistrictView: boolean
  isNationalDashboardBoundariesPending: boolean
  /** Phased rollout: whether a child of the analytics parent is shown. */
  isOnboardedChild: (region: ChildRegionIds) => boolean
  isOnboardedChildrenLoading: boolean
  isTenantBoundariesFetching: boolean
  isTenantBoundariesLoading: boolean
  isTenantBoundaryGeoJsonFetching: boolean
  isTenantBoundaryGeoJsonLoading: boolean
  nationalDashboardBoundariesData?: NationalDashboardBoundaryResponse
  nationalDefaultAverageMembersPerHousehold: number
  shouldFetchTenantBoundaryGeoJson: boolean
  tenantBoundaryAnalyticsParams: object | null
  tenantBoundaryData?: TenantBoundaryResponse
  tenantBoundaryGeoJsonData?: TenantBoundaryGeoJsonResponse
  tenantBoundaryLocationOptions: LocationOption[]
  waterQuantityRegionWiseData?: WaterQuantityRegionWiseResponse
}

export function useCentralDashboardMapPerformance({
  averagePersonsPerHousehold,
  averageSchemeRegularityData,
  averageWaterSupplyData,
  emptyEntityPerformance,
  expectedOverallPerformanceOptions,
  filteredNationalDashboardBoundaries,
  filteredNationalDashboardData,
  hoveredOverallPerformanceRow,
  isCentralLandingView,
  isDepartmentCircleSelected,
  isDepartmentDivisionSelected,
  isDepartmentStateSelected,
  isDepartmentTabActive,
  isDepartmentZoneSelected,
  isHierarchyFourthLevelSelected,
  isHierarchySecondLevelSelected,
  isHierarchyStateSelected,
  isHierarchyThirdLevelSelected,
  isMapDistrictView,
  isNationalDashboardBoundariesPending,
  isOnboardedChild,
  isOnboardedChildrenLoading,
  isTenantBoundariesFetching,
  isTenantBoundariesLoading,
  isTenantBoundaryGeoJsonFetching,
  isTenantBoundaryGeoJsonLoading,
  nationalDashboardBoundariesData,
  nationalDefaultAverageMembersPerHousehold,
  shouldFetchTenantBoundaryGeoJson,
  tenantBoundaryAnalyticsParams,
  tenantBoundaryData,
  tenantBoundaryGeoJsonData,
  tenantBoundaryLocationOptions,
  waterQuantityRegionWiseData,
}: UseCentralDashboardMapPerformanceParams) {
  const rawOverallPerformanceTableData = isCentralLandingView
    ? mapOverallPerformanceFromNationalDashboard(
        filteredNationalDashboardData,
        emptyEntityPerformance,
        nationalDefaultAverageMembersPerHousehold
      )
    : mapOverallPerformanceFromAnalytics(
        averageWaterSupplyData,
        averageSchemeRegularityData,
        emptyEntityPerformance,
        averagePersonsPerHousehold
      )
  const boundaryOverallPerformanceOptions: LocationOption[] = (
    tenantBoundaryData?.childRegions ?? []
  ).flatMap((region) => {
    const boundaryId = [region.childLgdId, region.childDepartmentId].find(
      (id) => typeof id === 'number' && id > 0
    )
    const rawTitle = region.childLgdTitle ?? region.childDepartmentTitle ?? ''
    const normalizedTitle = rawTitle.trim()
    const matchedExpectedOption = expectedOverallPerformanceOptions.find((option) => {
      const optionIds = [option.locationId, option.analyticsId]
      const hasMatchingId =
        typeof boundaryId === 'number' &&
        optionIds.some((id) => typeof id === 'number' && id === boundaryId)

      return hasMatchingId || slugify(option.label) === slugify(normalizedTitle)
    })
    const matchedExpectedAnalyticsId = matchedExpectedOption?.analyticsId

    if (typeof boundaryId !== 'number' || !normalizedTitle) {
      return []
    }

    return [
      {
        value: toStableLocationValue(
          boundaryId,
          matchedExpectedAnalyticsId ?? boundaryId,
          slugify(normalizedTitle)
        ),
        label: normalizedTitle,
        locationId: boundaryId,
        analyticsId: matchedExpectedAnalyticsId ?? boundaryId,
      },
    ]
  })
  const overallPerformanceLocationOptions = [
    ...expectedOverallPerformanceOptions,
    ...boundaryOverallPerformanceOptions,
  ]
  const tenantBoundaryOverallPerformanceIds = new Set(
    (tenantBoundaryData?.childRegions ?? []).flatMap((region) => {
      const childIds = [region.childLgdId, region.childDepartmentId]
      return childIds.flatMap((id) =>
        typeof id === 'number' && id > 0 ? [String(id)] : ([] as string[])
      )
    })
  )
  const expectedOverallPerformanceIds = new Set(
    [
      ...expectedOverallPerformanceOptions.flatMap((option) => {
        const optionIds = [option.locationId, option.analyticsId]
        return optionIds.flatMap((id) =>
          typeof id === 'number' && id > 0 ? [String(id)] : ([] as string[])
        )
      }),
      ...tenantBoundaryOverallPerformanceIds,
    ].filter(Boolean)
  )
  const tenantBoundaryOverallPerformanceNames = new Set(
    (tenantBoundaryData?.childRegions ?? [])
      .map((region) => region.childLgdTitle ?? region.childDepartmentTitle ?? '')
      .map((title) => title.trim())
      .filter(Boolean)
      .map((title) => slugify(title))
  )
  const expectedOverallPerformanceNames = new Set(
    [
      ...expectedOverallPerformanceOptions.map((option) => slugify(option.label)),
      ...tenantBoundaryOverallPerformanceNames,
    ].filter(Boolean)
  )
  const shouldRequireOverallPerformanceChildOptions = isDepartmentTabActive
    ? isDepartmentStateSelected ||
      isDepartmentZoneSelected ||
      isDepartmentCircleSelected ||
      isDepartmentDivisionSelected
    : isHierarchyStateSelected ||
      isHierarchySecondLevelSelected ||
      isHierarchyThirdLevelSelected ||
      isHierarchyFourthLevelSelected
  const overallPerformanceTableData =
    expectedOverallPerformanceIds.size > 0 || expectedOverallPerformanceNames.size > 0
      ? rawOverallPerformanceTableData.filter((row) => {
          const normalizedRowId = row.id?.trim()
          return (
            (normalizedRowId ? expectedOverallPerformanceIds.has(normalizedRowId) : false) ||
            expectedOverallPerformanceNames.has(slugify(row.name))
          )
        })
      : shouldRequireOverallPerformanceChildOptions
        ? emptyEntityPerformance
        : rawOverallPerformanceTableData
  const normalizedHoveredOverallPerformanceId = hoveredOverallPerformanceRow?.id?.trim()
  const normalizedHoveredOverallPerformanceName = hoveredOverallPerformanceRow
    ? slugify(hoveredOverallPerformanceRow.name)
    : null
  const effectiveHoveredOverallPerformanceRow = hoveredOverallPerformanceRow
    ? (overallPerformanceTableData.find((row) => {
        const normalizedRowId = row.id?.trim()
        return (
          (normalizedHoveredOverallPerformanceId &&
            normalizedRowId &&
            normalizedHoveredOverallPerformanceId === normalizedRowId) ||
          slugify(row.name) === normalizedHoveredOverallPerformanceName
        )
      }) ?? null)
    : null

  const nationalDaysInRange = resolveDaysInRange(
    filteredNationalDashboardData?.daysInRange,
    filteredNationalDashboardData?.startDate,
    filteredNationalDashboardData?.endDate
  )
  const nationalQuantityByTenantId = (
    filteredNationalDashboardData?.stateWiseQuantityPerformance ?? []
  ).reduce<Map<number, number>>((acc, state) => {
    const schemeCount = Number(state.schemeCount)
    const supplyDaysInEfficientRange = Number(state.supplyDaysInEfficientRange)

    if (
      state.tenantId > 0 &&
      Number.isFinite(schemeCount) &&
      schemeCount > 0 &&
      Number.isFinite(supplyDaysInEfficientRange) &&
      supplyDaysInEfficientRange >= 0 &&
      nationalDaysInRange > 0
    ) {
      acc.set(
        state.tenantId,
        Number(
          ((supplyDaysInEfficientRange / (nationalDaysInRange * schemeCount)) * 100).toFixed(1)
        )
      )
    }
    return acc
  }, new Map())
  const nationalRegularityByTenantId = (
    filteredNationalDashboardData?.stateWiseRegularity ?? []
  ).reduce<Map<number, number>>((acc, state) => {
    if (state.tenantId > 0 && state.schemeCount > 0 && state.regularSchemeCount >= 0) {
      acc.set(
        state.tenantId,
        calculateAverageRegularityPercent(state.regularSchemeCount, state.schemeCount)
      )
    }
    return acc
  }, new Map())
  const nationalMapFallbackData: EntityPerformance[] = (
    filteredNationalDashboardBoundaries?.stateWiseBoundaries ?? []
  ).map((state, index) => ({
    id: String(state.tenantId || index),
    name: state.stateTitle || `State ${index + 1}`,
    coverage: 0,
    regularity:
      typeof nationalRegularityByTenantId.get(state.tenantId) === 'number'
        ? (nationalRegularityByTenantId.get(state.tenantId) as number)
        : -1,
    continuity: 0,
    quantity:
      typeof nationalQuantityByTenantId.get(state.tenantId) === 'number'
        ? (nationalQuantityByTenantId.get(state.tenantId) as number)
        : -1,
    compositeScore: 0,
    status: 'needs-attention',
  }))
  const tenantBoundaryDataForMap = tenantBoundaryData
    ? {
        ...tenantBoundaryData,
        childRegions: (tenantBoundaryData.childRegions ?? []).map((region) => {
          const regionTitle =
            region.title ?? region.childLgdTitle ?? region.childDepartmentTitle ?? ''
          const matchingBoundaryRegion = (tenantBoundaryGeoJsonData?.childRegions ?? []).find(
            (boundaryRegion) => {
              const byDepartmentId =
                typeof region.childDepartmentId === 'number' &&
                typeof boundaryRegion.departmentId === 'number' &&
                region.childDepartmentId === boundaryRegion.departmentId
              const byLgdId =
                typeof region.childLgdId === 'number' &&
                typeof boundaryRegion.lgdId === 'number' &&
                region.childLgdId === boundaryRegion.lgdId
              const byTitle =
                Boolean(regionTitle.trim()) &&
                Boolean(boundaryRegion.title?.trim()) &&
                slugify(regionTitle) === slugify(boundaryRegion.title ?? '')

              return byDepartmentId || byLgdId || byTitle
            }
          )

          return {
            ...region,
            boundaryGeoJson: matchingBoundaryRegion?.parsedBoundaryGeoJson ?? null,
          }
        }),
      }
    : undefined
  const mapChartData = isCentralLandingView
    ? mapNationalBoundariesToPerformance(
        filteredNationalDashboardBoundaries,
        nationalMapFallbackData
      )
    : mapTenantBoundariesToPerformance(
        tenantBoundaryDataForMap,
        overallPerformanceTableData,
        tenantBoundaryLocationOptions,
        averageSchemeRegularityData,
        waterQuantityRegionWiseData,
        averageWaterSupplyData,
        isOnboardedChild
      )
  const isMapDataLoading = isCentralLandingView
    ? !nationalDashboardBoundariesData && isNationalDashboardBoundariesPending
    : Boolean(tenantBoundaryAnalyticsParams) &&
      (isOnboardedChildrenLoading ||
        ((!tenantBoundaryData || !tenantBoundaryGeoJsonData) &&
          (isTenantBoundariesLoading ||
            isTenantBoundariesFetching ||
            isTenantBoundaryGeoJsonLoading ||
            isTenantBoundaryGeoJsonFetching)))

  const isNationalDistrictViewActive =
    shouldFetchTenantBoundaryGeoJson && isMapDistrictView && isCentralLandingView
  const stateWiseBoundaries = filteredNationalDashboardBoundaries?.stateWiseBoundaries ?? []
  // One request for every state's districts and one for every state's onboarded list. Two per
  // state overran the gateway's rate limit, and each rejected state was drawn grey.
  const districtBoundariesQuery = useQuery({
    queryKey: dashboardQueryKeys.nationalDashboardDistrictBoundaries(),
    queryFn: () => dashboardApi.getNationalDashboardDistrictBoundaries(),
    enabled: isNationalDistrictViewActive,
    staleTime: Infinity,
    retry: retryTransientFailures,
  })
  // Phased rollout: which districts of each state are onboarded. A 429 or 5xx is retried, so a
  // passing failure doesn't grey out the map; one that persists does.
  const onboardedDistrictsQuery = useQuery({
    queryKey: dashboardQueryKeys.nationalOnboardedDistricts(),
    queryFn: () => dashboardApi.getNationalOnboardedDistricts(),
    enabled: isNationalDistrictViewActive,
    retry: retryTransientFailures,
  })
  // The districts are drawn once the onboarded list has settled. Until it resolves, or when it
  // fails (a failed refetch included, which keeps the last list in `data`), none of them counts
  // as onboarded, so the view fails closed.
  const onboardedDistrictsOf =
    toOnboardedDistrictsByTenant(
      onboardedDistrictsQuery.isError ? undefined : onboardedDistrictsQuery.data
    ) ?? (() => noRegionOnboarded)
  const stateByTenantId = new Map(stateWiseBoundaries.map((state) => [state.tenantId, state]))
  // Only the districts of states on the national map: the endpoint lists every tenant's.
  const districtViewDistricts =
    districtBoundariesQuery.data && !onboardedDistrictsQuery.isLoading
      ? districtBoundariesQuery.data.lgdLevel2Boundaries.flatMap((district) => {
          const state = stateByTenantId.get(district.tenantId)
          if (!state) return []
          return [
            { state, district, isOnboarded: onboardedDistrictsOf(state.tenantId)(district.lgdId) },
          ]
        })
      : []
  const districtMapChartData = districtViewDistricts.flatMap(({ state, district, isOnboarded }) => {
    if (!district.boundary) return []
    const statePerf = mapChartData.find((s) => s.id === String(state.tenantId))
    const districtAnalyticsId = String(district.lgdId ?? '')
    // Not onboarded: no metrics, so the map draws it grey and won't drill into it.
    return [
      {
        id: districtAnalyticsId,
        name: `${district.title ?? ''}::${districtAnalyticsId}`,
        coverage: statePerf?.coverage ?? 0,
        regularity: isOnboarded ? (statePerf?.regularity ?? -1) : -1,
        continuity: statePerf?.continuity ?? 0,
        quantity: isOnboarded ? (statePerf?.quantity ?? -1) : -1,
        compositeScore: statePerf?.compositeScore ?? 0,
        status: statePerf?.status ?? ('needs-attention' as const),
        boundaryGeoJson: district.boundary,
      },
    ]
  })
  const isDistrictMapLoading =
    isMapDistrictView &&
    isCentralLandingView &&
    districtViewDistricts.length === 0 &&
    (isNationalDashboardBoundariesPending ||
      districtBoundariesQuery.isLoading ||
      districtBoundariesQuery.isFetching ||
      onboardedDistrictsQuery.isLoading)

  const districtToStateMap = new Map<
    string,
    NonNullable<NationalDashboardBoundaryResponse['stateWiseBoundaries']>[number]
  >()
  districtViewDistricts.forEach(({ state, district, isOnboarded }) => {
    const id = String(district.lgdId ?? '')
    if (id && isOnboarded) districtToStateMap.set(id, state)
  })

  return {
    boundaryOverallPerformanceOptions,
    districtMapChartData,
    districtToStateMap,
    effectiveHoveredOverallPerformanceRow,
    expectedOverallPerformanceOptions,
    isDistrictMapLoading,
    isMapDataLoading,
    mapChartData,
    overallPerformanceLocationOptions,
    overallPerformanceTableData,
  }
}

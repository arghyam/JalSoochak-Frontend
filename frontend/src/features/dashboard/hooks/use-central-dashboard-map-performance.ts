import { useQueries } from '@tanstack/react-query'
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
        averageWaterSupplyData
      )
  const isMapDataLoading = isCentralLandingView
    ? !nationalDashboardBoundariesData && isNationalDashboardBoundariesPending
    : Boolean(tenantBoundaryAnalyticsParams) &&
      (!tenantBoundaryData || !tenantBoundaryGeoJsonData) &&
      (isTenantBoundariesLoading ||
        isTenantBoundariesFetching ||
        isTenantBoundaryGeoJsonLoading ||
        isTenantBoundaryGeoJsonFetching)

  const stateWiseBoundaries = filteredNationalDashboardBoundaries?.stateWiseBoundaries ?? []
  const districtBoundaryQueries = useQueries({
    queries: stateWiseBoundaries.map((state) => ({
      queryKey: dashboardQueryKeys.tenantBoundaryGeoJson({
        tenantId: state.tenantId,
        parentLgdId: state.lgdId,
      }),
      queryFn: () =>
        dashboardApi.getTenantBoundaryGeoJson({
          tenantId: state.tenantId,
          parentLgdId: state.lgdId,
        }),
      enabled:
        shouldFetchTenantBoundaryGeoJson &&
        isMapDistrictView &&
        isCentralLandingView &&
        Boolean(state.tenantId),
      staleTime: Infinity,
      retry: false,
    })),
  })
  const districtMapChartData = districtBoundaryQueries.flatMap((query, index) => {
    if (!query.data) return []
    const state = stateWiseBoundaries[index]
    const statePerf = mapChartData.find((s) => s.id === String(state.tenantId))
    return (query.data.childRegions ?? []).flatMap((district) => {
      if (!district.parsedBoundaryGeoJson) return []
      const districtAnalyticsId = String(district.lgdId ?? district.lgdCode ?? '')
      return [
        {
          id: districtAnalyticsId,
          name: `${district.title ?? ''}::${districtAnalyticsId}`,
          coverage: statePerf?.coverage ?? 0,
          regularity: statePerf?.regularity ?? -1,
          continuity: statePerf?.continuity ?? 0,
          quantity: statePerf?.quantity ?? -1,
          compositeScore: statePerf?.compositeScore ?? 0,
          status: statePerf?.status ?? ('needs-attention' as const),
          boundaryGeoJson: district.parsedBoundaryGeoJson,
        },
      ]
    })
  })
  const hasAnyDistrictData = districtBoundaryQueries.some((q) => Boolean(q.data))
  const isDistrictMapLoading =
    isMapDistrictView &&
    isCentralLandingView &&
    !hasAnyDistrictData &&
    (isNationalDashboardBoundariesPending ||
      districtBoundaryQueries.some((query) => query.isLoading || query.isFetching))

  const districtToStateMap = new Map<
    string,
    NonNullable<NationalDashboardBoundaryResponse['stateWiseBoundaries']>[number]
  >()
  districtBoundaryQueries.forEach((query, index) => {
    if (!query.data) return
    const state = stateWiseBoundaries[index]
    ;(query.data.childRegions ?? []).forEach((district) => {
      const id = String(district.lgdId ?? district.lgdCode ?? '')
      if (id) districtToStateMap.set(id, state)
    })
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

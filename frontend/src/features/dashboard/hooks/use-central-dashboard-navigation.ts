import type { Dispatch, SetStateAction } from 'react'
import type { EntityPerformance, NationalDashboardBoundaryState, StateUtOption } from '../types'
import type { DrilldownSource } from '@/shared/lib/analytics'
import type { FilterUrlUpdate, LocationOption } from '../utils/central-dashboard-helpers'
import { isActiveTenantStatus, toStateSlug } from '../utils/central-dashboard-helpers'
import { slugify } from '../utils/format-location-label'
import { toStableLocationValue } from '../utils/stable-location-value'

type UseCentralDashboardNavigationParams = {
  boundaryOverallPerformanceOptions: LocationOption[]
  districtToStateMap: Map<string, NationalDashboardBoundaryState>
  expectedOverallPerformanceOptions: LocationOption[]
  handleBlockChange: (value: string, source?: DrilldownSource) => void
  handleDepartmentCircleChange: (value: string, source?: DrilldownSource) => void
  handleDepartmentDivisionChange: (value: string, source?: DrilldownSource) => void
  handleDepartmentSubdivisionChange: (value: string, source?: DrilldownSource) => void
  handleDepartmentVillageChange: (value: string, source?: DrilldownSource) => void
  handleDepartmentZoneChange: (value: string, source?: DrilldownSource) => void
  handleDistrictChange: (value: string, source?: DrilldownSource) => void
  handleGramPanchayatChange: (value: string, source?: DrilldownSource) => void
  handleVillageChange: (value: string, source?: DrilldownSource) => void
  isCentralLandingView: boolean
  isDepartmentCircleSelected: boolean
  isDepartmentDivisionSelected: boolean
  isDepartmentStateSelected: boolean
  isDepartmentSubdivisionSelected: boolean
  isDepartmentTabActive: boolean
  isDepartmentZoneSelected: boolean
  isHierarchyFourthLevelSelected: boolean
  isHierarchySecondLevelSelected: boolean
  isHierarchyStateSelected: boolean
  isHierarchyThirdLevelSelected: boolean
  isMapDistrictView: boolean
  locationSearchStates: StateUtOption[]
  mapChartData: EntityPerformance[]
  overallPerformanceLocationOptions: LocationOption[]
  overallPerformanceTableData: EntityPerformance[]
  setActiveTrailIndex: (value: number | null) => void
  setFilterTabIndex: Dispatch<SetStateAction<number>>
  setHoveredOverallPerformanceRow: (value: EntityPerformance | null) => void
  setSelectedScheme: Dispatch<SetStateAction<string>>
  updateFilterUrl: (filters: FilterUrlUpdate, source?: DrilldownSource) => void
}

export function useCentralDashboardNavigation({
  boundaryOverallPerformanceOptions,
  districtToStateMap,
  expectedOverallPerformanceOptions,
  handleBlockChange,
  handleDepartmentCircleChange,
  handleDepartmentDivisionChange,
  handleDepartmentSubdivisionChange,
  handleDepartmentVillageChange,
  handleDepartmentZoneChange,
  handleDistrictChange,
  handleGramPanchayatChange,
  handleVillageChange,
  isCentralLandingView,
  isDepartmentCircleSelected,
  isDepartmentDivisionSelected,
  isDepartmentStateSelected,
  isDepartmentSubdivisionSelected,
  isDepartmentTabActive,
  isDepartmentZoneSelected,
  isHierarchyFourthLevelSelected,
  isHierarchySecondLevelSelected,
  isHierarchyStateSelected,
  isHierarchyThirdLevelSelected,
  isMapDistrictView,
  locationSearchStates,
  mapChartData,
  overallPerformanceLocationOptions,
  overallPerformanceTableData,
  setActiveTrailIndex,
  setFilterTabIndex,
  setHoveredOverallPerformanceRow,
  setSelectedScheme,
  updateFilterUrl,
}: UseCentralDashboardNavigationParams) {
  const handleStateClick = (_stateId: string, stateName: string, source: DrilldownSource) => {
    const stateOption = locationSearchStates.find(
      (option) => option.label.toLowerCase() === stateName.toLowerCase()
    )
    // Block drilldown into a known non-ACTIVE tenant.
    if (stateOption && !isActiveTenantStatus(stateOption.status)) {
      return
    }
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: stateOption?.value ?? toStateSlug(stateName),
        tab: 'administrative',
      },
      source
    )
  }

  const handleDistrictViewClick = (
    districtId: string,
    districtRawName: string,
    parentState: NationalDashboardBoundaryState,
    source: DrilldownSource
  ) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    const districtName = districtRawName.includes('::')
      ? districtRawName.split('::')[0]
      : districtRawName
    const stateOption = locationSearchStates.find(
      (option) => option.label.toLowerCase() === parentState.stateTitle.toLowerCase()
    )
    // Block drilldown into a known non-ACTIVE tenant's districts.
    if (stateOption && !isActiveTenantStatus(stateOption.status)) {
      return
    }
    const stateValue = stateOption?.value ?? toStateSlug(parentState.stateTitle)
    const districtLgdId = Number.parseInt(districtId, 10)
    const districtValue = toStableLocationValue(
      Number.isFinite(districtLgdId) ? districtLgdId : 0,
      Number.isFinite(districtLgdId) ? districtLgdId : 0,
      slugify(districtName)
    )
    updateFilterUrl(
      {
        state: stateValue,
        district: districtValue,
        block: '',
        gramPanchayat: '',
        village: '',
        tab: 'administrative',
      },
      source
    )
  }

  const resolveOverallPerformanceLocationValue = (row: EntityPerformance): string | null => {
    const normalizedRowId = row.id?.trim()
    const normalizedRowName = slugify(row.name)

    const matchedOption = overallPerformanceLocationOptions.find((option) => {
      const optionIds = [option.locationId, option.analyticsId]
      const hasMatchingId = optionIds.some(
        (id) => typeof id === 'number' && String(id) === normalizedRowId
      )

      return hasMatchingId || slugify(option.label) === normalizedRowName
    })

    return matchedOption?.value ?? null
  }

  const resolveMapRegionRow = (regionId: string, regionName: string): EntityPerformance | null => {
    const normalizedRegionId = regionId.trim()
    const normalizedRegionName = slugify(regionName)

    return (
      mapChartData.find((region) => {
        const normalizedRowId = region.id?.trim() ?? ''
        return (
          (normalizedRowId.length > 0 && normalizedRowId === normalizedRegionId) ||
          slugify(region.name) === normalizedRegionName
        )
      }) ??
      overallPerformanceTableData.find((region) => {
        const normalizedRowId = region.id?.trim() ?? ''
        return (
          (normalizedRowId.length > 0 && normalizedRowId === normalizedRegionId) ||
          slugify(region.name) === normalizedRegionName
        )
      }) ??
      null
    )
  }

  const resolveLocationValueForRegion = (
    options: LocationOption[],
    regionId: string,
    regionName: string
  ): string | null => {
    const normalizedRegionId = regionId.trim()
    const normalizedRegionName = slugify(regionName)

    const matchedOption = options.find((option) => {
      const optionIds = [option.locationId, option.analyticsId]
      const hasMatchingId = optionIds.some(
        (id) => typeof id === 'number' && String(id) === normalizedRegionId
      )

      return hasMatchingId || slugify(option.label) === normalizedRegionName
    })

    return matchedOption?.value ?? null
  }

  const navigateToResolvedLocationValue = (selectedValue: string, source: DrilldownSource) => {
    if (isDepartmentTabActive) {
      if (isDepartmentSubdivisionSelected) {
        handleDepartmentVillageChange(selectedValue, source)
      } else if (isDepartmentDivisionSelected) {
        handleDepartmentSubdivisionChange(selectedValue, source)
      } else if (isDepartmentCircleSelected) {
        handleDepartmentDivisionChange(selectedValue, source)
      } else if (isDepartmentZoneSelected) {
        handleDepartmentCircleChange(selectedValue, source)
      } else if (isDepartmentStateSelected) {
        handleDepartmentZoneChange(selectedValue, source)
      }
      return
    }

    if (isHierarchyFourthLevelSelected) {
      handleVillageChange(selectedValue, source)
    } else if (isHierarchyThirdLevelSelected) {
      handleGramPanchayatChange(selectedValue, source)
    } else if (isHierarchySecondLevelSelected) {
      handleBlockChange(selectedValue, source)
    } else if (isHierarchyStateSelected) {
      handleDistrictChange(selectedValue, source)
    }
  }

  const handleMapRegionClick = (regionId: string, regionName: string) => {
    setHoveredOverallPerformanceRow(null)

    if (isMapDistrictView && isCentralLandingView && !isDepartmentTabActive) {
      const parentState = districtToStateMap.get(regionId)
      if (parentState) {
        handleDistrictViewClick(regionId, regionName, parentState, 'map')
        return
      }
    }

    if (isCentralLandingView && !isDepartmentTabActive) {
      handleStateClick(regionId, regionName, 'map')
      return
    }

    const selectedValue =
      resolveLocationValueForRegion(expectedOverallPerformanceOptions, regionId, regionName) ??
      resolveLocationValueForRegion(boundaryOverallPerformanceOptions, regionId, regionName)

    if (selectedValue) {
      setActiveTrailIndex(null)
      setSelectedScheme('')
      navigateToResolvedLocationValue(selectedValue, 'map')
      return
    }

    const matchedRow = resolveMapRegionRow(regionId, regionName)
    if (!matchedRow) {
      return
    }

    // Reached via the map, so keep the original source rather than defaulting to the table.
    handleOverallPerformanceRowClick(matchedRow, 'map')
  }

  const handleOverallPerformanceRowClick = (
    row: EntityPerformance,
    source: DrilldownSource = 'table'
  ) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    setHoveredOverallPerformanceRow(null)

    if (isCentralLandingView && !isDepartmentTabActive) {
      handleStateClick(row.id, row.name, source)
      return
    }

    const selectedValue = resolveOverallPerformanceLocationValue(row)
    if (!selectedValue) {
      if (isDepartmentTabActive) {
        handleStateClick(row.id, row.name, source)
      }
      return
    }

    navigateToResolvedLocationValue(selectedValue, source)
  }

  const handleStateHover = (_stateId: string, _stateName: string, _metrics: unknown) => {
    // Hover tooltip is handled by ECharts
  }

  return {
    handleMapRegionClick,
    handleOverallPerformanceRowClick,
    handleStateHover,
  }
}

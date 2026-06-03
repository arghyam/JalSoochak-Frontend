import type { Dispatch, SetStateAction } from 'react'
import type { EntityPerformance, NationalDashboardBoundaryState, StateUtOption } from '../types'
import type { FilterUrlUpdate, LocationOption } from '../utils/central-dashboard-helpers'
import { toStateSlug } from '../utils/central-dashboard-helpers'
import { slugify } from '../utils/format-location-label'
import { toStableLocationValue } from '../utils/stable-location-value'

type UseCentralDashboardNavigationParams = {
  boundaryOverallPerformanceOptions: LocationOption[]
  districtToStateMap: Map<string, NationalDashboardBoundaryState>
  expectedOverallPerformanceOptions: LocationOption[]
  handleBlockChange: (value: string) => void
  handleDepartmentCircleChange: (value: string) => void
  handleDepartmentDivisionChange: (value: string) => void
  handleDepartmentSubdivisionChange: (value: string) => void
  handleDepartmentVillageChange: (value: string) => void
  handleDepartmentZoneChange: (value: string) => void
  handleDistrictChange: (value: string) => void
  handleGramPanchayatChange: (value: string) => void
  handleVillageChange: (value: string) => void
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
  updateFilterUrl: (filters: FilterUrlUpdate) => void
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
  const handleStateClick = (_stateId: string, stateName: string) => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    setSelectedScheme('')
    const stateOption = locationSearchStates.find(
      (option) => option.label.toLowerCase() === stateName.toLowerCase()
    )
    updateFilterUrl({
      state: stateOption?.value ?? toStateSlug(stateName),
      tab: 'administrative',
    })
  }

  const handleDistrictViewClick = (
    districtId: string,
    districtRawName: string,
    parentState: NationalDashboardBoundaryState
  ) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    const districtName = districtRawName.includes('::')
      ? districtRawName.split('::')[0]
      : districtRawName
    const stateOption = locationSearchStates.find(
      (option) => option.label.toLowerCase() === parentState.stateTitle.toLowerCase()
    )
    const stateValue = stateOption?.value ?? toStateSlug(parentState.stateTitle)
    const districtLgdId = Number.parseInt(districtId, 10)
    const districtValue = toStableLocationValue(
      Number.isFinite(districtLgdId) ? districtLgdId : 0,
      Number.isFinite(districtLgdId) ? districtLgdId : 0,
      slugify(districtName)
    )
    updateFilterUrl({
      state: stateValue,
      district: districtValue,
      block: '',
      gramPanchayat: '',
      village: '',
      tab: 'administrative',
    })
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

  const navigateToResolvedLocationValue = (selectedValue: string) => {
    if (isDepartmentTabActive) {
      if (isDepartmentSubdivisionSelected) {
        handleDepartmentVillageChange(selectedValue)
      } else if (isDepartmentDivisionSelected) {
        handleDepartmentSubdivisionChange(selectedValue)
      } else if (isDepartmentCircleSelected) {
        handleDepartmentDivisionChange(selectedValue)
      } else if (isDepartmentZoneSelected) {
        handleDepartmentCircleChange(selectedValue)
      } else if (isDepartmentStateSelected) {
        handleDepartmentZoneChange(selectedValue)
      }
      return
    }

    if (isHierarchyFourthLevelSelected) {
      handleVillageChange(selectedValue)
    } else if (isHierarchyThirdLevelSelected) {
      handleGramPanchayatChange(selectedValue)
    } else if (isHierarchySecondLevelSelected) {
      handleBlockChange(selectedValue)
    } else if (isHierarchyStateSelected) {
      handleDistrictChange(selectedValue)
    }
  }

  const handleMapRegionClick = (regionId: string, regionName: string) => {
    setHoveredOverallPerformanceRow(null)

    if (isMapDistrictView && isCentralLandingView && !isDepartmentTabActive) {
      const parentState = districtToStateMap.get(regionId)
      if (parentState) handleDistrictViewClick(regionId, regionName, parentState)
      return
    }

    if (isCentralLandingView && !isDepartmentTabActive) {
      handleStateClick(regionId, regionName)
      return
    }

    const selectedValue =
      resolveLocationValueForRegion(expectedOverallPerformanceOptions, regionId, regionName) ??
      resolveLocationValueForRegion(boundaryOverallPerformanceOptions, regionId, regionName)

    if (selectedValue) {
      setActiveTrailIndex(null)
      setSelectedScheme('')
      navigateToResolvedLocationValue(selectedValue)
      return
    }

    const matchedRow = resolveMapRegionRow(regionId, regionName)
    if (!matchedRow) {
      return
    }

    handleOverallPerformanceRowClick(matchedRow)
  }

  const handleOverallPerformanceRowClick = (row: EntityPerformance) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    setHoveredOverallPerformanceRow(null)

    if (isCentralLandingView && !isDepartmentTabActive) {
      handleStateClick(row.id, row.name)
      return
    }

    const selectedValue = resolveOverallPerformanceLocationValue(row)
    if (!selectedValue) {
      if (isDepartmentTabActive) {
        handleStateClick(row.id, row.name)
      }
      return
    }

    navigateToResolvedLocationValue(selectedValue)
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

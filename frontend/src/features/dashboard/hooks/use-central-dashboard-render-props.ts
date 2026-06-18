import type { ComponentProps } from 'react'
import { DashboardBody } from '../components/screens/dashboard-body'
import { DashboardFilters } from '../components/filters/dashboard-filters'
import { DashboardKpiGrid } from '../components/central-dashboard/dashboard-kpi-grid'
import { DashboardMapPerformanceSection } from '../components/central-dashboard/dashboard-map-performance-section'

type DashboardBodyProps = ComponentProps<typeof DashboardBody>
type DashboardFiltersProps = ComponentProps<typeof DashboardFilters>
type DashboardKpiGridProps = ComponentProps<typeof DashboardKpiGrid>
type DashboardMapPerformanceSectionProps = ComponentProps<typeof DashboardMapPerformanceSection>

type BuildCentralDashboardRenderPropsParams = DashboardFiltersProps &
  Pick<
    DashboardBodyProps,
    | 'blockTableData'
    | 'districtTableData'
    | 'gramPanchayatTableData'
    | 'isActiveSchemesError'
    | 'isActiveSchemesLoading'
    | 'isBlockSelected'
    | 'isDepartmentCircleSelected'
    | 'isDepartmentDivisionSelected'
    | 'isDepartmentStateSelected'
    | 'isDepartmentZoneSelected'
    | 'isDistrictSelected'
    | 'isGramPanchayatSelected'
    | 'isOutageDistributionLoading'
    | 'isOutageReasonsError'
    | 'isOutageReasonsLoading'
    | 'isQuantityPerformanceError'
    | 'isQuantityPerformanceLoading'
    | 'isQuantityTimeTrendError'
    | 'isReadingSubmissionRateError'
    | 'isReadingSubmissionRateLoading'
    | 'isReadingSubmissionStatusError'
    | 'isReadingSubmissionStatusLoading'
    | 'isRegularityPerformanceError'
    | 'isRegularityPerformanceLoading'
    | 'isRegularityTimeTrendError'
    | 'isSchemePerformanceError'
    | 'isSchemePerformanceLoading'
    | 'isStateSelected'
    | 'isTimeViewEnabled'
    | 'onOutageDistributionTimeScaleTabChange'
    | 'onQuantityTimeScaleTabChange'
    | 'onRegularityTimeScaleTabChange'
    | 'onSchemePageChange'
    | 'operatorsPerformanceTable'
    | 'outageDistributionTimeScaleTab'
    | 'pumpOperatorsTotal'
    | 'quantityPerformanceData'
    | 'quantityTimeScaleTab'
    | 'quantityTimeTrendData'
    | 'regularityPerformanceData'
    | 'regularityTimeScaleTab'
    | 'regularityTimeTrendData'
    | 'schemePerformancePage'
    | 'screenDateFormat'
    | 'supplySubmissionRateData'
    | 'supplySubmissionRateLabel'
    | 'tableDateFormat'
    | 'tenantCode'
    | 'totalSchemePages'
    | 'allSchemeIds'
    | 'startDate'
    | 'endDate'
    | 'villagePhotoEvidenceRows'
    | 'villagePumpOperatorDetails'
    | 'villageTableData'
    | 'waterSupplyOutageDistributionData'
    | 'waterSupplyOutagesData'
  > & {
    activeLeafSelection: string
    analyticsParentId?: number
    derivedVillageSchemeId?: number
    districtMapChartData: DashboardMapPerformanceSectionProps['mapProps']['data']
    effectiveHoveredOverallPerformanceRow: DashboardMapPerformanceSectionProps['mapProps']['hoveredRegion']
    effectiveSelectedState: string
    filteredNationalDashboardBoundary?: DashboardMapPerformanceSectionProps['mapProps']['nationalBoundaryGeoJson']
    handleMapRegionClick: DashboardMapPerformanceSectionProps['mapProps']['onStateClick']
    handleOverallPerformanceRowClick: DashboardMapPerformanceSectionProps['onOverallPerformanceRowClick']
    handleStateHover: DashboardMapPerformanceSectionProps['mapProps']['onStateHover']
    hierarchyType: 'LGD' | 'DEPARTMENT' | 'DEPARTMENTAL' | 'DEPT'
    isCentralLandingView: boolean
    isDistrictMapLoading: boolean
    isMapDataLoading: boolean
    isMapDistrictView: boolean
    isMapFullscreen: boolean
    isMapRegularityView: boolean
    isNationalSchemeQuantityPeriodicFetching: boolean
    isNationalSchemeRegularityPeriodicFetching: boolean
    isSchemeRegularityPeriodicFetching: boolean
    isWaterQuantityPeriodicAwaitingParams: boolean
    isWaterQuantityPeriodicFetching: boolean
    mapChartData: DashboardMapPerformanceSectionProps['mapProps']['data']
    overallPerformanceEntityLabel: string
    isOverallPerformanceError: boolean
    isOverallPerformanceLoading: boolean
    overallPerformanceScrollHeight: string
    overallPerformanceTableData: DashboardMapPerformanceSectionProps['overallPerformanceTableData']
    performanceSummaryCardMaxHeight: DashboardMapPerformanceSectionProps['performanceSummaryCardMaxHeight']
    performanceSummaryTitle: string
    resolvedDashboardData: DashboardBodyProps['data']
    setHoveredOverallPerformanceRow: DashboardMapPerformanceSectionProps['onOverallPerformanceRowHover']
    setIsMapDistrictView: (value: boolean) => void
    setIsMapFullscreen: (value: boolean | ((previous: boolean) => boolean)) => void
    setIsMapRegularityView: DashboardMapPerformanceSectionProps['mapProps']['onRegularityViewChange']
    shouldShowMapAlongsidePerformance: boolean
    tenantBoundaryParentGeoJson?: DashboardMapPerformanceSectionProps['mapProps']['parentBoundaryGeoJson']
    visibleCoreMetrics: DashboardKpiGridProps['metrics']
  }

export function buildCentralDashboardRenderProps({
  activeLeafSelection,
  analyticsParentId,
  blockTableData,
  districtMapChartData,
  districtTableData,
  derivedVillageSchemeId,
  effectiveHoveredOverallPerformanceRow,
  effectiveSelectedState,
  filteredNationalDashboardBoundary,
  gramPanchayatTableData,
  handleMapRegionClick,
  handleOverallPerformanceRowClick,
  handleStateHover,
  hierarchyType,
  isActiveSchemesError,
  isActiveSchemesLoading,
  isBlockSelected,
  isCentralLandingView,
  isDepartmentCircleSelected,
  isDepartmentDivisionSelected,
  isDepartmentStateSelected,
  isDepartmentZoneSelected,
  isDistrictMapLoading,
  isDistrictSelected,
  isGramPanchayatSelected,
  isMapDataLoading,
  isMapDistrictView,
  isMapFullscreen,
  isMapRegularityView,
  isNationalSchemeQuantityPeriodicFetching,
  isNationalSchemeRegularityPeriodicFetching,
  isOutageDistributionLoading,
  isOutageReasonsError,
  isOutageReasonsLoading,
  isQuantityPerformanceError,
  isQuantityPerformanceLoading,
  isQuantityTimeTrendError,
  isReadingSubmissionRateError,
  isReadingSubmissionRateLoading,
  isReadingSubmissionStatusError,
  isReadingSubmissionStatusLoading,
  isRegularityPerformanceError,
  isRegularityPerformanceLoading,
  isRegularityTimeTrendError,
  isSchemePerformanceError,
  isSchemePerformanceLoading,
  isSchemeRegularityPeriodicFetching,
  isStateSelected,
  isTimeViewEnabled,
  isWaterQuantityPeriodicAwaitingParams,
  isWaterQuantityPeriodicFetching,
  mapChartData,
  onOutageDistributionTimeScaleTabChange,
  onQuantityTimeScaleTabChange,
  onRegularityTimeScaleTabChange,
  onSchemePageChange,
  operatorsPerformanceTable,
  outageDistributionTimeScaleTab,
  overallPerformanceEntityLabel,
  isOverallPerformanceError,
  isOverallPerformanceLoading,
  overallPerformanceScrollHeight,
  overallPerformanceTableData,
  performanceSummaryCardMaxHeight,
  performanceSummaryTitle,
  pumpOperatorsTotal,
  quantityPerformanceData,
  quantityTimeScaleTab,
  quantityTimeTrendData,
  regularityPerformanceData,
  regularityTimeScaleTab,
  regularityTimeTrendData,
  resolvedDashboardData,
  schemePerformancePage,
  screenDateFormat,
  setHoveredOverallPerformanceRow,
  setIsMapDistrictView,
  setIsMapFullscreen,
  setIsMapRegularityView,
  shouldShowMapAlongsidePerformance,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  tableDateFormat,
  tenantBoundaryParentGeoJson,
  tenantCode,
  totalSchemePages,
  allSchemeIds,
  startDate,
  endDate,
  villagePhotoEvidenceRows,
  villagePumpOperatorDetails,
  villageTableData,
  visibleCoreMetrics,
  waterSupplyOutageDistributionData,
  waterSupplyOutagesData,
  ...filterProps
}: BuildCentralDashboardRenderPropsParams) {
  const performanceScreenKey =
    isStateSelected && !isDistrictSelected && !isBlockSelected && !isGramPanchayatSelected
      ? `state:${effectiveSelectedState}`
      : !isStateSelected &&
          !isDistrictSelected &&
          !isBlockSelected &&
          !isGramPanchayatSelected &&
          !activeLeafSelection
        ? 'central'
        : null
  const isQuantityTimeTrendLoading = isCentralLandingView
    ? isNationalSchemeQuantityPeriodicFetching
    : isWaterQuantityPeriodicFetching
  const isRegularityTimeTrendLoading = isCentralLandingView
    ? isNationalSchemeRegularityPeriodicFetching
    : isSchemeRegularityPeriodicFetching

  return {
    bodyProps: {
      data: resolvedDashboardData,
      performanceScreenKey,
      isStateSelected,
      isDepartmentStateSelected,
      isDistrictSelected,
      isBlockSelected,
      isGramPanchayatSelected,
      isDepartmentZoneSelected,
      isDepartmentCircleSelected,
      isDepartmentDivisionSelected,
      selectedVillage: activeLeafSelection,
      quantityTimeScaleTab,
      onQuantityTimeScaleTabChange,
      regularityTimeScaleTab,
      onRegularityTimeScaleTabChange,
      outageDistributionTimeScaleTab,
      onOutageDistributionTimeScaleTabChange,
      quantityPerformanceData,
      isQuantityPerformanceLoading,
      isQuantityPerformanceError,
      quantityTimeTrendData,
      isQuantityTimeTrendLoading,
      isQuantityTimeTrendError,
      isQuantityTimeTrendAwaitingParams: isCentralLandingView
        ? false
        : isWaterQuantityPeriodicAwaitingParams,
      regularityPerformanceData,
      isRegularityPerformanceLoading,
      isRegularityPerformanceError,
      regularityTimeTrendData,
      isRegularityTimeTrendLoading,
      isRegularityTimeTrendError,
      districtTableData,
      blockTableData,
      gramPanchayatTableData,
      villageTableData,
      supplySubmissionRateData,
      supplySubmissionRateLabel,
      waterSupplyOutagesData,
      waterSupplyOutageDistributionData,
      isOutageReasonsLoading,
      isOutageDistributionLoading,
      isOutageReasonsError,
      isReadingSubmissionRateLoading,
      isReadingSubmissionRateError,
      isReadingSubmissionStatusLoading,
      isReadingSubmissionStatusError,
      isSchemePerformanceLoading,
      isSchemePerformanceError,
      isActiveSchemesLoading,
      isActiveSchemesError,
      pumpOperatorsTotal,
      operatorsPerformanceTable,
      villagePhotoEvidenceRows,
      villagePumpOperatorDetails,
      tenantCode,
      schemeId: derivedVillageSchemeId,
      allSchemeIds,
      startDate,
      endDate,
      schemePerformancePage,
      totalSchemePages,
      onSchemePageChange,
      screenDateFormat,
      tableDateFormat,
      enableExtendedTimeScales: true,
      isTimeViewEnabled,
    } satisfies DashboardBodyProps,
    filterProps: {
      ...filterProps,
      isDepartmentStateSelected,
    } satisfies DashboardFiltersProps,
    kpiGridProps: {
      metrics: visibleCoreMetrics,
      showIcons: isCentralLandingView,
    } satisfies DashboardKpiGridProps,
    mapPerformanceProps: {
      activeLeafSelection,
      shouldShowMapAlongsidePerformance,
      isMapFullscreen,
      onMapFullscreenClose: () => setIsMapFullscreen(false),
      performanceSummaryCardMaxHeight,
      performanceSummaryTitle,
      overallPerformanceTableData,
      isOverallPerformanceLoading,
      isOverallPerformanceError,
      overallPerformanceEntityLabel,
      overallPerformanceScrollHeight,
      onOverallPerformanceRowClick: handleOverallPerformanceRowClick,
      onOverallPerformanceRowHover: setHoveredOverallPerformanceRow,
      mapProps: {
        data: isMapDistrictView && isCentralLandingView ? districtMapChartData : mapChartData,
        tooltipData: overallPerformanceTableData,
        nationalBoundaryGeoJson: isCentralLandingView
          ? filteredNationalDashboardBoundary
          : undefined,
        parentBoundaryGeoJson: isCentralLandingView ? undefined : tenantBoundaryParentGeoJson,
        isLoading:
          isMapDistrictView && isCentralLandingView ? isDistrictMapLoading : isMapDataLoading,
        mapName:
          isMapDistrictView && isCentralLandingView
            ? 'india-district-view'
            : isCentralLandingView
              ? 'india'
              : `tenant-boundary-${hierarchyType.toLowerCase()}-${analyticsParentId}`,
        onStateClick: handleMapRegionClick,
        onStateHover: handleStateHover,
        onFullscreenToggle: () => setIsMapFullscreen((previous) => !previous),
        isRegularityView: isMapRegularityView,
        onRegularityViewChange: setIsMapRegularityView,
        hoveredRegion: effectiveHoveredOverallPerformanceRow,
        showViewTabs: isCentralLandingView,
        mapViewMode: isMapDistrictView ? 'district' : 'state',
        onMapViewModeChange: (mode) => setIsMapDistrictView(mode === 'district'),
        stateBorderData: isMapDistrictView && isCentralLandingView ? mapChartData : undefined,
      },
    } satisfies DashboardMapPerformanceSectionProps,
  }
}

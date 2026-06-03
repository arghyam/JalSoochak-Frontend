import { Box, Flex, Text, Heading, useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useLocationHierarchyQuery } from '../services/query/use-location-hierarchy-query'
import { useLocationSearchQuery } from '../services/query/use-location-search-query'
import { CentralDashboardContent } from './central-dashboard/central-dashboard-content'
import type { SearchableSelectOption } from '@/shared/components/common'
import type { DashboardData, EntityPerformance, StateUtOption } from '../types'
import { buildCentralDashboardKpiMetrics } from '../hooks/use-central-dashboard-kpi-metrics'
import { useCentralDashboardLocationOptions } from '../hooks/use-central-dashboard-location-options'
import { useCentralDashboardMapPerformance } from '../hooks/use-central-dashboard-map-performance'
import { useCentralDashboardTenantConfig } from '../hooks/use-central-dashboard-tenant-config'
import { toIsoDate } from '../utils/central-dashboard-helpers'
import { useCentralDashboardFilters } from '../hooks/use-central-dashboard-filters'
import { useCentralDashboardKpis } from '../hooks/use-central-dashboard-kpis'
import { useCentralDashboardQueries } from '../hooks/use-central-dashboard-queries'
import { useCentralDashboardLabels } from '../hooks/use-central-dashboard-labels'
import { useCentralDashboardMapUiState } from '../hooks/use-central-dashboard-map-ui-state'
import { useCentralDashboardNavigation } from '../hooks/use-central-dashboard-navigation'
import { buildCentralDashboardPerformanceData } from '../hooks/use-central-dashboard-performance-data'
import { buildCentralDashboardRenderProps } from '../hooks/use-central-dashboard-render-props'
import { buildCentralDashboardResolvedData } from '../hooks/use-central-dashboard-resolved-data'
import { useCentralDashboardTimeScaleState } from '../hooks/use-central-dashboard-time-scale-state'
import { useSchemePerformancePagination } from '../hooks/use-scheme-performance-pagination'
import { useDashboardDefaultDateRange } from '../utils/default-duration'
import { DEFAULT_PERSONS_PER_HOUSEHOLD, resolveDaysInRange } from '../utils/formulas'
import { isSingleTenantMode } from '@/config/server-config'

const DASHBOARD_DURATION_DATE_FORMAT = 'DD/MM/YYYY'

const EMPTY_DASHBOARD_DATA: DashboardData = {
  level: 'central',
  kpis: {
    totalSchemes: 0,
    totalRuralHouseholds: 0,
    functionalTapConnections: 0,
  },
  mapData: [],
  demandSupply: [],
  readingSubmissionStatus: [],
  readingCompliance: [],
  pumpOperators: [],
  waterSupplyOutages: [],
  topPerformers: [],
  worstPerformers: [],
  regularityData: [],
  continuityData: [],
  leadingPumpOperators: [],
  bottomPumpOperators: [],
}

export function CentralDashboard({
  singleTenantOverride,
}: { singleTenantOverride?: StateUtOption } = {}) {
  const { t, i18n } = useTranslation('dashboard')
  const dashboardDefaultDuration = useDashboardDefaultDateRange()
  const overallPerformanceScrollHeight =
    useBreakpointValue({ base: '320px', sm: '420px', lg: '620px' }) ?? '620px'
  const { data } = useDashboardData('central')
  const {
    activeHierarchySelectedBlock,
    activeHierarchySelectedDistrict,
    activeHierarchySelectedGramPanchayat,
    activeHierarchySelectedState,
    activeLeafSelection,
    effectiveSelectedBlock,
    effectiveSelectedDepartmentState,
    effectiveSelectedDistrict,
    effectiveSelectedDuration,
    effectiveSelectedGramPanchayat,
    effectiveSelectedState,
    effectiveSelectedVillage,
    effectiveTrailIndex,
    filterTabIndex,
    handleBlockChange,
    handleClearFilters,
    handleDepartmentCircleChange,
    handleDepartmentDivisionChange,
    handleDepartmentStateChange,
    handleDepartmentSubdivisionChange,
    handleDepartmentVillageChange,
    handleDepartmentZoneChange,
    handleDistrictChange,
    handleFilterTabChange,
    handleGramPanchayatChange,
    handleSelectedDurationChange,
    handleStateChange,
    handleVillageChange,
    hasCentralLandingFilters,
    hierarchyType,
    isAdvancedEnabled,
    isBlockSelected,
    isDepartmentCircleSelected,
    isDepartmentDivisionSelected,
    isDepartmentStateSelected,
    isDepartmentSubdivisionSelected,
    isDepartmentTabActive,
    isDepartmentZoneSelected,
    isDistrictSelected,
    isGramPanchayatSelected,
    isHierarchyFourthLevelSelected,
    isHierarchyLeafSelected,
    isHierarchySecondLevelSelected,
    isHierarchyStateSelected,
    isHierarchyThirdLevelSelected,
    isStateSelected,
    isVillageSelected,
    selectedBlock,
    selectedDepartmentCircle,
    selectedDepartmentDivision,
    selectedDepartmentState,
    selectedDepartmentSubdivision,
    selectedDepartmentVillage,
    selectedDepartmentZone,
    selectedDistrict,
    selectedGramPanchayat,
    selectedScheme,
    selectedState,
    selectedVillage,
    setActiveTrailIndex,
    setFilterTabIndex,
    setSelectedScheme,
    updateFilterUrl,
  } = useCentralDashboardFilters({
    durationDateFormat: DASHBOARD_DURATION_DATE_FORMAT,
    singleTenantOverride,
  })
  const {
    hoveredOverallPerformanceRow,
    isMapDistrictView,
    isMapFullscreen,
    isMapRegularityView,
    setHoveredOverallPerformanceRow,
    setIsMapDistrictView,
    setIsMapFullscreen,
    setIsMapRegularityView,
  } = useCentralDashboardMapUiState()
  const {
    outageDistributionTimeScaleTab,
    quantityTimeScaleTab,
    regularityTimeScaleTab,
    setOutageDistributionTimeScaleTab,
    setQuantityTimeScaleTab,
    setRegularityTimeScaleTab,
  } = useCentralDashboardTimeScaleState()
  const dashboardData = data ?? EMPTY_DASHBOARD_DATA
  const emptyOptions: SearchableSelectOption[] = []
  const emptyEntityPerformance: EntityPerformance[] = []
  const districtTableData = emptyEntityPerformance
  const blockTableData = emptyEntityPerformance
  const gramPanchayatTableData = emptyEntityPerformance
  const villageTableData = emptyEntityPerformance
  const { data: locationSearchData } = useLocationSearchQuery()
  const locationSearchStates = locationSearchData?.states ?? []
  const hasCompleteTenantIds =
    locationSearchStates.length > 0 &&
    locationSearchStates.every((option) => typeof option.tenantId === 'number')
  const activeTenantIds = hasCompleteTenantIds
    ? new Set(locationSearchStates.map((option) => option.tenantId as number))
    : new Set<number>()
  const {
    averagePersonsPerHousehold,
    criticalSchemeStatusAfterDays,
    defaultAverageMembersPerHousehold,
    defaultWaterNormLitersPerPersonPerDay,
    litersPerPersonPerDay,
    screenDateFormat,
    selectedTenant,
    shouldFetchTenantBoundaryGeoJson,
    shouldShowMapAlongsidePerformance,
    tableDateFormat,
  } = useCentralDashboardTenantConfig({
    singleTenantOverride,
    locationSearchStates,
    selectedState,
    isDepartmentTabActive,
    effectiveSelectedDepartmentState,
    isVillageSelected,
    isGramPanchayatSelected,
    isBlockSelected,
    isDistrictSelected,
    isDepartmentDivisionSelected,
    isDepartmentCircleSelected,
    isDepartmentZoneSelected,
  })
  const nationalDefaultAverageMembersPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
  const nationalDefaultWaterNormLitersPerPersonPerDay = defaultWaterNormLitersPerPersonPerDay
  const durationDateFormat = DASHBOARD_DURATION_DATE_FORMAT
  const performanceSummaryCardMaxHeight = { base: '420px', sm: '520px', lg: '710px' } as const
  const { data: locationHierarchyData } = useLocationHierarchyQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const { overallPerformanceEntityLabel, supplySubmissionRateLabel } = useCentralDashboardLabels({
    i18n,
    isDepartmentCircleSelected,
    isDepartmentDivisionSelected,
    isDepartmentStateSelected,
    isDepartmentTabActive,
    isDepartmentZoneSelected,
    isHierarchyFourthLevelSelected,
    isHierarchySecondLevelSelected,
    isHierarchyStateSelected,
    isHierarchyThirdLevelSelected,
    locationHierarchyData,
    t,
  })
  const districtOptions = emptyOptions
  const blockOptions = emptyOptions
  const gramPanchayatOptions = emptyOptions
  const villageOptions = emptyOptions
  const {
    analyticsParentId,
    blockApiOptions,
    departmentAnalyticsParentId,
    districtApiOptions,
    gramPanchayatApiOptions,
    lgdAnalyticsParentId,
    tenantBoundaryLocationOptions,
    villageApiOptions,
  } = useCentralDashboardLocationOptions({
    selectedTenant,
    hierarchyType,
    activeHierarchySelectedState,
    activeHierarchySelectedDistrict,
    activeHierarchySelectedBlock,
    activeHierarchySelectedGramPanchayat,
    effectiveSelectedDistrict,
    effectiveSelectedBlock,
    effectiveSelectedGramPanchayat,
    effectiveSelectedVillage,
    selectedDepartmentVillage,
    selectedDepartmentSubdivision,
    selectedDepartmentDivision,
    selectedDepartmentCircle,
    selectedDepartmentZone,
    effectiveSelectedDepartmentState,
    isDepartmentTabActive,
    isDepartmentStateSelected,
    isDepartmentZoneSelected,
    isDepartmentCircleSelected,
    isDepartmentDivisionSelected,
  })
  const hasValidAnalyticsParentId = analyticsParentId > 0
  const hasValidDepartmentAnalyticsParentId = departmentAnalyticsParentId > 0
  const submissionStatusParentId =
    hierarchyType === 'LGD' ? lgdAnalyticsParentId : departmentAnalyticsParentId
  const hasValidSubmissionStatusParentId =
    hierarchyType === 'LGD' ? hasValidAnalyticsParentId : hasValidDepartmentAnalyticsParentId
  const defaultAnalyticsRange = dashboardDefaultDuration
  const analyticsDateRange = {
    startDate:
      toIsoDate(effectiveSelectedDuration?.startDate, durationDateFormat) ??
      defaultAnalyticsRange.startDate,
    endDate:
      toIsoDate(effectiveSelectedDuration?.endDate, durationDateFormat) ??
      defaultAnalyticsRange.endDate,
  }
  const isTimeViewEnabled =
    resolveDaysInRange(undefined, analyticsDateRange.startDate, analyticsDateRange.endDate) > 1
  const { handleSchemePageChange, schemePerformancePage } = useSchemePerformancePagination({
    analyticsParentId,
    endDate: analyticsDateRange.endDate,
    startDate: analyticsDateRange.startDate,
  })
  const {
    averageSchemeRegularityData,
    averageWaterSupplyData,
    continuousSchemesData,
    criticalSchemesData,
    currentRegularityKpiData,
    currentWaterSupplyKpiData,
    filteredNationalDashboardBoundaries,
    filteredNationalDashboardData,
    filteredPreviousNationalDashboardData,
    isCentralLandingView,
    isOverallPerformanceLoading,
    isNationalDashboardBoundariesPending,
    isOutageDistributionWidgetLoading,
    isOutageReasonsWidgetLoading,
    isOutageReasonsWidgetError,
    isQuantityPerformanceError,
    isQuantityPerformanceLoading,
    isReadingSubmissionRateWidgetError,
    isReadingSubmissionRateWidgetLoading,
    isRegularityPerformanceError,
    isRegularityPerformanceLoading,
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
    nationalSchemeQuantityPeriodicData,
    nationalSchemeRegularityPeriodicData,
    nationalDashboardBoundariesData,
    outageReasonsData,
    outageReasonsPeriodicData,
    previousAnalyticsRange,
    previousContinuousSchemesData,
    previousRegularityKpiData,
    previousSchemeQuantityPeriodicData,
    previousSchemeRegularityPeriodicData,
    previousWaterQuantityPeriodicData,
    previousWaterSupplyKpiData,
    readingSubmissionRateData,
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
  } = useCentralDashboardQueries({
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
    selectedOutageApiScale: outageDistributionTimeScaleTab,
    selectedQuantityApiScale: quantityTimeScaleTab,
    selectedRegularityApiScale: regularityTimeScaleTab,
    selectedScheme,
    selectedTenant,
    shouldFetchTenantBoundaryGeoJson,
    submissionStatusParentId,
  })
  const expectedOverallPerformanceOptions = isDepartmentTabActive
    ? isDepartmentDivisionSelected
      ? villageApiOptions
      : isDepartmentCircleSelected
        ? gramPanchayatApiOptions
        : isDepartmentZoneSelected
          ? blockApiOptions
          : isDepartmentStateSelected
            ? districtApiOptions
            : emptyOptions
    : isHierarchyFourthLevelSelected
      ? villageApiOptions
      : isHierarchyThirdLevelSelected
        ? gramPanchayatApiOptions
        : isHierarchySecondLevelSelected
          ? blockApiOptions
          : isHierarchyStateSelected
            ? districtApiOptions
            : emptyOptions
  const {
    boundaryOverallPerformanceOptions,
    districtMapChartData,
    districtToStateMap,
    effectiveHoveredOverallPerformanceRow,
    isDistrictMapLoading,
    isMapDataLoading,
    mapChartData,
    overallPerformanceLocationOptions,
    overallPerformanceTableData,
  } = useCentralDashboardMapPerformance({
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
  })
  const {
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
  } = buildCentralDashboardPerformanceData({
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
    tenantBoundaryRegions: tenantBoundaryData?.childRegions,
    waterQuantityPeriodicData,
  })
  const {
    comparisonDays,
    currentRegularityKpi,
    currentWaterSupplyKpis,
    previousRegularityKpi,
    previousWaterSupplyKpis,
  } = useCentralDashboardKpis({
    averagePersonsPerHousehold,
    averageWaterSupplyData,
    currentRegularityKpiData,
    currentWaterSupplyKpiData,
    filteredNationalDashboardData,
    filteredPreviousNationalDashboardData,
    isCentralLandingView,
    isHierarchyLeafSelected,
    nationalDefaultAverageMembersPerHousehold,
    previousAnalyticsRange,
    previousRegularityKpiData,
    previousSchemeQuantityPeriodicData,
    previousSchemeRegularityPeriodicData,
    previousWaterQuantityPeriodicData,
    previousWaterSupplyKpiData,
    schemeRegularityPeriodicData,
    waterQuantityPeriodicData,
  })
  const { handleMapRegionClick, handleOverallPerformanceRowClick, handleStateHover } =
    useCentralDashboardNavigation({
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
    })

  if (
    !dashboardData.kpis ||
    !dashboardData.mapData ||
    !dashboardData.demandSupply ||
    !dashboardData.readingSubmissionStatus ||
    !dashboardData.pumpOperators ||
    !dashboardData.readingCompliance ||
    !dashboardData.waterSupplyOutages ||
    !dashboardData.topPerformers ||
    !dashboardData.worstPerformers ||
    !dashboardData.regularityData ||
    !dashboardData.continuityData
  ) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Box textAlign="center">
          <Heading fontSize="2xl" fontWeight="bold" color="red.600">
            Invalid data structure
          </Heading>
          <Text mt={2} color="gray.600">
            Dashboard data is incomplete
          </Text>
        </Box>
      </Flex>
    )
  }

  const {
    operatorsPerformanceTable,
    pumpOperatorsTotal,
    resolvedDashboardData,
    villagePhotoEvidenceRows,
    waterSupplyOutageDistributionData,
    waterSupplyOutagesData,
  } = buildCentralDashboardResolvedData({
    dashboardData,
    filteredNationalDashboardData,
    isCentralLandingView,
    operatorsPerformanceAnalyticsTable,
    outageReasonsData,
    outageReasonsTimeTrendData,
    pumpOperatorsData,
    readingSubmissionStatusData,
    shouldFetchSchemePerformanceAnalytics,
  })

  const continuousSchemesCount = continuousSchemesData?.continuousSchemeCount ?? 0
  const previousContinuousSchemesCount = previousContinuousSchemesData?.continuousSchemeCount ?? 0
  const criticalSchemesCount = criticalSchemesData?.criticalSchemeCount ?? 0
  const visibleCoreMetrics = buildCentralDashboardKpiMetrics({
    comparisonDays,
    continuousSchemesCount,
    criticalSchemesCount,
    criticalSchemeStatusAfterDays,
    currentRegularityKpi,
    currentWaterSupplyKpis,
    isCentralLandingView,
    numberLocale: i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN',
    previousContinuousSchemesCount,
    previousRegularityKpi,
    previousWaterSupplyKpis,
    t,
  })
  const inSingleTenantMode = isSingleTenantMode()
  const renderProps = buildCentralDashboardRenderProps({
    activeLeafSelection,
    activeTrailIndex: effectiveTrailIndex,
    analyticsParentId,
    blockOptions,
    blockTableData,
    districtMapChartData,
    districtOptions,
    districtTableData,
    durationDateFormat,
    effectiveHoveredOverallPerformanceRow,
    effectiveSelectedState,
    emptyOptions,
    filterTabIndex,
    filteredNationalDashboardBoundary: filteredNationalDashboardBoundaries.nationalBoundary,
    gramPanchayatOptions,
    gramPanchayatTableData,
    handleMapRegionClick,
    handleOverallPerformanceRowClick,
    handleStateHover,
    hierarchyType,
    isActiveSchemesError: isSchemePerformanceError,
    isActiveSchemesLoading: isSchemePerformancePending,
    isAdvancedEnabled,
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
    isOutageDistributionLoading: isOutageDistributionWidgetLoading,
    isOutageReasonsError: isOutageReasonsWidgetError,
    isOutageReasonsLoading: isOutageReasonsWidgetLoading,
    isOverallPerformanceLoading,
    isQuantityPerformanceError,
    isQuantityPerformanceLoading,
    isReadingSubmissionRateError: isReadingSubmissionRateWidgetError,
    isReadingSubmissionRateLoading: isReadingSubmissionRateWidgetLoading,
    isReadingSubmissionStatusError: isSubmissionStatusError,
    isReadingSubmissionStatusLoading: isSubmissionStatusPending,
    isRegularityPerformanceError,
    isRegularityPerformanceLoading,
    isSchemePerformanceError,
    isSchemePerformanceLoading: isSchemePerformancePending,
    isSchemeRegularityPeriodicFetching,
    isSingleTenantMode: inSingleTenantMode,
    isStateSelected,
    isTimeViewEnabled,
    isWaterQuantityPeriodicAwaitingParams,
    isWaterQuantityPeriodicFetching,
    mapChartData,
    onActiveTrailChange: setActiveTrailIndex,
    onBlockChange: handleBlockChange,
    onClear: handleClearFilters,
    onDepartmentCircleChange: handleDepartmentCircleChange,
    onDepartmentDivisionChange: handleDepartmentDivisionChange,
    onDepartmentStateChange: handleDepartmentStateChange,
    onDepartmentSubdivisionChange: handleDepartmentSubdivisionChange,
    onDepartmentVillageChange: handleDepartmentVillageChange,
    onDepartmentZoneChange: handleDepartmentZoneChange,
    onDistrictChange: handleDistrictChange,
    onGramPanchayatChange: handleGramPanchayatChange,
    onOutageDistributionTimeScaleTabChange: setOutageDistributionTimeScaleTab,
    onQuantityTimeScaleTabChange: setQuantityTimeScaleTab,
    onRegularityTimeScaleTabChange: setRegularityTimeScaleTab,
    onSchemePageChange: handleSchemePageChange,
    onStateChange: handleStateChange,
    onTabChange: handleFilterTabChange,
    operatorsPerformanceTable,
    outageDistributionTimeScaleTab,
    overallPerformanceEntityLabel,
    overallPerformanceScrollHeight,
    overallPerformanceTableData,
    performanceSummaryCardMaxHeight,
    performanceSummaryTitle: t('overallPerformance.title', {
      defaultValue: 'Performance Summary',
    }),
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
    selectedBlock,
    selectedDepartmentCircle,
    selectedDepartmentDivision,
    selectedDepartmentState,
    selectedDepartmentSubdivision,
    selectedDepartmentVillage,
    selectedDepartmentZone,
    selectedDistrict,
    selectedDuration: effectiveSelectedDuration,
    selectedGramPanchayat,
    selectedScheme,
    selectedState,
    selectedVillage,
    setHoveredOverallPerformanceRow,
    setIsMapDistrictView,
    setIsMapFullscreen,
    setIsMapRegularityView,
    setSelectedDuration: handleSelectedDurationChange,
    setSelectedScheme,
    setSelectedVillage: handleVillageChange,
    shouldShowMapAlongsidePerformance,
    supplySubmissionRateData,
    supplySubmissionRateLabel,
    tableDateFormat,
    tenantBoundaryParentGeoJson:
      tenantBoundaryGeoJsonData?.parsedParentBoundaryGeoJson ?? undefined,
    tenantCode: selectedTenant?.tenantCode,
    totalSchemePages,
    villageOptions,
    villagePhotoEvidenceRows,
    villagePumpOperatorDetails,
    villageTableData,
    visibleCoreMetrics,
    waterSupplyOutageDistributionData,
    waterSupplyOutagesData,
    derivedVillageSchemeId,
  })

  return <CentralDashboardContent {...renderProps} />
}

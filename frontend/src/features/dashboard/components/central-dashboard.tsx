import { Box, Flex, Text, Heading, useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useLocationHierarchyQuery } from '../services/query/use-location-hierarchy-query'
import { useLocationSearchQuery } from '../services/query/use-location-search-query'
import { DashboardKpiGrid } from './central-dashboard/dashboard-kpi-grid'
import { DashboardMapPerformanceSection } from './central-dashboard/dashboard-map-performance-section'
import { DashboardBody } from './screens/dashboard-body'
import type { SearchableSelectOption } from '@/shared/components/common'
import type {
  DashboardData,
  EntityPerformance,
  StateUtOption,
  VillagePumpOperatorDetails,
} from '../types'
import { DashboardFilters } from './filters/dashboard-filters'
import { buildCentralDashboardKpiMetrics } from '../hooks/use-central-dashboard-kpi-metrics'
import { useCentralDashboardLocationOptions } from '../hooks/use-central-dashboard-location-options'
import { useCentralDashboardMapPerformance } from '../hooks/use-central-dashboard-map-performance'
import { useCentralDashboardTenantConfig } from '../hooks/use-central-dashboard-tenant-config'
import { toCapitalizedWords } from '../utils/format-location-label'
import { sortByMetricDescending, toIsoDate } from '../utils/central-dashboard-helpers'
import { useCentralDashboardFilters } from '../hooks/use-central-dashboard-filters'
import { useCentralDashboardKpis } from '../hooks/use-central-dashboard-kpis'
import { useCentralDashboardQueries } from '../hooks/use-central-dashboard-queries'
import { useCentralDashboardLabels } from '../hooks/use-central-dashboard-labels'
import { useCentralDashboardMapUiState } from '../hooks/use-central-dashboard-map-ui-state'
import { useCentralDashboardNavigation } from '../hooks/use-central-dashboard-navigation'
import { buildCentralDashboardResolvedData } from '../hooks/use-central-dashboard-resolved-data'
import { useCentralDashboardTimeScaleState } from '../hooks/use-central-dashboard-time-scale-state'
import { useSchemePerformancePagination } from '../hooks/use-scheme-performance-pagination'
import { useDashboardDefaultDateRange } from '../utils/default-duration'
import {
  DEFAULT_PERSONS_PER_HOUSEHOLD,
  mapQuantityPerformanceFromNationalDashboard,
  mapReadingSubmissionRateFromNationalDashboard,
  mapReadingSubmissionRateFromAnalytics,
  mapReadingSubmissionStatusFromAnalytics,
  resolveDaysInRange,
  mapRegularityPerformanceFromNationalDashboard,
  mapSchemePerformanceToTable,
  mapSchemePerformanceToPumpOperators,
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
  const tenantBoundaryBlockLookup = (tenantBoundaryData?.childRegions ?? []).reduce(
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

  return (
    <Box>
      <DashboardFilters
        filterTabIndex={filterTabIndex}
        onTabChange={handleFilterTabChange}
        onClear={handleClearFilters}
        isAdvancedEnabled={isAdvancedEnabled}
        isDepartmentStateSelected={isDepartmentStateSelected}
        emptyOptions={emptyOptions}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        selectedBlock={selectedBlock}
        selectedGramPanchayat={selectedGramPanchayat}
        selectedVillage={selectedVillage}
        selectedScheme={selectedScheme}
        selectedDuration={effectiveSelectedDuration}
        durationDateFormat={durationDateFormat}
        selectedDepartmentState={selectedDepartmentState}
        selectedDepartmentZone={selectedDepartmentZone}
        selectedDepartmentCircle={selectedDepartmentCircle}
        selectedDepartmentDivision={selectedDepartmentDivision}
        selectedDepartmentSubdivision={selectedDepartmentSubdivision}
        selectedDepartmentVillage={selectedDepartmentVillage}
        activeTrailIndex={effectiveTrailIndex}
        districtOptions={districtOptions}
        blockOptions={blockOptions}
        gramPanchayatOptions={gramPanchayatOptions}
        villageOptions={villageOptions}
        onStateChange={handleStateChange}
        onDistrictChange={handleDistrictChange}
        onBlockChange={handleBlockChange}
        onGramPanchayatChange={handleGramPanchayatChange}
        setSelectedVillage={handleVillageChange}
        setSelectedScheme={setSelectedScheme}
        setSelectedDuration={handleSelectedDurationChange}
        onDepartmentStateChange={handleDepartmentStateChange}
        onDepartmentZoneChange={handleDepartmentZoneChange}
        onDepartmentCircleChange={handleDepartmentCircleChange}
        onDepartmentDivisionChange={handleDepartmentDivisionChange}
        onDepartmentSubdivisionChange={handleDepartmentSubdivisionChange}
        onDepartmentVillageChange={handleDepartmentVillageChange}
        onActiveTrailChange={setActiveTrailIndex}
        isSingleTenantMode={inSingleTenantMode}
      />

      <DashboardKpiGrid metrics={visibleCoreMetrics} showIcons={isCentralLandingView} />

      <DashboardMapPerformanceSection
        activeLeafSelection={activeLeafSelection}
        shouldShowMapAlongsidePerformance={shouldShowMapAlongsidePerformance}
        isMapFullscreen={isMapFullscreen}
        onMapFullscreenClose={() => setIsMapFullscreen(false)}
        performanceSummaryCardMaxHeight={performanceSummaryCardMaxHeight}
        performanceSummaryTitle={t('overallPerformance.title', {
          defaultValue: 'Performance Summary',
        })}
        overallPerformanceTableData={overallPerformanceTableData}
        isOverallPerformanceLoading={isOverallPerformanceLoading}
        overallPerformanceEntityLabel={overallPerformanceEntityLabel}
        overallPerformanceScrollHeight={overallPerformanceScrollHeight}
        onOverallPerformanceRowClick={handleOverallPerformanceRowClick}
        onOverallPerformanceRowHover={setHoveredOverallPerformanceRow}
        mapProps={{
          data: isMapDistrictView && isCentralLandingView ? districtMapChartData : mapChartData,
          tooltipData: overallPerformanceTableData,
          nationalBoundaryGeoJson: isCentralLandingView
            ? filteredNationalDashboardBoundaries.nationalBoundary
            : undefined,
          parentBoundaryGeoJson: isCentralLandingView
            ? undefined
            : (tenantBoundaryGeoJsonData?.parsedParentBoundaryGeoJson ?? undefined),
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
        }}
      />
      <DashboardBody
        data={resolvedDashboardData}
        performanceScreenKey={
          isStateSelected && !isDistrictSelected && !isBlockSelected && !isGramPanchayatSelected
            ? `state:${effectiveSelectedState}`
            : !isStateSelected &&
                !isDistrictSelected &&
                !isBlockSelected &&
                !isGramPanchayatSelected &&
                !activeLeafSelection
              ? 'central'
              : null
        }
        isStateSelected={isStateSelected}
        isDepartmentStateSelected={isDepartmentStateSelected}
        isDistrictSelected={isDistrictSelected}
        isBlockSelected={isBlockSelected}
        isGramPanchayatSelected={isGramPanchayatSelected}
        isDepartmentZoneSelected={isDepartmentZoneSelected}
        isDepartmentCircleSelected={isDepartmentCircleSelected}
        isDepartmentDivisionSelected={isDepartmentDivisionSelected}
        selectedVillage={activeLeafSelection}
        quantityTimeScaleTab={quantityTimeScaleTab}
        onQuantityTimeScaleTabChange={(value) => setQuantityTimeScaleTab(value)}
        regularityTimeScaleTab={regularityTimeScaleTab}
        onRegularityTimeScaleTabChange={(value) => setRegularityTimeScaleTab(value)}
        outageDistributionTimeScaleTab={outageDistributionTimeScaleTab}
        onOutageDistributionTimeScaleTabChange={(value) => setOutageDistributionTimeScaleTab(value)}
        quantityPerformanceData={quantityPerformanceData}
        isQuantityPerformanceLoading={isQuantityPerformanceLoading}
        isQuantityPerformanceError={isQuantityPerformanceError}
        quantityTimeTrendData={quantityTimeTrendData}
        isQuantityTimeTrendLoading={
          isCentralLandingView
            ? isNationalSchemeQuantityPeriodicFetching
            : isWaterQuantityPeriodicFetching
        }
        isQuantityTimeTrendAwaitingParams={
          isCentralLandingView ? false : isWaterQuantityPeriodicAwaitingParams
        }
        regularityPerformanceData={regularityPerformanceData}
        isRegularityPerformanceLoading={isRegularityPerformanceLoading}
        isRegularityPerformanceError={isRegularityPerformanceError}
        regularityTimeTrendData={regularityTimeTrendData}
        isRegularityTimeTrendLoading={
          isCentralLandingView
            ? isNationalSchemeRegularityPeriodicFetching
            : isSchemeRegularityPeriodicFetching
        }
        districtTableData={districtTableData}
        blockTableData={blockTableData}
        gramPanchayatTableData={gramPanchayatTableData}
        villageTableData={villageTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel={supplySubmissionRateLabel}
        waterSupplyOutagesData={waterSupplyOutagesData}
        waterSupplyOutageDistributionData={waterSupplyOutageDistributionData}
        isOutageReasonsLoading={isOutageReasonsWidgetLoading}
        isOutageDistributionLoading={isOutageDistributionWidgetLoading}
        isOutageReasonsError={isOutageReasonsWidgetError}
        isReadingSubmissionRateLoading={isReadingSubmissionRateWidgetLoading}
        isReadingSubmissionRateError={isReadingSubmissionRateWidgetError}
        isReadingSubmissionStatusLoading={isSubmissionStatusPending}
        isReadingSubmissionStatusError={isSubmissionStatusError}
        isSchemePerformanceLoading={isSchemePerformancePending}
        isSchemePerformanceError={isSchemePerformanceError}
        isActiveSchemesLoading={isSchemePerformancePending}
        isActiveSchemesError={isSchemePerformanceError}
        pumpOperatorsTotal={pumpOperatorsTotal}
        operatorsPerformanceTable={operatorsPerformanceTable}
        villagePhotoEvidenceRows={villagePhotoEvidenceRows}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        tenantCode={selectedTenant?.tenantCode}
        schemeId={derivedVillageSchemeId}
        schemePerformancePage={schemePerformancePage}
        totalSchemePages={totalSchemePages}
        onSchemePageChange={handleSchemePageChange}
        screenDateFormat={screenDateFormat}
        tableDateFormat={tableDateFormat}
        enableExtendedTimeScales
        isTimeViewEnabled={isTimeViewEnabled}
      />
    </Box>
  )
}

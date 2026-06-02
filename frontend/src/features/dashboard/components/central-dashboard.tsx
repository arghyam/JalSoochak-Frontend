import { useEffect, useState } from 'react'
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
  NationalDashboardBoundaryState,
  StateUtOption,
  VillagePumpOperatorDetails,
} from '../types'
import { DashboardFilters } from './filters/dashboard-filters'
import { buildCentralDashboardKpiMetrics } from '../hooks/use-central-dashboard-kpi-metrics'
import { useCentralDashboardLocationOptions } from '../hooks/use-central-dashboard-location-options'
import { useCentralDashboardMapPerformance } from '../hooks/use-central-dashboard-map-performance'
import { useCentralDashboardTenantConfig } from '../hooks/use-central-dashboard-tenant-config'
import { slugify, toCapitalizedWords } from '../utils/format-location-label'
import { toStableLocationValue } from '../utils/stable-location-value'
import {
  type LocationOption,
  type OutageTimeScaleTab,
  type PerformanceTimeScaleTab,
  sortByMetricDescending,
  sortOutageDistributionByTotalDescending,
  toIsoDate,
  toOutageDistributionData,
  toOutageReasonsData,
  toStateSlug,
} from '../utils/central-dashboard-helpers'
import { useCentralDashboardFilters } from '../hooks/use-central-dashboard-filters'
import { useCentralDashboardKpis } from '../hooks/use-central-dashboard-kpis'
import { useCentralDashboardQueries } from '../hooks/use-central-dashboard-queries'
import { localizeDepartmentHierarchyLabel, normalizeHierarchyLabel } from '../utils/hierarchy-label'
import { useDashboardDefaultDateRange } from '../utils/default-duration'
import {
  DEFAULT_PERSONS_PER_HOUSEHOLD,
  mapOutageReasonsFromNationalDashboard,
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
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [isMapRegularityView, setIsMapRegularityView] = useState(true)
  const [isMapDistrictView, setIsMapDistrictView] = useState(false)
  const [hoveredOverallPerformanceRow, setHoveredOverallPerformanceRow] =
    useState<EntityPerformance | null>(null)
  const [schemePerformancePagination, setSchemePerformancePagination] = useState<{
    key: string
    page: number
  }>({
    key: '',
    page: 1,
  })

  useEffect(() => {
    if (!isMapFullscreen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isMapFullscreen])

  useEffect(() => {
    if (!isMapFullscreen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMapFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMapFullscreen])

  const [quantityTimeScaleTab, setQuantityTimeScaleTab] = useState<PerformanceTimeScaleTab>('day')
  const [regularityTimeScaleTab, setRegularityTimeScaleTab] =
    useState<PerformanceTimeScaleTab>('day')
  const [outageDistributionTimeScaleTab, setOutageDistributionTimeScaleTab] =
    useState<OutageTimeScaleTab>('day')
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
  const hierarchyLabelByLevel = (locationHierarchyData?.data?.levels ?? []).reduce<
    Record<number, string>
  >((acc, item) => {
    const levelNumber = typeof item.level === 'number' ? item.level : undefined
    const levelTitleRaw = toCapitalizedWords(item.levelName?.[0]?.title?.trim() ?? '')
    if (!levelNumber || !levelTitleRaw) {
      return acc
    }
    acc[levelNumber] = localizeDepartmentHierarchyLabel(levelTitleRaw, 'singular', i18n, t)
    return acc
  }, {})
  const toPluralHierarchyLabel = (value: string): string => {
    const localized = localizeDepartmentHierarchyLabel(value, 'plural', i18n, t)
    if (localized !== value) {
      return localized
    }
    const normalized = normalizeHierarchyLabel(value)
    if (normalized === 'state') return 'States'
    if (normalized === 'district') return 'Districts'
    if (normalized === 'block') return 'Blocks'
    if (normalized === 'panchayat') return 'Panchayats'
    if (normalized === 'village') return 'Villages'
    if (normalized === 'sub division' || normalized === 'subdivision') return 'Sub Divisions'
    if (value.endsWith('s')) return value
    return `${value}s`
  }
  const departmentOverallPerformanceEntityLabel = isDepartmentDivisionSelected
    ? (hierarchyLabelByLevel[5] ?? 'Sub Division')
    : isDepartmentCircleSelected
      ? (hierarchyLabelByLevel[4] ?? 'Division')
      : isDepartmentZoneSelected
        ? (hierarchyLabelByLevel[3] ?? 'Circle')
        : isDepartmentStateSelected
          ? (hierarchyLabelByLevel[2] ?? 'Zone')
          : t('overallPerformance.entities.stateUt', { defaultValue: 'State/UT' })
  const departmentPerformanceEntityLabel = isDepartmentDivisionSelected
    ? toPluralHierarchyLabel(hierarchyLabelByLevel[5] ?? 'Sub Division')
    : isDepartmentCircleSelected
      ? toPluralHierarchyLabel(hierarchyLabelByLevel[4] ?? 'Division')
      : isDepartmentZoneSelected
        ? toPluralHierarchyLabel(hierarchyLabelByLevel[3] ?? 'Circle')
        : isDepartmentStateSelected
          ? toPluralHierarchyLabel(hierarchyLabelByLevel[2] ?? 'Zone')
          : t('performanceCharts.viewBy.statesUTs', { defaultValue: 'States/UTs' })
  const supplySubmissionRateLabel = isDepartmentTabActive
    ? departmentPerformanceEntityLabel
    : isHierarchyFourthLevelSelected
      ? t('performanceCharts.viewBy.villages', { defaultValue: 'Villages' })
      : isHierarchyThirdLevelSelected
        ? t('performanceCharts.viewBy.gramPanchayats', { defaultValue: 'Gram Panchayats' })
        : isHierarchySecondLevelSelected
          ? t('performanceCharts.viewBy.blocks', { defaultValue: 'Blocks' })
          : isHierarchyStateSelected
            ? t('performanceCharts.viewBy.districts', { defaultValue: 'Districts' })
            : t('performanceCharts.viewBy.statesUTs', { defaultValue: 'States/UTs' })
  const overallPerformanceEntityLabel = isDepartmentTabActive
    ? departmentOverallPerformanceEntityLabel
    : isHierarchyFourthLevelSelected
      ? t('overallPerformance.entities.village', { defaultValue: 'Village' })
      : isHierarchyThirdLevelSelected
        ? t('overallPerformance.entities.gramPanchayat', { defaultValue: 'Gram Panchayat' })
        : isHierarchySecondLevelSelected
          ? t('overallPerformance.entities.block', { defaultValue: 'Block' })
          : isHierarchyStateSelected
            ? t('overallPerformance.entities.district', { defaultValue: 'District' })
            : t('overallPerformance.entities.stateUt', { defaultValue: 'State/UT' })
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
  const schemePerformanceResetKey = `${analyticsParentId}|${analyticsDateRange.startDate}|${analyticsDateRange.endDate}`
  const schemePerformancePage =
    schemePerformancePagination.key === schemePerformanceResetKey
      ? schemePerformancePagination.page
      : 1
  const handleSchemePageChange = (page: number) => {
    setSchemePerformancePagination({
      key: schemePerformanceResetKey,
      page,
    })
  }
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
    isQuantityPerformanceLoading,
    isReadingSubmissionRateWidgetLoading,
    isRegularityPerformanceLoading,
    isSchemePerformancePending,
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

  const handleStateClick = (_stateId: string, stateName: string) => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    setSelectedScheme('')
    const stateOption = locationSearchData?.states.find(
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
    const stateOption = locationSearchData?.states.find(
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
      const locationOption = option as LocationOption
      const optionIds = [locationOption.locationId, locationOption.analyticsId]
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

  const apiWaterSupplyOutageReasonsData = outageReasonsData?.outageReasonSchemeCount
    ? [toOutageReasonsData(outageReasonsData.outageReasonSchemeCount)]
    : null
  const nationalWaterSupplyOutageReasonsData = isCentralLandingView
    ? mapOutageReasonsFromNationalDashboard(filteredNationalDashboardData, [])
    : null
  const apiWaterSupplyOutageDistributionData = outageReasonsData?.childRegions?.length
    ? toOutageDistributionData(outageReasonsData.childRegions)
    : null
  const waterSupplyOutagesData =
    nationalWaterSupplyOutageReasonsData ?? apiWaterSupplyOutageReasonsData ?? []
  const waterSupplyOutageDistributionData = sortOutageDistributionByTotalDescending(
    apiWaterSupplyOutageDistributionData ?? []
  )
  const resolvedSupplyOutageTrend =
    outageReasonsTimeTrendData.length > 0
      ? outageReasonsTimeTrendData
      : dashboardData.supplyOutageTrend
  const resolvedReadingCompliance = dashboardData.readingCompliance
  const resolvedDashboardData =
    readingSubmissionStatusData === dashboardData.readingSubmissionStatus &&
    pumpOperatorsData === dashboardData.pumpOperators &&
    resolvedSupplyOutageTrend === dashboardData.supplyOutageTrend &&
    resolvedReadingCompliance === dashboardData.readingCompliance
      ? dashboardData
      : {
          ...dashboardData,
          readingSubmissionStatus: readingSubmissionStatusData,
          readingCompliance: resolvedReadingCompliance,
          pumpOperators: pumpOperatorsData,
          supplyOutageTrend: resolvedSupplyOutageTrend,
        }

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
  const pumpOperatorsTotal = resolvedDashboardData.pumpOperators.reduce(
    (total, item) => total + item.value,
    0
  )
  const leadingPumpOperators = dashboardData.leadingPumpOperators ?? []
  const bottomPumpOperators = dashboardData.bottomPumpOperators ?? []
  const operatorsPerformanceTable = shouldFetchSchemePerformanceAnalytics
    ? operatorsPerformanceAnalyticsTable
    : [...leadingPumpOperators, ...bottomPumpOperators]
  const villagePhotoEvidenceRows = dashboardData.readingCompliance ?? []
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
        isReadingSubmissionRateLoading={isReadingSubmissionRateWidgetLoading}
        isReadingSubmissionStatusLoading={isSubmissionStatusPending}
        isSchemePerformanceLoading={isSchemePerformancePending}
        isActiveSchemesLoading={isSchemePerformancePending}
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

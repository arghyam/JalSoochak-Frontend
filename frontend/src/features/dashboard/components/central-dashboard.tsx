import { useEffect, useState } from 'react'
import { Box, Flex, Text, Heading, useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useQueries } from '@tanstack/react-query'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { dashboardApi } from '../services/api/dashboard-api'
import { useLocationChildrenQuery } from '../services/query/use-location-children-query'
import { useLocationHierarchyQuery } from '../services/query/use-location-hierarchy-query'
import { useLocationSearchQuery } from '../services/query/use-location-search-query'
import { useTenantPublicConfigQuery } from '../services/query/use-tenant-public-config-query'
import { dashboardQueryKeys } from '../services/query/dashboard-query-keys'
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
import { slugify, toCapitalizedWords } from '../utils/format-location-label'
import { parseStableLocationValue, toStableLocationValue } from '../utils/stable-location-value'
import {
  type LocationOption,
  type OutageTimeScaleTab,
  type PerformanceTimeScaleTab,
  findLocationOption,
  getDefaultAnalyticsDateRange,
  getStateLgdCode,
  mapLocationOptions,
  mapNationalBoundariesToPerformance,
  parseLocationId,
  resolveLgdAnalyticsParentId,
  resolvePositiveNumber,
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
import {
  calculateAverageRegularityPercent,
  DEFAULT_PERSONS_PER_HOUSEHOLD,
  mapOutageReasonsFromNationalDashboard,
  mapOverallPerformanceFromNationalDashboard,
  mapTenantBoundariesToPerformance,
  mapQuantityPerformanceFromNationalDashboard,
  mapReadingSubmissionRateFromNationalDashboard,
  mapReadingSubmissionRateFromAnalytics,
  mapReadingSubmissionStatusFromAnalytics,
  mapRegularityPerformanceFromNationalDashboard,
  mapSchemePerformanceToTable,
  mapSchemePerformanceToPumpOperators,
  mapOverallPerformanceFromAnalytics,
  mapQuantityPerformanceFromAnalytics,
  mapRegularityPerformanceFromAnalytics,
  resolveDaysInRange,
} from '../utils/formulas'
import {
  mapNationalQuantityTrendPoints,
  mapNationalRegularityTrendPoints,
  mapOutageReasonsPeriodicToTrendPoints,
  mapSchemeRegularityPeriodicToTrendPoints,
  mapWaterQuantityPeriodicToTrendPoints,
} from '../utils/quantity-periodic'
import { DEFAULT_SCREEN_DATE_FORMAT, normalizeDateFormat } from '@/shared/utils/date-format'
import { isSingleTenantMode } from '@/config/server-config'
import { getRuntimeConfig } from '@/config/runtime-config'

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
  const selectedTenant = (() => {
    // In single-tenant mode, use the pre-selected tenant directly
    if (singleTenantOverride) {
      if (typeof singleTenantOverride.tenantId !== 'number' || singleTenantOverride.tenantId <= 0) {
        return undefined
      }
      return singleTenantOverride
    }

    const byStateSlug = locationSearchStates.find((option) => option.value === selectedState)
    if (byStateSlug) {
      return byStateSlug
    }

    if (isDepartmentTabActive && locationSearchStates.length > 0) {
      if (locationSearchStates.length === 1) {
        return locationSearchStates[0]
      }

      const departmentKey = parseStableLocationValue(effectiveSelectedDepartmentState).lastSegment
      if (departmentKey) {
        return (
          locationSearchStates.find(
            (option) => option.value === departmentKey || slugify(option.label) === departmentKey
          ) ?? locationSearchStates[0]
        )
      }
    }

    return undefined
  })()
  const {
    data: tenantPublicConfig,
    isLoading: isTenantPublicConfigLoading,
    isFetching: isTenantPublicConfigFetching,
  } = useTenantPublicConfigQuery({
    tenantId: selectedTenant?.tenantId,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const runtimeConfig = getRuntimeConfig()
  const defaultAverageMembersPerHousehold = resolvePositiveNumber(
    runtimeConfig.DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD,
    5
  )
  const defaultWaterNormLitersPerPersonPerDay = resolvePositiveNumber(
    runtimeConfig.DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY,
    55
  )
  const criticalSchemeStatusAfterDays = Math.round(
    resolvePositiveNumber(runtimeConfig.ANALYTICS_SCHEME_STATUS_CRITICAL_AFTER_DAYS, 5)
  )
  const nationalDefaultAverageMembersPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
  const nationalDefaultWaterNormLitersPerPersonPerDay = defaultWaterNormLitersPerPersonPerDay
  const averagePersonsPerHousehold = resolvePositiveNumber(
    tenantPublicConfig?.averageMembersPerHousehold,
    defaultAverageMembersPerHousehold
  )
  const litersPerPersonPerDay = resolvePositiveNumber(
    tenantPublicConfig?.waterNorm,
    defaultWaterNormLitersPerPersonPerDay
  )
  const screenDateFormat = normalizeDateFormat(
    tenantPublicConfig?.dateFormatScreen?.dateFormat ?? DEFAULT_SCREEN_DATE_FORMAT
  )
  const durationDateFormat = DASHBOARD_DURATION_DATE_FORMAT
  const tableDateFormat = normalizeDateFormat(
    tenantPublicConfig?.dateFormatTable?.dateFormat ?? DEFAULT_SCREEN_DATE_FORMAT
  )
  const hasResolvedTenantPublicConfig =
    !selectedTenant?.tenantId || (!isTenantPublicConfigLoading && !isTenantPublicConfigFetching)
  const shouldShowDepartmentMaps = tenantPublicConfig?.displayDepartmentMaps !== false
  const lgdMapLevelVisibility = tenantPublicConfig?.displayMapLgdLevels ?? [
    true,
    true,
    true,
    true,
    true,
    true,
  ]
  const currentLgdMapLevel = isVillageSelected
    ? 5
    : isGramPanchayatSelected
      ? 4
      : isBlockSelected
        ? 3
        : isDistrictSelected
          ? 2
          : 1
  const isLgdMapEnabledForCurrentLevel = lgdMapLevelVisibility[currentLgdMapLevel - 1] !== false
  const departmentMapLevelVisibility = tenantPublicConfig?.displayDepartmentMapLevels ?? [
    true,
    true,
    true,
    true,
    true,
    true,
  ]
  const currentDepartmentMapLevel = isDepartmentDivisionSelected
    ? 4
    : isDepartmentCircleSelected
      ? 3
      : isDepartmentZoneSelected
        ? 2
        : 1
  const isDepartmentMapEnabledForCurrentLevel =
    departmentMapLevelVisibility[currentDepartmentMapLevel - 1] !== false
  const shouldShowMapAlongsidePerformance = isDepartmentTabActive
    ? shouldShowDepartmentMaps && isDepartmentMapEnabledForCurrentLevel
    : isLgdMapEnabledForCurrentLevel
  const shouldFetchTenantBoundaryGeoJson =
    hasResolvedTenantPublicConfig && shouldShowMapAlongsidePerformance
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
  const { data: rootLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const rootLocationOptions = mapLocationOptions(rootLocationsData?.data)
  const selectedRootOption = findLocationOption(rootLocationOptions, activeHierarchySelectedState)
  const selectedStateLgdCode = getStateLgdCode(selectedTenant?.label, selectedTenant?.tenantCode)
  const selectedRootAnalyticsId =
    selectedRootOption === undefined
      ? activeHierarchySelectedState && rootLocationOptions.length > 0
        ? selectedStateLgdCode
        : undefined
      : (selectedRootOption.locationId ?? selectedStateLgdCode ?? selectedRootOption.analyticsId)
  const isRootStateLevel = Boolean(activeHierarchySelectedState) && Boolean(selectedRootOption)
  const districtParentId =
    isRootStateLevel && isDepartmentTabActive
      ? (parseLocationId(activeHierarchySelectedState) ?? selectedRootOption?.locationId)
      : isRootStateLevel
        ? selectedRootOption?.locationId
        : undefined
  const { data: districtLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: districtParentId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && districtParentId),
  })
  const districtApiOptions = isRootStateLevel
    ? mapLocationOptions(districtLocationsData?.data)
    : rootLocationOptions
  const selectedDistrictOption = findLocationOption(
    districtApiOptions,
    activeHierarchySelectedDistrict
  )
  const selectedDistrictId =
    parseLocationId(activeHierarchySelectedDistrict) ?? selectedDistrictOption?.locationId
  const { data: blockLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedDistrictId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedDistrictId),
  })
  const blockApiOptions = mapLocationOptions(blockLocationsData?.data)
  const selectedBlockOption = findLocationOption(blockApiOptions, activeHierarchySelectedBlock)
  const selectedBlockId =
    parseLocationId(activeHierarchySelectedBlock) ?? selectedBlockOption?.locationId
  const { data: gramPanchayatLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedBlockId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedBlockId),
  })
  const gramPanchayatApiOptions = mapLocationOptions(gramPanchayatLocationsData?.data)
  const selectedGramPanchayatOption = findLocationOption(
    gramPanchayatApiOptions,
    activeHierarchySelectedGramPanchayat
  )
  const selectedGramPanchayatId =
    parseLocationId(activeHierarchySelectedGramPanchayat) ?? selectedGramPanchayatOption?.locationId
  const { data: villageLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedGramPanchayatId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedGramPanchayatId),
  })
  const villageApiOptions = mapLocationOptions(villageLocationsData?.data)
  const lgdAnalyticsParentId = resolveLgdAnalyticsParentId({
    selectedVillage: effectiveSelectedVillage,
    selectedGramPanchayat: effectiveSelectedGramPanchayat,
    selectedBlock: effectiveSelectedBlock,
    selectedDistrict: effectiveSelectedDistrict,
    villageOptions: villageApiOptions,
    gramPanchayatOptions: gramPanchayatApiOptions,
    blockOptions: blockApiOptions,
    districtOptions: districtApiOptions,
    rootAnalyticsId: selectedRootAnalyticsId,
  })
  const departmentAnalyticsParentId =
    parseLocationId(selectedDepartmentVillage) ??
    parseLocationId(selectedDepartmentSubdivision) ??
    parseLocationId(selectedDepartmentDivision) ??
    parseLocationId(selectedDepartmentCircle) ??
    parseLocationId(selectedDepartmentZone) ??
    parseLocationId(effectiveSelectedDepartmentState) ??
    (isDepartmentTabActive ? selectedRootOption?.locationId : undefined) ??
    0
  const analyticsParentId =
    hierarchyType === 'LGD' ? lgdAnalyticsParentId : departmentAnalyticsParentId
  const hasValidAnalyticsParentId = analyticsParentId > 0
  const hasValidDepartmentAnalyticsParentId = departmentAnalyticsParentId > 0
  const tenantBoundaryLocationOptions = isDepartmentTabActive
    ? isDepartmentDivisionSelected
      ? villageApiOptions
      : isDepartmentCircleSelected
        ? gramPanchayatApiOptions
        : isDepartmentZoneSelected
          ? blockApiOptions
          : isDepartmentStateSelected
            ? districtApiOptions
            : emptyOptions
    : emptyOptions
  const submissionStatusParentId =
    hierarchyType === 'LGD' ? lgdAnalyticsParentId : departmentAnalyticsParentId
  const hasValidSubmissionStatusParentId =
    hierarchyType === 'LGD' ? hasValidAnalyticsParentId : hasValidDepartmentAnalyticsParentId
  const defaultAnalyticsRange = getDefaultAnalyticsDateRange()
  const analyticsDateRange = {
    startDate:
      toIsoDate(effectiveSelectedDuration?.startDate, durationDateFormat) ??
      defaultAnalyticsRange.startDate,
    endDate:
      toIsoDate(effectiveSelectedDuration?.endDate, durationDateFormat) ??
      defaultAnalyticsRange.endDate,
  }
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
    previousCriticalSchemesData,
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
  const boundaryOverallPerformanceOptions: LocationOption[] = (
    tenantBoundaryData?.childRegions ?? []
  ).flatMap((region) => {
    const boundaryId = [region.childLgdId, region.childDepartmentId].find(
      (id) => typeof id === 'number' && id > 0
    )
    const rawTitle = region.childLgdTitle ?? region.childDepartmentTitle ?? ''
    const normalizedTitle = rawTitle.trim()
    const matchedExpectedOption = expectedOverallPerformanceOptions.find((option) => {
      const typedOption = option as LocationOption
      const optionIds = [typedOption.locationId, typedOption.analyticsId]
      const hasMatchingId =
        typeof boundaryId === 'number' &&
        optionIds.some((id) => typeof id === 'number' && id === boundaryId)

      return hasMatchingId || slugify(typedOption.label) === slugify(normalizedTitle)
    })
    const matchedExpectedAnalyticsId = (matchedExpectedOption as LocationOption | undefined)
      ?.analyticsId

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
        const locationOption = option as LocationOption
        const optionIds = [locationOption.locationId, locationOption.analyticsId]
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
    if (state.tenantId > 0 && state.schemeCount > 0 && state.totalSupplyDays > 0) {
      acc.set(
        state.tenantId,
        calculateAverageRegularityPercent(
          state.totalSupplyDays,
          state.schemeCount,
          nationalDaysInRange
        )
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

  // District view: one query per state, lazy-loaded only when user activates district view
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

  const districtToStateMap = new Map<string, NationalDashboardBoundaryState>()
  districtBoundaryQueries.forEach((query, index) => {
    if (!query.data) return
    const state = stateWiseBoundaries[index]
    ;(query.data.childRegions ?? []).forEach((district) => {
      const id = String(district.lgdId ?? district.lgdCode ?? '')
      if (id) districtToStateMap.set(id, state)
    })
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
  const previousCriticalSchemesCount = previousCriticalSchemesData?.criticalSchemeCount ?? 0
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
    previousCriticalSchemesCount,
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
      />
    </Box>
  )
}

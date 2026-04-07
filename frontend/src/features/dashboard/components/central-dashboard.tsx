import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Flex, Text, Heading, Grid, Icon, Image, useBreakpointValue } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useLocationChildrenQuery } from '../services/query/use-location-children-query'
import { useDistrictSchemeBlockLookupQuery } from '../services/query/use-district-scheme-block-lookup-query'
import { useBlockSchemePanchayatLookupQuery } from '../services/query/use-block-scheme-panchayat-lookup-query'
import { useLocationHierarchyQuery } from '../services/query/use-location-hierarchy-query'
import { useLocationSearchQuery } from '../services/query/use-location-search-query'
import { useAverageWaterSupplyPerRegionQuery } from '../services/query/use-average-water-supply-per-region-query'
import { useAverageSchemeRegularityQuery } from '../services/query/use-average-scheme-regularity-query'
import { useNationalDashboardQuery } from '../services/query/use-national-dashboard-query'
import { useNationalSchemeRegularityPeriodicQuery } from '../services/query/use-national-scheme-regularity-periodic-query'
import { useOutageReasonsPeriodicQuery } from '../services/query/use-outage-reasons-periodic-query'
import { useOutageReasonsQuery } from '../services/query/use-outage-reasons-query'
import { useReadingSubmissionRateQuery } from '../services/query/use-reading-submission-rate-query'
import { useSchemeRegularityPeriodicQuery } from '../services/query/use-scheme-regularity-periodic-query'
import { useSchemePerformanceQuery } from '../services/query/use-scheme-performance-query'
import { useSubmissionStatusQuery } from '../services/query/use-submission-status-query'
import { useTenantPublicConfigQuery } from '../services/query/use-tenant-public-config-query'
import { useWaterQuantityPeriodicQuery } from '../services/query/use-water-quantity-periodic-query'
import { useTenantBoundariesQuery } from '../services/query/use-tenant-boundaries-query'
import { KPICard } from './kpi-card'
import { DashboardBody } from './screens/dashboard-body'
import { IndiaMapChart } from './charts'
import { MdOutlineWaterDrop } from 'react-icons/md'
import waterTapIcon from '@/assets/media/water-tap_1822589 1.svg'
import wallClockIcon from '@/assets/media/wall-clock.svg'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import type {
  DashboardData,
  EntityPerformance,
  NationalDashboardResponse,
  VillagePumpOperatorDetails,
} from '../types'
import { DashboardFilters } from './filters/dashboard-filters'
import { OverallPerformanceTable } from './tables'
import { ROUTES } from '@/shared/constants/routes'
import { computeTrailIndices } from '../utils/trail-index'
import { slugify, toCapitalizedWords } from '../utils/format-location-label'
import { parseStableLocationValue, toStableLocationValue } from '../utils/stable-location-value'
import { localizeDepartmentHierarchyLabel, normalizeHierarchyLabel } from '../utils/hierarchy-label'
import {
  calculateAbsoluteChange,
  calculatePercentChange,
  getPreviousPeriodRange,
  getRegularityKpi,
  getRegularityKpiFromPeriodic,
  getRegularityKpiFromNationalDashboard,
  hasWaterSupplyData,
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
  getWaterSupplyKpis,
  getWaterSupplyKpisFromPeriodic,
  getWaterSupplyKpisFromNationalDashboard,
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
  resolveWaterQuantityPeriodicScale,
} from '../utils/quantity-periodic'
import type { HierarchyType, TenantChildLocation } from '../services/api/dashboard-api'
import {
  DEFAULT_SCREEN_DATE_FORMAT,
  normalizeDateFormat,
  parseDisplayDateToIsoWithFallback,
} from '@/shared/utils/date-format'
import { INDIA_STATES } from '@/shared/constants/states'

const storageKey = 'central-dashboard-filters'

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

type StoredFilters = {
  selectedDuration?: DateRange
  selectedScheme?: string
  selectedDepartmentState?: string
  selectedDepartmentZone?: string
  selectedDepartmentCircle?: string
  selectedDepartmentDivision?: string
  selectedDepartmentSubdivision?: string
  selectedDepartmentVillage?: string
  filterTabIndex?: number
}

type FilterUrlUpdate = {
  state?: string
  district?: string
  block?: string
  gramPanchayat?: string
  village?: string
  departmentZone?: string
  departmentCircle?: string
  departmentDivision?: string
  departmentSubdivision?: string
  departmentVillage?: string
  tab?: 'administrative'
}

type LocationOption = SearchableSelectOption & {
  locationId?: number
  analyticsId?: number
}

const parseLocationId = (value: string): number | undefined => {
  if (!value) {
    return undefined
  }

  const idPrefix = parseStableLocationValue(value).locationIdSegment ?? value
  const parsedId = Number.parseInt(idPrefix, 10)
  return Number.isFinite(parsedId) ? parsedId : undefined
}

const lookupAnalyticsIdForLocation = (
  options: LocationOption[],
  value: string
): number | undefined => {
  const matchedOption = findLocationOption(options, value)
  return typeof matchedOption?.analyticsId === 'number' ? matchedOption.analyticsId : undefined
}

const parseAnalyticsLocationId = (
  value: string,
  options: LocationOption[] = []
): number | undefined => {
  if (!value) {
    return undefined
  }

  const { secondarySegment: analyticsIdSegment } = parseStableLocationValue(value)
  if (analyticsIdSegment) {
    const parsedAnalyticsId = Number.parseInt(analyticsIdSegment, 10)
    if (Number.isFinite(parsedAnalyticsId)) {
      return parsedAnalyticsId
    }
  }

  const resolvedAnalyticsId = lookupAnalyticsIdForLocation(options, value)
  if (typeof resolvedAnalyticsId === 'number') {
    return resolvedAnalyticsId
  }

  return parseLocationId(value)
}

const toIsoDate = (date?: string | Date | null, dateFormat?: string): string | undefined => {
  if (typeof date === 'string') {
    const trimmedDate = date.trim()
    if (!trimmedDate) {
      return undefined
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      return trimmedDate
    }

    return parseDisplayDateToIsoWithFallback(trimmedDate, dateFormat) || undefined
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return undefined
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getDefaultAnalyticsDateRange = () => {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 29)

  return {
    startDate: toIsoDate(startDate) ?? '',
    endDate: toIsoDate(endDate) ?? '',
  }
}

const getStateLgdCode = (stateName?: string, stateCode?: string): number | undefined => {
  const normalizedStateName = stateName?.trim().toLowerCase()
  const normalizedStateCode = stateCode?.trim().toUpperCase()
  const matchedState = INDIA_STATES.find((state) => {
    if (normalizedStateCode && state.code === normalizedStateCode) {
      return true
    }

    return normalizedStateName ? slugify(state.name) === slugify(normalizedStateName) : false
  })

  return matchedState?.lgdCode
}

const getStoredFilters = (): StoredFilters => {
  if (typeof window === 'undefined') return {}
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return {}
    const parsed = JSON.parse(saved) as StoredFilters
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Ignore storage errors (quota/private mode)
    }
    return {}
  }
}

const parseStoredDateValue = (value: unknown, dateFormat?: string) => {
  const isoDate = toIsoDate(typeof value === 'string' ? value : undefined, dateFormat)
  if (!isoDate) {
    return null
  }

  const date = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const getInitialStoredDuration = (
  storedFilters: StoredFilters,
  dateFormat?: string
): DateRange | null => {
  const storedDuration = storedFilters.selectedDuration
  if (
    !storedDuration ||
    typeof storedDuration !== 'object' ||
    !('startDate' in storedDuration) ||
    !('endDate' in storedDuration)
  ) {
    return null
  }

  const startDate = parseStoredDateValue(storedDuration.startDate, dateFormat)
  const endDate = parseStoredDateValue(storedDuration.endDate, dateFormat)
  if (!startDate || !endDate || startDate > endDate) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (endDate > today) {
    return null
  }

  return storedDuration
}

const toStateSlug = (stateName: string) =>
  stateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const findLocationOption = (
  options: LocationOption[],
  selectedValue: string
): LocationOption | undefined => {
  if (!selectedValue) {
    return undefined
  }

  const selectedId = parseLocationId(selectedValue)
  if (typeof selectedId === 'number') {
    return options.find((option) => option.locationId === selectedId)
  }

  return options.find(
    (option) => option.value === selectedValue || slugify(option.label) === selectedValue
  )
}

const mapLocationOptions = (locations: TenantChildLocation[] | undefined): LocationOption[] => {
  if (!locations?.length) {
    return []
  }

  return locations
    .filter((location) => typeof location.id === 'number' && Boolean(location.title?.trim()))
    .map((location) => {
      const locationId = location.id as number
      const analyticsId =
        typeof location.lgdCode === 'number' && Number.isFinite(location.lgdCode)
          ? location.lgdCode
          : locationId
      const normalizedTitle = toCapitalizedWords(location.title?.trim() ?? '')
      return {
        value: toStableLocationValue(locationId, analyticsId, slugify(normalizedTitle)),
        label: normalizedTitle,
        locationId,
        analyticsId,
      }
    })
}

const getOutageReasonCount = (distribution: Record<string, number>, keys: string[]) =>
  keys.reduce((total, key) => {
    const value = distribution[key]
    return total + (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  }, 0)

const toOutageReasonsData = (distribution: Record<string, number>) => ({
  label: 'Outages',
  reasons: distribution,
  electricityFailure: getOutageReasonCount(distribution, [
    'electrical_failure',
    'electricity_failure',
    'electricalFailure',
    'electricityFailure',
    'power_failure',
    'powerFailure',
  ]),
  pipelineLeak: getOutageReasonCount(distribution, [
    'pipeline_break',
    'pipelineBreak',
    'pipeline_leak',
    'pipelineLeak',
    'pipe_break',
    'pipeBreak',
  ]),
  pumpFailure: getOutageReasonCount(distribution, ['pump_failure', 'pumpFailure']),
  valveIssue: getOutageReasonCount(distribution, ['valve_issue', 'valveIssue']),
  sourceDrying: getOutageReasonCount(distribution, [
    'source_drying',
    'sourceDrying',
    'source_dry',
    'sourceDry',
  ]),
})

const toOutageDistributionData = (
  childRegions: Array<{ title: string; outageReasonSchemeCount: Record<string, number> }>
) =>
  childRegions.map((region) => ({
    ...toOutageReasonsData(region.outageReasonSchemeCount),
    label: toCapitalizedWords(region.title),
  }))

const formulaTooltipTextStyle = {
  fontSize: '12px',
  lineHeight: '18px',
} as const

const renderFormulaTooltip = (formula: ReactNode, definitions: ReactNode[]) => (
  <Box w="296px" minH="80px">
    <Text sx={formulaTooltipTextStyle} mb="8px">
      {formula}
    </Text>
    {definitions.map((definition, index) => (
      <Text key={index} sx={formulaTooltipTextStyle}>
        {definition}
      </Text>
    ))}
  </Box>
)

const filterNationalDashboardByTenantIds = (
  response: NationalDashboardResponse | undefined,
  activeTenantIds: Set<number>
): NationalDashboardResponse | undefined => {
  if (!response || activeTenantIds.size === 0) {
    return response
  }

  const stateWiseQuantityPerformance = response.stateWiseQuantityPerformance.filter((state) =>
    activeTenantIds.has(state.tenantId)
  )
  const stateWiseRegularity = response.stateWiseRegularity.filter((state) =>
    activeTenantIds.has(state.tenantId)
  )
  const stateWiseReadingSubmissionRate = response.stateWiseReadingSubmissionRate.filter((state) =>
    activeTenantIds.has(state.tenantId)
  )
  const hasFilteredInactiveTenants =
    stateWiseQuantityPerformance.length !== response.stateWiseQuantityPerformance.length ||
    stateWiseRegularity.length !== response.stateWiseRegularity.length ||
    stateWiseReadingSubmissionRate.length !== response.stateWiseReadingSubmissionRate.length

  return {
    ...response,
    stateWiseQuantityPerformance,
    stateWiseRegularity,
    stateWiseReadingSubmissionRate,
    // The national payload does not include tenant-scoped outage breakdowns, so once
    // tenant filtering excludes any rows the aggregate can no longer be trusted.
    overallOutageReasonDistribution: hasFilteredInactiveTenants
      ? {}
      : response.overallOutageReasonDistribution,
  }
}

export function CentralDashboard() {
  const { t, i18n } = useTranslation('dashboard')
  const overallPerformanceScrollHeight =
    useBreakpointValue({ base: '320px', sm: '420px', lg: '620px' }) ?? '620px'
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data } = useDashboardData('central')
  const [storedFilters] = useState(() => getStoredFilters())
  const selectedState = stateSlug
  const selectedDistrict = selectedState ? (searchParams.get('district') ?? '') : ''
  const selectedBlock = selectedDistrict ? (searchParams.get('block') ?? '') : ''
  const selectedGramPanchayat = selectedBlock ? (searchParams.get('gramPanchayat') ?? '') : ''
  const selectedVillage = selectedGramPanchayat ? (searchParams.get('village') ?? '') : ''
  const selectedDepartmentZoneFromUrl = searchParams.get('departmentZone') ?? ''
  const selectedDepartmentCircleFromUrl = searchParams.get('departmentCircle') ?? ''
  const selectedDepartmentDivisionFromUrl = searchParams.get('departmentDivision') ?? ''
  const selectedDepartmentSubdivisionFromUrl = searchParams.get('departmentSubdivision') ?? ''
  const selectedDepartmentVillageFromUrl = searchParams.get('departmentVillage') ?? ''
  const hasDepartmentParamsInUrl = Boolean(
    selectedDepartmentZoneFromUrl ||
    selectedDepartmentCircleFromUrl ||
    selectedDepartmentDivisionFromUrl ||
    selectedDepartmentSubdivisionFromUrl ||
    selectedDepartmentVillageFromUrl
  )
  const [selectedDuration, setSelectedDuration] = useState<DateRange | null>(() =>
    getInitialStoredDuration(storedFilters)
  )
  const [isDurationCleared, setIsDurationCleared] = useState(false)
  const [selectedScheme, setSelectedScheme] = useState(storedFilters.selectedScheme ?? '')
  const [storedSelectedDepartmentState, setSelectedDepartmentState] = useState(
    storedFilters.selectedDepartmentState ?? ''
  )
  const [storedSelectedDepartmentZone, setSelectedDepartmentZone] = useState(
    selectedDepartmentZoneFromUrl || storedFilters.selectedDepartmentZone || ''
  )
  const [storedSelectedDepartmentCircle, setSelectedDepartmentCircle] = useState(
    selectedDepartmentCircleFromUrl || storedFilters.selectedDepartmentCircle || ''
  )
  const [storedSelectedDepartmentDivision, setSelectedDepartmentDivision] = useState(
    selectedDepartmentDivisionFromUrl || storedFilters.selectedDepartmentDivision || ''
  )
  const [storedSelectedDepartmentSubdivision, setSelectedDepartmentSubdivision] = useState(
    selectedDepartmentSubdivisionFromUrl || storedFilters.selectedDepartmentSubdivision || ''
  )
  const [storedSelectedDepartmentVillage, setSelectedDepartmentVillage] = useState(
    selectedDepartmentVillageFromUrl || storedFilters.selectedDepartmentVillage || ''
  )
  const [storedFilterTabIndex, setFilterTabIndex] = useState(
    hasDepartmentParamsInUrl
      ? 1
      : typeof storedFilters.filterTabIndex === 'number'
        ? storedFilters.filterTabIndex
        : 0
  )
  const selectedDepartmentState = hasDepartmentParamsInUrl
    ? selectedState
    : storedSelectedDepartmentState
  const selectedDepartmentZone = hasDepartmentParamsInUrl
    ? selectedDepartmentZoneFromUrl
    : storedSelectedDepartmentZone
  const selectedDepartmentCircle = hasDepartmentParamsInUrl
    ? selectedDepartmentCircleFromUrl
    : storedSelectedDepartmentCircle
  const selectedDepartmentDivision = hasDepartmentParamsInUrl
    ? selectedDepartmentDivisionFromUrl
    : storedSelectedDepartmentDivision
  const selectedDepartmentSubdivision = hasDepartmentParamsInUrl
    ? selectedDepartmentSubdivisionFromUrl
    : storedSelectedDepartmentSubdivision
  const selectedDepartmentVillage = hasDepartmentParamsInUrl
    ? selectedDepartmentVillageFromUrl
    : storedSelectedDepartmentVillage
  const filterTabIndex = hasDepartmentParamsInUrl ? 1 : storedFilterTabIndex
  const [activeTrailIndex, setActiveTrailIndex] = useState<number | null>(null)
  const selectionTrailValues = [
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedGramPanchayat,
    selectedVillage,
  ]
  const { effectiveTrailIndex } = computeTrailIndices(selectionTrailValues, activeTrailIndex)
  const effectiveSelectedState = effectiveTrailIndex >= 0 ? selectedState : ''
  const effectiveSelectedDistrict = effectiveTrailIndex >= 1 ? selectedDistrict : ''
  const effectiveSelectedBlock = effectiveTrailIndex >= 2 ? selectedBlock : ''
  const effectiveSelectedGramPanchayat = effectiveTrailIndex >= 3 ? selectedGramPanchayat : ''
  const effectiveSelectedVillage = effectiveTrailIndex >= 4 ? selectedVillage : ''
  const isLgdTabActive = filterTabIndex === 0
  const isStateSelected = isLgdTabActive && Boolean(effectiveSelectedState)
  const isDistrictSelected = isLgdTabActive && Boolean(effectiveSelectedDistrict)
  const isBlockSelected = isLgdTabActive && Boolean(effectiveSelectedBlock)
  const isGramPanchayatSelected = isLgdTabActive && Boolean(effectiveSelectedGramPanchayat)
  const isVillageSelected = isLgdTabActive && Boolean(effectiveSelectedVillage)
  const isDepartmentTabActive = !isLgdTabActive
  const effectiveSelectedDepartmentState =
    isDepartmentTabActive && !selectedDepartmentState ? selectedState : selectedDepartmentState
  const isDepartmentStateSelected =
    isDepartmentTabActive && Boolean(effectiveSelectedDepartmentState)
  const isDepartmentZoneSelected = isDepartmentTabActive && Boolean(selectedDepartmentZone)
  const isDepartmentCircleSelected = isDepartmentTabActive && Boolean(selectedDepartmentCircle)
  const isDepartmentDivisionSelected = isDepartmentTabActive && Boolean(selectedDepartmentDivision)
  const isDepartmentSubdivisionSelected =
    isDepartmentTabActive && Boolean(selectedDepartmentSubdivision)
  const isDepartmentVillageSelected = isDepartmentTabActive && Boolean(selectedDepartmentVillage)
  const isHierarchyStateSelected = isLgdTabActive ? isStateSelected : isDepartmentStateSelected
  const isHierarchySecondLevelSelected = isLgdTabActive
    ? isDistrictSelected
    : isDepartmentZoneSelected
  const isHierarchyThirdLevelSelected = isLgdTabActive
    ? isBlockSelected
    : isDepartmentCircleSelected
  const isHierarchyFourthLevelSelected = isLgdTabActive
    ? isGramPanchayatSelected
    : isDepartmentDivisionSelected
  const isHierarchyLeafSelected = isLgdTabActive
    ? isVillageSelected
    : isDepartmentSubdivisionSelected || isDepartmentVillageSelected
  const activeLeafSelection = isLgdTabActive
    ? effectiveSelectedVillage
    : selectedDepartmentVillage || selectedDepartmentSubdivision
  const hasLgdLandingFilters =
    isStateSelected ||
    isDistrictSelected ||
    isBlockSelected ||
    isGramPanchayatSelected ||
    isVillageSelected
  const hasDepartmentLandingFilters =
    Boolean(effectiveSelectedDepartmentState) ||
    Boolean(selectedDepartmentZone) ||
    Boolean(selectedDepartmentCircle) ||
    Boolean(selectedDepartmentDivision) ||
    Boolean(selectedDepartmentSubdivision) ||
    Boolean(selectedDepartmentVillage)
  const hasCentralLandingFilters =
    filterTabIndex === 0 ? hasLgdLandingFilters : hasDepartmentLandingFilters
  const dashboardData = data ?? EMPTY_DASHBOARD_DATA
  const hierarchyType: HierarchyType = filterTabIndex === 0 ? 'LGD' : 'DEPARTMENT'
  const activeHierarchySelectedState = isDepartmentTabActive
    ? effectiveSelectedDepartmentState
    : selectedState
  const activeHierarchySelectedDistrict = isDepartmentTabActive
    ? selectedDepartmentZone
    : selectedDistrict
  const activeHierarchySelectedBlock = isDepartmentTabActive
    ? selectedDepartmentCircle
    : selectedBlock
  const activeHierarchySelectedGramPanchayat = isDepartmentTabActive
    ? selectedDepartmentDivision
    : selectedGramPanchayat
  const emptyOptions: SearchableSelectOption[] = []
  const isAdvancedEnabled = Boolean(selectedState && selectedDistrict)
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
  const selectedTenant = locationSearchData?.states.find((option) => option.value === selectedState)
  const { data: tenantPublicConfig } = useTenantPublicConfigQuery({
    tenantId: selectedTenant?.tenantId,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const averagePersonsPerHousehold =
    tenantPublicConfig?.averageMembersPerHousehold &&
    tenantPublicConfig.averageMembersPerHousehold > 0
      ? tenantPublicConfig.averageMembersPerHousehold
      : 5
  const durationDateFormat = normalizeDateFormat(
    tenantPublicConfig?.dateFormatScreen.dateFormat ?? DEFAULT_SCREEN_DATE_FORMAT
  )
  const effectiveSelectedDuration =
    selectedDuration ??
    (isDurationCleared ? null : getInitialStoredDuration(storedFilters, durationDateFormat))
  const handleSelectedDurationChange: Dispatch<SetStateAction<DateRange | null>> = (value) => {
    setSelectedDuration((previousDuration) => {
      const nextDuration = typeof value === 'function' ? value(previousDuration) : value
      setIsDurationCleared(nextDuration === null)
      return nextDuration
    })
  }
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
  const { data: blockSchemePanchayatLookup } = useBlockSchemePanchayatLookupQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    blockId: isBlockSelected && hierarchyType === 'LGD' ? selectedBlockId : undefined,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(isBlockSelected && hierarchyType === 'LGD' && selectedBlockId),
  })
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
  const lgdAnalyticsParentId =
    parseAnalyticsLocationId(effectiveSelectedVillage, villageApiOptions) ??
    parseAnalyticsLocationId(effectiveSelectedGramPanchayat, gramPanchayatApiOptions) ??
    parseAnalyticsLocationId(effectiveSelectedBlock, blockApiOptions) ??
    parseAnalyticsLocationId(effectiveSelectedDistrict, districtApiOptions) ??
    selectedRootAnalyticsId ??
    0
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
  const quantityPeriodicAnalyticsParams = !hasValidAnalyticsParentId
    ? null
    : hierarchyType === 'LGD'
      ? {
          lgdId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          scale: resolveWaterQuantityPeriodicScale(
            analyticsDateRange.startDate,
            analyticsDateRange.endDate
          ),
        }
      : {
          departmentId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          scale: resolveWaterQuantityPeriodicScale(
            analyticsDateRange.startDate,
            analyticsDateRange.endDate
          ),
        }
  const regularityPeriodicAnalyticsParams = !hasValidAnalyticsParentId
    ? null
    : hierarchyType === 'LGD'
      ? {
          lgdId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          scale: resolveWaterQuantityPeriodicScale(
            analyticsDateRange.startDate,
            analyticsDateRange.endDate
          ),
        }
      : {
          departmentId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          scale: resolveWaterQuantityPeriodicScale(
            analyticsDateRange.startDate,
            analyticsDateRange.endDate
          ),
        }
  const nationalDashboardParams = hasCentralLandingFilters
    ? null
    : {
        startDate: analyticsDateRange.startDate,
        endDate: analyticsDateRange.endDate,
      }
  const nationalPeriodAnalyticsParams = hasCentralLandingFilters
    ? null
    : {
        startDate: analyticsDateRange.startDate,
        endDate: analyticsDateRange.endDate,
        scale: resolveWaterQuantityPeriodicScale(
          analyticsDateRange.startDate,
          analyticsDateRange.endDate
        ),
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
  const regularityAnalyticsParams =
    isHierarchyLeafSelected || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            parentLgdId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
        : {
            parentDepartmentId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
  const readingSubmissionRateAnalyticsParams = isHierarchyLeafSelected
    ? null
    : hierarchyType === 'LGD'
      ? hasValidAnalyticsParentId
        ? {
            parentLgdId: analyticsParentId,
            scope: 'child' as const,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
        : null
      : hasValidAnalyticsParentId
        ? {
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
  const districtSchemeCount =
    typeof dashboardData?.kpis.totalSchemes === 'number' &&
    Number.isFinite(dashboardData.kpis.totalSchemes) &&
    dashboardData.kpis.totalSchemes > 0
      ? Math.trunc(dashboardData.kpis.totalSchemes)
      : 10
  const shouldFetchSchemePerformanceAnalytics =
    (isHierarchyStateSelected ||
      isHierarchySecondLevelSelected ||
      isHierarchyThirdLevelSelected ||
      isHierarchyFourthLevelSelected ||
      isHierarchyLeafSelected) &&
    analyticsParentId > 0
  const schemePerformanceAnalyticsParams = !shouldFetchSchemePerformanceAnalytics
    ? null
    : hierarchyType === 'LGD'
      ? {
          parentLgdId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          schemeCount: isHierarchySecondLevelSelected ? districtSchemeCount : 10,
        }
      : {
          parentDepartmentId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          schemeCount: isHierarchySecondLevelSelected ? districtSchemeCount : 10,
        }
  const submissionStatusAnalyticsParams =
    !hasCentralLandingFilters || !hasValidSubmissionStatusParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            lgdId: submissionStatusParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
        : {
            departmentId: submissionStatusParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
          }
  const outageReasonsAnalyticsParams =
    !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            parentLgdId: analyticsParentId,
          }
        : {
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            parentDepartmentId: analyticsParentId,
          }
  const outageReasonsPeriodicAnalyticsParams =
    isHierarchyLeafSelected || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
      ? null
      : hierarchyType === 'LGD'
        ? {
            lgdId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            scale: resolveWaterQuantityPeriodicScale(
              analyticsDateRange.startDate,
              analyticsDateRange.endDate
            ),
          }
        : {
            departmentId: analyticsParentId,
            startDate: analyticsDateRange.startDate,
            endDate: analyticsDateRange.endDate,
            scale: resolveWaterQuantityPeriodicScale(
              analyticsDateRange.startDate,
              analyticsDateRange.endDate
            ),
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
  const { data: averageWaterSupplyData } = useAverageWaterSupplyPerRegionQuery({
    params: analyticsParams,
    enabled: Boolean(analyticsParams),
  })
  const { data: tenantBoundaryData, isFetching: isTenantBoundariesFetching = false } =
    useTenantBoundariesQuery({
      params: tenantBoundaryAnalyticsParams,
      enabled: Boolean(tenantBoundaryAnalyticsParams),
    })
  const { data: nationalDashboardData } = useNationalDashboardQuery({
    params: nationalDashboardParams,
    enabled: Boolean(nationalDashboardParams),
  })
  const {
    data: nationalSchemeRegularityPeriodicData,
    isFetching: isNationalSchemeRegularityPeriodicFetching,
  } = useNationalSchemeRegularityPeriodicQuery({
    params: nationalPeriodAnalyticsParams,
    enabled: Boolean(nationalPeriodAnalyticsParams),
  })
  const {
    data: waterQuantityPeriodicData,
    isFetching: isWaterQuantityPeriodicFetching,
    isAwaitingParams: isWaterQuantityPeriodicAwaitingParams,
  } = useWaterQuantityPeriodicQuery({
    params: quantityPeriodicAnalyticsParams,
    enabled: Boolean(quantityPeriodicAnalyticsParams),
  })
  const { data: schemeRegularityPeriodicData, isFetching: isSchemeRegularityPeriodicFetching } =
    useSchemeRegularityPeriodicQuery({
      params: regularityPeriodicAnalyticsParams,
      enabled: Boolean(regularityPeriodicAnalyticsParams),
    })
  const { data: outageReasonsPeriodicData } = useOutageReasonsPeriodicQuery({
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
  const { data: currentWaterSupplyKpiData } = useAverageWaterSupplyPerRegionQuery({
    params: currentWaterSupplyAnalyticsParams,
    enabled: Boolean(currentWaterSupplyAnalyticsParams),
  })
  const { data: previousWaterSupplyKpiData } = useAverageWaterSupplyPerRegionQuery({
    params: previousWaterSupplyAnalyticsParams,
    enabled: Boolean(previousWaterSupplyAnalyticsParams),
  })
  const { data: averageSchemeRegularityData } = useAverageSchemeRegularityQuery({
    params: regularityAnalyticsParams,
    enabled: Boolean(regularityAnalyticsParams),
  })
  const { data: readingSubmissionRateData } = useReadingSubmissionRateQuery({
    params: readingSubmissionRateAnalyticsParams,
    enabled: Boolean(readingSubmissionRateAnalyticsParams),
  })
  const { data: schemePerformanceData } = useSchemePerformanceQuery({
    params: schemePerformanceAnalyticsParams,
    enabled: Boolean(schemePerformanceAnalyticsParams),
  })
  const districtSchemeLookupTargetLgdIds = (schemePerformanceData?.topSchemes ?? []).flatMap(
    (scheme) => {
      const parentLevel = (scheme.immediateParentLgdCName ?? '').trim().toLowerCase()
      const isNestedParentLevel =
        parentLevel === 'village' ||
        parentLevel === 'gram-panchayat' ||
        parentLevel === 'gram panchayat'
      const hasBlockTitle = Boolean(scheme.immediateParentDepartmentTitle?.trim())

      return isNestedParentLevel &&
        !hasBlockTitle &&
        typeof scheme.immediateParentLgdId === 'number' &&
        scheme.immediateParentLgdId > 0
        ? [scheme.immediateParentLgdId]
        : []
    }
  )
  const { data: districtSchemeBlockLookup } = useDistrictSchemeBlockLookupQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    districtId: isDistrictSelected && hierarchyType === 'LGD' ? selectedDistrictId : undefined,
    targetLgdIds: districtSchemeLookupTargetLgdIds,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(
      isDistrictSelected &&
      hierarchyType === 'LGD' &&
      selectedDistrictId &&
      districtSchemeLookupTargetLgdIds.length > 0
    ),
  })
  const { data: submissionStatusData } = useSubmissionStatusQuery({
    params: submissionStatusAnalyticsParams,
    enabled: Boolean(submissionStatusAnalyticsParams),
  })
  const { data: outageReasonsData } = useOutageReasonsQuery({
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
  const { data: previousWaterQuantityPeriodicData } = useWaterQuantityPeriodicQuery({
    params: previousQuantityPeriodicAnalyticsParams,
    enabled: Boolean(previousQuantityPeriodicAnalyticsParams),
  })
  const { data: previousSchemeRegularityPeriodicData } = useSchemeRegularityPeriodicQuery({
    params: previousRegularityPeriodicAnalyticsParams,
    enabled: Boolean(previousRegularityPeriodicAnalyticsParams),
  })
  const isCentralLandingView = !hasCentralLandingFilters
  const rawOverallPerformanceTableData = isCentralLandingView
    ? mapOverallPerformanceFromNationalDashboard(
        filteredNationalDashboardData,
        emptyEntityPerformance,
        averagePersonsPerHousehold
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
  const mapChartData = isCentralLandingView
    ? dashboardData.mapData
    : mapTenantBoundariesToPerformance(
        tenantBoundaryData,
        overallPerformanceTableData,
        tenantBoundaryLocationOptions
      )
  const isMapDataLoading =
    !isCentralLandingView &&
    Boolean(tenantBoundaryAnalyticsParams) &&
    !tenantBoundaryData &&
    isTenantBoundariesFetching
  const quantityPerformanceData = isCentralLandingView
    ? mapQuantityPerformanceFromNationalDashboard(
        filteredNationalDashboardData,
        emptyEntityPerformance
      )
    : mapQuantityPerformanceFromAnalytics(averageWaterSupplyData, emptyEntityPerformance)
  const regularityPerformanceData = isCentralLandingView
    ? mapRegularityPerformanceFromNationalDashboard(
        filteredNationalDashboardData,
        emptyEntityPerformance
      )
    : mapRegularityPerformanceFromAnalytics(averageSchemeRegularityData, emptyEntityPerformance)
  const supplySubmissionRateData = isCentralLandingView
    ? mapReadingSubmissionRateFromNationalDashboard(filteredNationalDashboardData, [])
    : mapReadingSubmissionRateFromAnalytics(readingSubmissionRateData, [])
  const readingSubmissionStatusData = mapReadingSubmissionStatusFromAnalytics(
    submissionStatusData,
    []
  )
  const pumpOperatorsData = mapSchemePerformanceToPumpOperators(
    schemePerformanceData,
    shouldFetchSchemePerformanceAnalytics ? [] : (dashboardData?.pumpOperators ?? [])
  )
  const operatorsPerformanceAnalyticsTable = mapSchemePerformanceToTable(
    schemePerformanceData,
    [],
    {
      blockTitleByParentId: districtSchemeBlockLookup,
      parentLgdTitleById: blockSchemePanchayatLookup,
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
  const periodicQuantityTimeTrendData =
    mapWaterQuantityPeriodicToTrendPoints(waterQuantityPeriodicData)
  const periodicRegularityTimeTrendData = mapSchemeRegularityPeriodicToTrendPoints(
    schemeRegularityPeriodicData
  )
  const quantityTimeTrendData = isCentralLandingView
    ? mapNationalQuantityTrendPoints(nationalSchemeRegularityPeriodicData)
    : periodicQuantityTimeTrendData.length > 0
      ? periodicQuantityTimeTrendData
      : []
  const regularityTimeTrendData = isCentralLandingView
    ? mapNationalRegularityTrendPoints(nationalSchemeRegularityPeriodicData)
    : periodicRegularityTimeTrendData.length > 0
      ? periodicRegularityTimeTrendData
      : []
  const outageReasonsTimeTrendData =
    mapOutageReasonsPeriodicToTrendPoints(outageReasonsPeriodicData)
  const currentWaterSupplyKpis = isCentralLandingView
    ? getWaterSupplyKpisFromNationalDashboard(
        filteredNationalDashboardData,
        averagePersonsPerHousehold
      )
    : isHierarchyLeafSelected
      ? getWaterSupplyKpisFromPeriodic(waterQuantityPeriodicData, averagePersonsPerHousehold)
      : getWaterSupplyKpis(
          hasWaterSupplyData(currentWaterSupplyKpiData)
            ? currentWaterSupplyKpiData
            : averageWaterSupplyData,
          averagePersonsPerHousehold
        )
  const previousWaterSupplyKpis = isCentralLandingView
    ? getWaterSupplyKpisFromNationalDashboard(
        filteredPreviousNationalDashboardData,
        averagePersonsPerHousehold
      )
    : isHierarchyLeafSelected
      ? getWaterSupplyKpisFromPeriodic(
          previousWaterQuantityPeriodicData,
          averagePersonsPerHousehold
        )
      : getWaterSupplyKpis(previousWaterSupplyKpiData, averagePersonsPerHousehold)
  const currentRegularityKpi = isCentralLandingView
    ? getRegularityKpiFromNationalDashboard(filteredNationalDashboardData)
    : isHierarchyLeafSelected
      ? getRegularityKpiFromPeriodic(schemeRegularityPeriodicData)
      : getRegularityKpi(currentRegularityKpiData)
  const previousRegularityKpi = isCentralLandingView
    ? getRegularityKpiFromNationalDashboard(filteredPreviousNationalDashboardData)
    : isHierarchyLeafSelected
      ? getRegularityKpiFromPeriodic(previousSchemeRegularityPeriodicData)
      : getRegularityKpi(previousRegularityKpiData)
  const comparisonDays = resolveDaysInRange(
    undefined,
    previousAnalyticsRange.startDate,
    previousAnalyticsRange.endDate
  )

  const updateFilterUrl = (filters: FilterUrlUpdate) => {
    const nextState = filters.state ?? ''
    const nextPath = nextState ? `/${encodeURIComponent(nextState)}` : ROUTES.DASHBOARD
    const nextSearchParams = new URLSearchParams(searchParams)

    const setParam = (key: string, value?: string) => {
      if (value) {
        nextSearchParams.set(key, value)
        return
      }
      nextSearchParams.delete(key)
    }

    setParam('district', filters.district)
    setParam('block', filters.block)
    setParam('gramPanchayat', filters.gramPanchayat)
    setParam('village', filters.village)
    setParam('departmentZone', filters.departmentZone)
    setParam('departmentCircle', filters.departmentCircle)
    setParam('departmentDivision', filters.departmentDivision)
    setParam('departmentSubdivision', filters.departmentSubdivision)
    setParam('departmentVillage', filters.departmentVillage)

    if (filters.tab === 'administrative') {
      nextSearchParams.set('tab', 'administrative')
    } else {
      nextSearchParams.delete('tab')
    }

    const nextSearch = nextSearchParams.toString()
    navigate({
      pathname: nextPath,
      search: nextSearch ? `?${nextSearch}` : '',
    })
  }

  const handleStateChange = (value: string) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl({
      state: value,
      district: '',
      block: '',
      gramPanchayat: '',
      village: '',
      tab: 'administrative',
    })
  }
  const handleDistrictChange = (value: string) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      district: value,
      block: '',
      gramPanchayat: '',
      village: '',
      tab: 'administrative',
    })
  }
  const handleBlockChange = (value: string) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: value,
      gramPanchayat: '',
      village: '',
      tab: 'administrative',
    })
  }
  const handleGramPanchayatChange = (value: string) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: selectedBlock,
      gramPanchayat: value,
      village: '',
      tab: 'administrative',
    })
  }
  const handleVillageChange: Dispatch<SetStateAction<string>> = (value) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    const nextVillage = typeof value === 'function' ? value(selectedVillage) : value
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: selectedBlock,
      gramPanchayat: selectedGramPanchayat,
      village: nextVillage,
      tab: 'administrative',
    })
  }
  const handleFilterTabChange = (nextTabIndex: number) => {
    if (nextTabIndex === filterTabIndex) {
      return
    }

    setFilterTabIndex(nextTabIndex)
    if (nextTabIndex === 0) {
      updateFilterUrl({
        state: selectedState,
        district: selectedDistrict,
        block: selectedBlock,
        gramPanchayat: selectedGramPanchayat,
        village: selectedVillage,
        departmentZone: '',
        departmentCircle: '',
        departmentDivision: '',
        departmentSubdivision: '',
        departmentVillage: '',
        tab: 'administrative',
      })
    } else {
      setActiveTrailIndex(null)
      setSelectedDepartmentState('')
      setSelectedDepartmentZone('')
      setSelectedDepartmentCircle('')
      setSelectedDepartmentDivision('')
      setSelectedDepartmentSubdivision('')
      setSelectedDepartmentVillage('')
      updateFilterUrl({
        state: selectedState,
        district: '',
        block: '',
        gramPanchayat: '',
        village: '',
        departmentZone: '',
        departmentCircle: '',
        departmentDivision: '',
        departmentSubdivision: '',
        departmentVillage: '',
      })
    }
  }
  const handleDepartmentStateChange = (value: string) => {
    setSelectedDepartmentState(value)
    setSelectedDepartmentZone('')
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl({
      state: value || selectedState,
      departmentZone: '',
      departmentCircle: '',
      departmentDivision: '',
      departmentSubdivision: '',
      departmentVillage: '',
    })
  }
  const handleDepartmentZoneChange = (value: string) => {
    setSelectedDepartmentZone(value)
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      departmentZone: value,
      departmentCircle: '',
      departmentDivision: '',
      departmentSubdivision: '',
      departmentVillage: '',
    })
  }
  const handleDepartmentCircleChange = (value: string) => {
    setSelectedDepartmentCircle(value)
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      departmentZone: selectedDepartmentZone,
      departmentCircle: value,
      departmentDivision: '',
      departmentSubdivision: '',
      departmentVillage: '',
    })
  }
  const handleDepartmentDivisionChange = (value: string) => {
    setSelectedDepartmentDivision(value)
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      departmentZone: selectedDepartmentZone,
      departmentCircle: selectedDepartmentCircle,
      departmentDivision: value,
      departmentSubdivision: '',
      departmentVillage: '',
    })
  }
  const handleDepartmentSubdivisionChange = (value: string) => {
    setSelectedDepartmentSubdivision(value)
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      departmentZone: selectedDepartmentZone,
      departmentCircle: selectedDepartmentCircle,
      departmentDivision: selectedDepartmentDivision,
      departmentSubdivision: value,
      departmentVillage: '',
    })
  }
  const handleDepartmentVillageChange = (value: string) => {
    setSelectedDepartmentVillage(value)
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      departmentZone: selectedDepartmentZone,
      departmentCircle: selectedDepartmentCircle,
      departmentDivision: selectedDepartmentDivision,
      departmentSubdivision: selectedDepartmentSubdivision,
      departmentVillage: value,
    })
  }
  const handleClearFilters = () => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    updateFilterUrl({
      state: '',
      district: '',
      block: '',
      gramPanchayat: '',
      village: '',
      departmentZone: '',
      departmentCircle: '',
      departmentDivision: '',
      departmentSubdivision: '',
      departmentVillage: '',
    })
    handleSelectedDurationChange(null)
    setSelectedScheme('')
    setSelectedDepartmentState('')
    setSelectedDepartmentZone('')
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
  }

  useEffect(() => {
    const payload = {
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedGramPanchayat,
      selectedVillage,
      selectedDuration: effectiveSelectedDuration,
      selectedScheme,
      selectedDepartmentState,
      selectedDepartmentZone,
      selectedDepartmentCircle,
      selectedDepartmentDivision,
      selectedDepartmentSubdivision,
      selectedDepartmentVillage,
      filterTabIndex,
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // Ignore storage errors (quota/private mode)
    }
  }, [
    effectiveSelectedDuration,
    filterTabIndex,
    selectedBlock,
    selectedDistrict,
    selectedDepartmentCircle,
    selectedDepartmentDivision,
    selectedDepartmentState,
    selectedDepartmentSubdivision,
    selectedDepartmentVillage,
    selectedDepartmentZone,
    selectedGramPanchayat,
    selectedScheme,
    selectedState,
    selectedVillage,
  ])

  const handleStateClick = (_stateId: string, stateName: string) => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    setSelectedScheme('')
    const stateOption = locationSearchData?.states.find(
      (option) => option.label.toLowerCase() === stateName.toLowerCase()
    )
    updateFilterUrl({ state: stateOption?.value ?? toStateSlug(stateName) })
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
  const waterSupplyOutageDistributionData = apiWaterSupplyOutageDistributionData ?? []
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

  const numberLocale = i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN'
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(numberLocale, options).format(value)
  const quantityMldChange = calculatePercentChange(
    currentWaterSupplyKpis.quantityMld,
    previousWaterSupplyKpis.quantityMld
  )
  const quantityLpcdChange = calculateAbsoluteChange(
    currentWaterSupplyKpis.quantityLpcd,
    previousWaterSupplyKpis.quantityLpcd
  )
  const regularityChange = calculatePercentChange(currentRegularityKpi, previousRegularityKpi)
  const formatSignedValue = (value: number, options?: Intl.NumberFormatOptions) => {
    const absoluteValue = Math.abs(value)
    const formatted = new Intl.NumberFormat(numberLocale, options).format(absoluteValue)
    if (value > 0) {
      return `+${formatted}`
    }
    if (value < 0) {
      return `-${formatted}`
    }
    return formatted
  }
  const toTrendDirection = (value: number): 'up' | 'down' | 'neutral' => {
    if (value > 0) {
      return 'up'
    }
    if (value < 0) {
      return 'down'
    }
    return 'neutral'
  }
  const buildNeutralAwareTrend = (
    currentValue: number,
    changeValue: number,
    formatter: (value: number) => string
  ) => {
    if (currentValue === 0) {
      return {
        direction: 'neutral' as const,
        text: formatter(0),
      }
    }

    return {
      direction: toTrendDirection(changeValue),
      text: formatter(changeValue),
    }
  }

  const coreMetrics = [
    {
      label: t('kpi.labels.quantityInMld', { defaultValue: 'Quantity in MLD' }),
      value: formatNumber(currentWaterSupplyKpis.quantityMld, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      trend: buildNeutralAwareTrend(
        currentWaterSupplyKpis.quantityMld,
        quantityMldChange,
        (trendValue) =>
          `${formatSignedValue(trendValue, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          })}% vs previous ${comparisonDays} days`
      ),
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#E1FFEA" align="center" justify="center">
          <Image src={waterTapIcon} alt="" w="24px" h="24px" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          {t('kpi.tooltips.quantityMld.formulaLabel', {
            defaultValue: 'Quantity (MLD: Million Liters per Day)',
          })}{' '}
          = SUM(W<sub>k</sub>) / N
        </>,
        [
          <>
            MLD ={' '}
            {t('kpi.tooltips.quantityMld.definitions.mldFullForm', {
              defaultValue: 'Million Liters per Day',
            })}
          </>,
          <>
            W<sub>k</sub> ={' '}
            {t('kpi.tooltips.quantityMld.definitions.waterQuantitySupplied', {
              defaultValue: 'water quantity supplied on day k',
            })}
          </>,
          <>
            SUM(Wk) ={' '}
            {t('kpi.tooltips.quantityMld.definitions.totalWaterSupplied', {
              defaultValue: 'total water supplied across all days',
            })}
          </>,
          <>
            N ={' '}
            {t('kpi.tooltips.quantityMld.definitions.totalNumberOfDays', {
              defaultValue: 'total number of days in the selected time-period',
            })}
          </>,
        ]
      ),
    },
    {
      label: t('kpi.labels.quantityInLpcd', { defaultValue: 'Quantity in LPCD' }),
      value: formatNumber(currentWaterSupplyKpis.quantityLpcd, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
      trend: buildNeutralAwareTrend(
        currentWaterSupplyKpis.quantityLpcd,
        quantityLpcdChange,
        (trendValue) =>
          `${formatSignedValue(trendValue, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          })} LPCD vs previous ${comparisonDays} days`
      ),
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#EAF2FA" align="center" justify="center">
          <Icon as={MdOutlineWaterDrop} w="24px" h="24px" color="#2E90FA" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          {t('kpi.tooltips.quantityLpcd.formulaLabel', {
            defaultValue: 'Quantity (LPCD: Litres per Capita per Day)',
          })}{' '}
          = SUM(W<sub>k</sub>) / (SUM(FHTC<sub>i</sub>) x P x N)
        </>,
        [
          <>
            LPCD ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.lpcdFullForm', {
              defaultValue: 'Litres per Capita per Day',
            })}
          </>,
          <>
            W<sub>k</sub> ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.waterQuantitySupplied', {
              defaultValue: 'water quantity supplied on kth day',
            })}
          </>,
          <>
            FHTC<sub>i</sub> ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.functionalHouseholdTapConnections', {
              defaultValue: 'functional household tap connections of scheme i',
            })}
          </>,
          <>
            P ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.averagePersonsPerHousehold', {
              defaultValue: 'average persons per household',
            })}
          </>,
          <>
            N ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.numberOfDays', {
              defaultValue: 'total number of days in the selected time-period',
            })}
          </>,
        ]
      ),
    },
    {
      label: t('kpi.labels.regularity', { defaultValue: 'Regularity' }),
      value: `${formatNumber(currentRegularityKpi, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`,
      trend: buildNeutralAwareTrend(
        currentRegularityKpi,
        regularityChange,
        (trendValue) =>
          `${formatSignedValue(trendValue, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          })}% vs previous ${comparisonDays} days`
      ),
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#FFF4CC" align="center" justify="center">
          <Image src={wallClockIcon} alt="" w="24px" h="24px" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          {t('kpi.tooltips.regularity.formulaLabel', { defaultValue: 'Regularity of scheme' })} = X
          <sub>i</sub> / N * 100
        </>,
        [
          <>
            X<sub>i</sub> ={' '}
            {t('kpi.tooltips.regularity.definitions.numberOfSupplyDays', {
              defaultValue: 'number of supply-days of scheme i',
            })}
          </>,
          <>
            N ={' '}
            {t('kpi.tooltips.regularity.definitions.totalNumberOfDaysInSelectedPeriod', {
              defaultValue: 'total number of days in the selected time period',
            })}
          </>,
        ]
      ),
    },
  ] as const
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
      />

      {/* KPI Cards */}
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(auto-fit, minmax(240px, 1fr))' }}
        gap={4}
        mb={6}
      >
        {coreMetrics.map((metric) => (
          <KPICard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
            tooltipContent={metric.tooltipContent}
          />
        ))}
      </Grid>

      {/* Map and Overall Performance */}
      {!activeLeafSelection ? (
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            pt="24px"
            pb="10px"
            pl="16px"
            pr="16px"
            w="full"
            h={{ base: '420px', sm: '520px', lg: '710px' }}
            minW={0}
          >
            <IndiaMapChart
              data={mapChartData}
              isLoading={isMapDataLoading}
              mapName={
                isCentralLandingView
                  ? 'india'
                  : `tenant-boundary-${hierarchyType.toLowerCase()}-${analyticsParentId}`
              }
              fallbackToIndiaMap={isCentralLandingView}
              usePrimaryFill={isCentralLandingView}
              onStateClick={isCentralLandingView ? handleStateClick : undefined}
              onStateHover={handleStateHover}
              height="100%"
            />
          </Box>
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            pt="24px"
            pb="24px"
            pl="16px"
            pr="16px"
            w="full"
            h={{ base: '420px', sm: '520px', lg: '710px' }}
            minW={0}
          >
            <Text textStyle="bodyText3" fontWeight="400" mb={4}>
              {t('overallPerformance.title', { defaultValue: 'Overall Performance' })}
            </Text>
            <OverallPerformanceTable
              data={overallPerformanceTableData}
              entityLabel={overallPerformanceEntityLabel}
              scrollMaxHeight={overallPerformanceScrollHeight}
            />
          </Box>
        </Grid>
      ) : null}
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
        quantityPerformanceData={quantityPerformanceData}
        quantityTimeTrendData={quantityTimeTrendData}
        isQuantityTimeTrendLoading={
          isCentralLandingView
            ? isNationalSchemeRegularityPeriodicFetching
            : isWaterQuantityPeriodicFetching
        }
        isQuantityTimeTrendAwaitingParams={
          isCentralLandingView ? false : isWaterQuantityPeriodicAwaitingParams
        }
        regularityPerformanceData={regularityPerformanceData}
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
        pumpOperatorsTotal={pumpOperatorsTotal}
        operatorsPerformanceTable={operatorsPerformanceTable}
        villagePhotoEvidenceRows={villagePhotoEvidenceRows}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        tenantCode={selectedTenant?.tenantCode}
        schemeId={derivedVillageSchemeId}
      />
    </Box>
  )
}

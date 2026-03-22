import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Flex, Text, Heading, Grid, Icon, Image, useBreakpointValue } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useLocationChildrenQuery } from '../services/query/use-location-children-query'
import { useLocationSearchQuery } from '../services/query/use-location-search-query'
import { useAverageWaterSupplyPerRegionQuery } from '../services/query/use-average-water-supply-per-region-query'
import { useAverageSchemeRegularityQuery } from '../services/query/use-average-scheme-regularity-query'
import { useNationalDashboardQuery } from '../services/query/use-national-dashboard-query'
import { useOutageReasonsQuery } from '../services/query/use-outage-reasons-query'
import { useReadingSubmissionRateQuery } from '../services/query/use-reading-submission-rate-query'
import { useSchemePerformanceQuery } from '../services/query/use-scheme-performance-query'
import { useSubmissionStatusQuery } from '../services/query/use-submission-status-query'
import { KPICard } from './kpi-card'
import { DashboardBody } from './screens/dashboard-body'
import { IndiaMapChart } from './charts'
import { LoadingSpinner } from '@/shared/components/common'
import { useAuthStore } from '@/app/store'
import { MdOutlineWaterDrop } from 'react-icons/md'
import waterTapIcon from '@/assets/media/water-tap_1822589 1.svg'
import wallClockIcon from '@/assets/media/wall-clock.svg'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import type { EntityPerformance, VillagePumpOperatorDetails } from '../types'
import { DashboardFilters } from './filters/dashboard-filters'
import { OverallPerformanceTable } from './tables'
import { ROUTES } from '@/shared/constants/routes'
import { computeTrailIndices } from '../utils/trail-index'
import { slugify, toCapitalizedWords } from '../utils/format-location-label'
import {
  calculateAbsoluteChange,
  calculatePercentChange,
  getPreviousPeriodRange,
  getRegularityKpi,
  getRegularityKpiFromNationalDashboard,
  mapOutageReasonsFromNationalDashboard,
  mapOverallPerformanceFromNationalDashboard,
  mapQuantityPerformanceFromNationalDashboard,
  mapReadingSubmissionRateFromNationalDashboard,
  mapReadingSubmissionRateFromAnalytics,
  mapReadingSubmissionStatusFromAnalytics,
  mapRegularityPerformanceFromNationalDashboard,
  mapSchemePerformanceToTable,
  mapSchemePerformanceToPumpOperators,
  getWaterSupplyKpis,
  getWaterSupplyKpisFromNationalDashboard,
  mapOverallPerformanceFromAnalytics,
  mapQuantityPerformanceFromAnalytics,
  mapRegularityPerformanceFromAnalytics,
  resolveDaysInRange,
} from '../utils/formulas'
import {
  mockFilterStates,
  mockFilterDistricts,
  mockFilterBlocks,
  mockFilterGramPanchayats,
  mockFilterVillages,
  mockFilterSchemes,
  mockDistrictPerformanceByState,
  mockBlockPerformanceByDistrict,
  mockGramPanchayatPerformanceByBlock,
  mockVillagePerformanceByGramPanchayat,
} from '../services/mock/dashboard-mock'
import type { HierarchyType, TenantChildLocation } from '../services/api/dashboard-api'

const storageKey = 'central-dashboard-filters'
const LOCATION_VALUE_SEPARATOR = ':'

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

type LocationOption = SearchableSelectOption & { locationId?: number }

const getOwnLookupValue = <T,>(record: Record<string, T>, key: string, fallback: T): T => {
  if (Object.prototype.hasOwnProperty.call(record, key)) {
    return record[key] as T
  }

  return fallback
}

const getFirstRecordValue = <T,>(record: Record<string, T>, fallback: T): T => {
  const firstKey = Object.keys(record)[0]
  if (!firstKey) {
    return fallback
  }

  return record[firstKey] as T
}

const isUnsafeLookupKey = (key: string) =>
  key === '__proto__' || key === 'prototype' || key === 'constructor'

const parseLocationId = (value: string): number | undefined => {
  if (!value) {
    return undefined
  }

  const idPrefix = value.split(LOCATION_VALUE_SEPARATOR, 1)[0]
  const parsedId = Number.parseInt(idPrefix, 10)
  return Number.isFinite(parsedId) ? parsedId : undefined
}

const normalizeMockLookupKey = (value: string): string => {
  if (!value) {
    return ''
  }

  const separatorIndex = value.indexOf(LOCATION_VALUE_SEPARATOR)
  const rawKey = separatorIndex >= 0 ? value.slice(separatorIndex + 1) : value
  if (isUnsafeLookupKey(rawKey)) {
    return rawKey
  }
  return slugify(rawKey)
}

const getLookupValueWithFallback = <T,>(
  record: Record<string, T>,
  key: string,
  emptyFallback: T,
  defaultFallback: T
): T => {
  if (!key) {
    return defaultFallback
  }

  if (isUnsafeLookupKey(key)) {
    return emptyFallback
  }

  return getOwnLookupValue(record, key, emptyFallback)
}

const toIsoDate = (date?: string | Date | null): string | undefined => {
  if (typeof date === 'string') {
    return date || undefined
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
      const normalizedTitle = toCapitalizedWords(location.title?.trim() ?? '')
      return {
        value: `${locationId}${LOCATION_VALUE_SEPARATOR}${slugify(normalizedTitle)}`,
        label: normalizedTitle,
        locationId,
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
    label: region.title,
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

export function CentralDashboard() {
  const { t, i18n } = useTranslation('dashboard')
  const overallPerformanceScrollHeight =
    useBreakpointValue({ base: '320px', sm: '420px', lg: '620px' }) ?? '620px'
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const authUserId = useAuthStore((state) => state.user?.id)
  const { data, isLoading, error } = useDashboardData('central')
  const [storedFilters] = useState(() => getStoredFilters())
  const initialDuration =
    storedFilters.selectedDuration &&
    typeof storedFilters.selectedDuration === 'object' &&
    'startDate' in storedFilters.selectedDuration &&
    'endDate' in storedFilters.selectedDuration
      ? storedFilters.selectedDuration
      : null
  const selectedState = stateSlug
  const selectedDistrict = selectedState ? (searchParams.get('district') ?? '') : ''
  const selectedBlock = selectedDistrict ? (searchParams.get('block') ?? '') : ''
  const selectedGramPanchayat = selectedBlock ? (searchParams.get('gramPanchayat') ?? '') : ''
  const selectedVillage = selectedGramPanchayat ? (searchParams.get('village') ?? '') : ''
  const [selectedDuration, setSelectedDuration] = useState<DateRange | null>(initialDuration)
  const [selectedScheme, setSelectedScheme] = useState(storedFilters.selectedScheme ?? '')
  const [selectedDepartmentState, setSelectedDepartmentState] = useState(
    storedFilters.selectedDepartmentState ?? ''
  )
  const [selectedDepartmentZone, setSelectedDepartmentZone] = useState(
    storedFilters.selectedDepartmentZone ?? ''
  )
  const [selectedDepartmentCircle, setSelectedDepartmentCircle] = useState(
    storedFilters.selectedDepartmentCircle ?? ''
  )
  const [selectedDepartmentDivision, setSelectedDepartmentDivision] = useState(
    storedFilters.selectedDepartmentDivision ?? ''
  )
  const [selectedDepartmentSubdivision, setSelectedDepartmentSubdivision] = useState(
    storedFilters.selectedDepartmentSubdivision ?? ''
  )
  const [selectedDepartmentVillage, setSelectedDepartmentVillage] = useState(
    storedFilters.selectedDepartmentVillage ?? ''
  )
  const [filterTabIndex, setFilterTabIndex] = useState(
    typeof storedFilters.filterTabIndex === 'number' ? storedFilters.filterTabIndex : 0
  )
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
  const normalizedSelectedState = normalizeMockLookupKey(effectiveSelectedState)
  const normalizedSelectedDistrict = normalizeMockLookupKey(effectiveSelectedDistrict)
  const normalizedSelectedBlock = normalizeMockLookupKey(effectiveSelectedBlock)
  const normalizedSelectedGramPanchayat = normalizeMockLookupKey(effectiveSelectedGramPanchayat)
  const hasStateMockData = Object.prototype.hasOwnProperty.call(
    mockDistrictPerformanceByState,
    normalizedSelectedState
  )
  const selectedStateMockKey = isUnsafeLookupKey(normalizedSelectedState)
    ? normalizedSelectedState
    : hasStateMockData
      ? normalizedSelectedState
      : ''
  const selectedDistrictMockKey = isUnsafeLookupKey(normalizedSelectedDistrict)
    ? normalizedSelectedDistrict
    : hasStateMockData
      ? normalizedSelectedDistrict
      : ''
  const selectedBlockMockKey = isUnsafeLookupKey(normalizedSelectedBlock)
    ? normalizedSelectedBlock
    : hasStateMockData
      ? normalizedSelectedBlock
      : ''
  const selectedGramPanchayatMockKey = isUnsafeLookupKey(normalizedSelectedGramPanchayat)
    ? normalizedSelectedGramPanchayat
    : hasStateMockData
      ? normalizedSelectedGramPanchayat
      : ''
  const isStateSelected = Boolean(effectiveSelectedState)
  const isDistrictSelected = Boolean(effectiveSelectedDistrict)
  const isBlockSelected = Boolean(effectiveSelectedBlock)
  const isGramPanchayatSelected = Boolean(effectiveSelectedGramPanchayat)
  const isVillageSelected = Boolean(effectiveSelectedVillage)
  const isDepartmentStateSelected = Boolean(selectedDepartmentState)
  const hierarchyType: HierarchyType = filterTabIndex === 0 ? 'LGD' : 'DEPARTMENT'
  const emptyOptions: SearchableSelectOption[] = []
  const isAdvancedEnabled = Boolean(selectedState && selectedDistrict)
  const emptyEntityPerformance: EntityPerformance[] = []
  const defaultDistrictTableData = getFirstRecordValue(
    mockDistrictPerformanceByState,
    emptyEntityPerformance
  )
  const defaultBlockTableData = getFirstRecordValue(
    mockBlockPerformanceByDistrict,
    emptyEntityPerformance
  )
  const defaultGramPanchayatTableData = getFirstRecordValue(
    mockGramPanchayatPerformanceByBlock,
    emptyEntityPerformance
  )
  const defaultVillageTableData = getFirstRecordValue(
    mockVillagePerformanceByGramPanchayat,
    emptyEntityPerformance
  )
  const districtTableData = getLookupValueWithFallback(
    mockDistrictPerformanceByState,
    selectedStateMockKey,
    emptyEntityPerformance,
    defaultDistrictTableData
  )
  const blockTableData = getLookupValueWithFallback(
    mockBlockPerformanceByDistrict,
    selectedDistrictMockKey,
    emptyEntityPerformance,
    defaultBlockTableData
  )
  const gramPanchayatTableData = getLookupValueWithFallback(
    mockGramPanchayatPerformanceByBlock,
    selectedBlockMockKey,
    emptyEntityPerformance,
    defaultGramPanchayatTableData
  )
  const villageTableData = getLookupValueWithFallback(
    mockVillagePerformanceByGramPanchayat,
    selectedGramPanchayatMockKey,
    emptyEntityPerformance,
    defaultVillageTableData
  )
  const supplySubmissionRateFallbackData = isGramPanchayatSelected
    ? villageTableData
    : isBlockSelected
      ? gramPanchayatTableData
      : isDistrictSelected
        ? blockTableData
        : isStateSelected
          ? districtTableData
          : (data?.mapData ?? ([] as EntityPerformance[]))
  const supplySubmissionRateLabel = isGramPanchayatSelected
    ? t('performanceCharts.viewBy.villages', { defaultValue: 'Villages' })
    : isBlockSelected
      ? t('performanceCharts.viewBy.gramPanchayats', { defaultValue: 'Gram Panchayats' })
      : isDistrictSelected
        ? t('performanceCharts.viewBy.blocks', { defaultValue: 'Blocks' })
        : isStateSelected
          ? t('performanceCharts.viewBy.districts', { defaultValue: 'Districts' })
          : t('performanceCharts.viewBy.statesUTs', { defaultValue: 'States/UTs' })
  const overallPerformanceFallbackData = isGramPanchayatSelected
    ? villageTableData
    : isBlockSelected
      ? gramPanchayatTableData
      : isDistrictSelected
        ? blockTableData
        : isStateSelected
          ? districtTableData
          : (data?.mapData ?? emptyEntityPerformance)
  const overallPerformanceEntityLabel = isGramPanchayatSelected
    ? t('overallPerformance.entities.village', { defaultValue: 'Village' })
    : isBlockSelected
      ? t('overallPerformance.entities.gramPanchayat', { defaultValue: 'Gram Panchayat' })
      : isDistrictSelected
        ? t('overallPerformance.entities.block', { defaultValue: 'Block' })
        : isStateSelected
          ? t('overallPerformance.entities.district', { defaultValue: 'District' })
          : t('overallPerformance.entities.stateUt', { defaultValue: 'State/UT' })
  const districtOptions = normalizedSelectedState
    ? getOwnLookupValue(mockFilterDistricts, normalizedSelectedState, emptyOptions)
    : emptyOptions
  const blockOptions = normalizedSelectedDistrict
    ? getOwnLookupValue(mockFilterBlocks, normalizedSelectedDistrict, emptyOptions)
    : emptyOptions
  const gramPanchayatOptions = normalizedSelectedBlock
    ? getOwnLookupValue(mockFilterGramPanchayats, normalizedSelectedBlock, emptyOptions)
    : emptyOptions
  const villageOptions = normalizedSelectedGramPanchayat
    ? getOwnLookupValue(mockFilterVillages, normalizedSelectedGramPanchayat, emptyOptions)
    : emptyOptions
  const { data: locationSearchData } = useLocationSearchQuery()
  const selectedTenant = locationSearchData?.states.find((option) => option.value === selectedState)
  const { data: rootLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: 0,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const rootLocationOptions = mapLocationOptions(rootLocationsData?.data)
  const selectedRootOption = findLocationOption(rootLocationOptions, selectedState)
  const analyticsParentId =
    parseLocationId(effectiveSelectedVillage) ??
    parseLocationId(effectiveSelectedGramPanchayat) ??
    parseLocationId(effectiveSelectedBlock) ??
    parseLocationId(effectiveSelectedDistrict) ??
    selectedRootOption?.locationId ??
    0
  const hasValidAnalyticsParentId = analyticsParentId > 0
  const analyticsFallbackData = isGramPanchayatSelected
    ? villageTableData
    : isBlockSelected
      ? gramPanchayatTableData
      : isDistrictSelected
        ? blockTableData
        : isStateSelected
          ? districtTableData
          : (data?.mapData ?? emptyEntityPerformance)
  const defaultAnalyticsRange = getDefaultAnalyticsDateRange()
  const analyticsDateRange = {
    startDate: toIsoDate(selectedDuration?.startDate) ?? defaultAnalyticsRange.startDate,
    endDate: toIsoDate(selectedDuration?.endDate) ?? defaultAnalyticsRange.endDate,
  }
  const hasCentralLandingFilters =
    isStateSelected ||
    isDistrictSelected ||
    isBlockSelected ||
    isGramPanchayatSelected ||
    isVillageSelected ||
    Boolean(selectedDepartmentState) ||
    Boolean(selectedDepartmentZone) ||
    Boolean(selectedDepartmentCircle) ||
    Boolean(selectedDepartmentDivision) ||
    Boolean(selectedDepartmentSubdivision) ||
    Boolean(selectedDepartmentVillage)
  const nationalDashboardParams = hasCentralLandingFilters
    ? null
    : {
        startDate: analyticsDateRange.startDate,
        endDate: analyticsDateRange.endDate,
      }
  const analyticsParams =
    hierarchyType !== 'LGD' ||
    isVillageSelected ||
    !selectedTenant?.tenantId ||
    !hasValidAnalyticsParentId
      ? null
      : {
          tenantId: selectedTenant.tenantId,
          parentLgdId: analyticsParentId,
          scope: 'child' as const,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
        }
  const regularityAnalyticsParams =
    hierarchyType !== 'LGD' || isVillageSelected || !hasValidAnalyticsParentId
      ? null
      : {
          parentLgdId: analyticsParentId,
          scope: 'child' as const,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
        }
  const readingSubmissionRateAnalyticsParams = isVillageSelected
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
  const parsedAuthUserId = Number.parseInt(authUserId ?? '', 10)
  const submissionStatusUserId = Number.isFinite(parsedAuthUserId) ? parsedAuthUserId : undefined
  const shouldFetchSchemePerformanceAnalytics =
    (isStateSelected ||
      isDistrictSelected ||
      isBlockSelected ||
      isGramPanchayatSelected ||
      isVillageSelected) &&
    analyticsParentId > 0
  const schemePerformanceAnalyticsParams = !shouldFetchSchemePerformanceAnalytics
    ? null
    : hierarchyType === 'LGD'
      ? {
          parentLgdId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          schemeCount: 10,
        }
      : {
          parentDepartmentId: analyticsParentId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
          schemeCount: 10,
        }
  const submissionStatusAnalyticsParams =
    hasCentralLandingFilters && typeof submissionStatusUserId === 'number'
      ? {
          userId: submissionStatusUserId,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
        }
      : null
  const outageReasonsAnalyticsParams =
    isVillageSelected || !selectedTenant?.tenantId || !hasValidAnalyticsParentId
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
    analyticsParams === null
      ? null
      : {
          ...analyticsParams,
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
  const { data: nationalDashboardData } = useNationalDashboardQuery({
    params: nationalDashboardParams,
    enabled: Boolean(nationalDashboardParams),
  })
  const { data: previousNationalDashboardData } = useNationalDashboardQuery({
    params: previousNationalDashboardParams,
    enabled: Boolean(previousNationalDashboardParams),
  })
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
  const isCentralLandingView = !hasCentralLandingFilters
  const quantityPerformanceData = isCentralLandingView
    ? mapQuantityPerformanceFromNationalDashboard(nationalDashboardData, analyticsFallbackData)
    : mapQuantityPerformanceFromAnalytics(averageWaterSupplyData, analyticsFallbackData)
  const regularityPerformanceData = isCentralLandingView
    ? mapRegularityPerformanceFromNationalDashboard(nationalDashboardData, analyticsFallbackData)
    : mapRegularityPerformanceFromAnalytics(averageSchemeRegularityData, analyticsFallbackData)
  const supplySubmissionRateData = isCentralLandingView
    ? mapReadingSubmissionRateFromNationalDashboard(
        nationalDashboardData,
        supplySubmissionRateFallbackData
      )
    : mapReadingSubmissionRateFromAnalytics(
        readingSubmissionRateData,
        supplySubmissionRateFallbackData
      )
  const readingSubmissionStatusData = mapReadingSubmissionStatusFromAnalytics(
    submissionStatusData,
    data?.readingSubmissionStatus ?? []
  )
  const pumpOperatorsData = mapSchemePerformanceToPumpOperators(
    schemePerformanceData,
    data?.pumpOperators ?? []
  )
  const operatorsPerformanceAnalyticsTable = mapSchemePerformanceToTable(schemePerformanceData, [])
  const derivedVillageSchemeId = isVillageSelected
    ? (selectedSchemeId ?? schemePerformanceData?.topSchemes?.[0]?.schemeId)
    : undefined
  const derivedVillageScheme =
    (typeof derivedVillageSchemeId === 'number'
      ? schemePerformanceData?.topSchemes?.find(
          (scheme) => scheme.schemeId === derivedVillageSchemeId
        )
      : undefined) ?? (isVillageSelected ? schemePerformanceData?.topSchemes?.[0] : undefined)
  const overallPerformanceTableData = isCentralLandingView
    ? mapOverallPerformanceFromNationalDashboard(
        nationalDashboardData,
        overallPerformanceFallbackData,
        5
      )
    : mapOverallPerformanceFromAnalytics(
        averageWaterSupplyData,
        averageSchemeRegularityData,
        overallPerformanceFallbackData,
        5
      )
  const currentWaterSupplyKpis = isCentralLandingView
    ? getWaterSupplyKpisFromNationalDashboard(nationalDashboardData, 5)
    : getWaterSupplyKpis(currentWaterSupplyKpiData, 5)
  const previousWaterSupplyKpis = isCentralLandingView
    ? getWaterSupplyKpisFromNationalDashboard(previousNationalDashboardData, 5)
    : getWaterSupplyKpis(previousWaterSupplyKpiData, 5)
  const currentRegularityKpi = isCentralLandingView
    ? getRegularityKpiFromNationalDashboard(nationalDashboardData)
    : getRegularityKpi(currentRegularityKpiData)
  const previousRegularityKpi = isCentralLandingView
    ? getRegularityKpiFromNationalDashboard(previousNationalDashboardData)
    : getRegularityKpi(previousRegularityKpiData)

  const updateFilterUrl = (filters: {
    state?: string
    district?: string
    block?: string
    gramPanchayat?: string
    village?: string
  }) => {
    const nextState = filters.state ?? ''
    const nextPath = nextState ? `/${encodeURIComponent(nextState)}` : ROUTES.DASHBOARD
    const nextSearchParams = new URLSearchParams()

    if (filters.district) {
      nextSearchParams.set('district', filters.district)
    }
    if (filters.block) {
      nextSearchParams.set('block', filters.block)
    }
    if (filters.gramPanchayat) {
      nextSearchParams.set('gramPanchayat', filters.gramPanchayat)
    }
    if (filters.village) {
      nextSearchParams.set('village', filters.village)
    }

    const nextSearch = nextSearchParams.toString()
    navigate({
      pathname: nextPath,
      search: nextSearch ? `?${nextSearch}` : '',
    })
  }

  const handleStateChange = (value: string) => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    setSelectedScheme('')
    updateFilterUrl({ state: value })
  }
  const handleDistrictChange = (value: string) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl({ state: selectedState, district: value })
  }
  const handleBlockChange = (value: string) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: value,
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
    })
  }
  const handleDepartmentStateChange = (value: string) => {
    setSelectedDepartmentState(value)
    setSelectedDepartmentZone('')
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
  }
  const handleClearFilters = () => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    updateFilterUrl({ state: '' })
    setSelectedDuration(null)
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
      selectedDuration,
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
    filterTabIndex,
    selectedBlock,
    selectedDistrict,
    selectedDuration,
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
    const stateOption = mockFilterStates.find(
      (option) => option.label.toLowerCase() === stateName.toLowerCase()
    )
    updateFilterUrl({ state: stateOption?.value ?? toStateSlug(stateName) })
  }

  const handleStateHover = (_stateId: string, _stateName: string, _metrics: unknown) => {
    // Hover tooltip is handled by ECharts
  }

  const villagePumpOperatorDetails: VillagePumpOperatorDetails = {
    schemeId: derivedVillageSchemeId,
    schemeName: derivedVillageScheme?.schemeName,
    name: 'N/A',
    scheme:
      derivedVillageScheme?.schemeName && derivedVillageSchemeId
        ? `${derivedVillageScheme.schemeName} / ${derivedVillageSchemeId}`
        : 'N/A',
    stationLocation: 'N/A',
    lastSubmission: 'N/A',
    reportingRate: 'N/A',
    missingSubmissionCount: 'N/A',
    inactiveDays: 'N/A',
  }

  if (isLoading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <LoadingSpinner />
      </Flex>
    )
  }

  if (error) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Box textAlign="center">
          <Heading fontSize="2xl" fontWeight="bold" color="red.600">
            Error loading dashboard
          </Heading>
          <Text mt={2} color="gray.600">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
        </Box>
      </Flex>
    )
  }

  if (!data) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Box textAlign="center">
          <Heading fontSize="2xl" fontWeight="bold" color="red.600">
            {t('states.dataUnavailable.title', { defaultValue: 'Dashboard data unavailable' })}
          </Heading>
          <Text mt={2} color="gray.600">
            {t('states.dataUnavailable.description', {
              defaultValue: 'No dashboard data was returned.',
            })}
          </Text>
        </Box>
      </Flex>
    )
  }

  if (
    !data.kpis ||
    !data.mapData ||
    !data.demandSupply ||
    !data.readingSubmissionStatus ||
    !data.pumpOperators ||
    !data.readingCompliance ||
    !data.waterSupplyOutages ||
    !data.topPerformers ||
    !data.worstPerformers ||
    !data.regularityData ||
    !data.continuityData
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
    ? mapOutageReasonsFromNationalDashboard(nationalDashboardData, data.waterSupplyOutages)
    : null
  const apiWaterSupplyOutageDistributionData = outageReasonsData?.childRegions?.length
    ? toOutageDistributionData(outageReasonsData.childRegions)
    : null
  const waterSupplyOutagesData =
    nationalWaterSupplyOutageReasonsData ??
    apiWaterSupplyOutageReasonsData ??
    data.waterSupplyOutages
  const waterSupplyOutageDistributionData =
    apiWaterSupplyOutageDistributionData ?? data.waterSupplyOutages
  const resolvedDashboardData =
    readingSubmissionStatusData === data.readingSubmissionStatus &&
    pumpOperatorsData === data.pumpOperators
      ? data
      : {
          ...data,
          readingSubmissionStatus: readingSubmissionStatusData,
          pumpOperators: pumpOperatorsData,
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

  const coreMetrics = [
    {
      label: t('kpi.labels.quantityInMld', { defaultValue: 'Quantity in MLD' }),
      value: formatNumber(currentWaterSupplyKpis.quantityMld, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      trend: {
        direction: toTrendDirection(quantityMldChange),
        text: `${formatSignedValue(quantityMldChange, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })}% vs last ${resolveDaysInRange(
          previousWaterSupplyKpiData?.daysInRange,
          previousWaterSupplyAnalyticsParams?.startDate,
          previousWaterSupplyAnalyticsParams?.endDate
        )} days`,
      },
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#E6F7EC" align="center" justify="center">
          <Image src={waterTapIcon} alt="" w="24px" h="24px" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          Quantity (MLD) = SUM(W<sub>k</sub>) / N
        </>,
        [
          <>
            W<sub>k</sub> = water quantity supplied on day k
          </>,
          <>SUM(Wk) = total water supplied across all days</>,
          <>N = total number of days</>,
        ]
      ),
    },
    {
      label: t('kpi.labels.quantityInLpcd', { defaultValue: 'Quantity in LPCD' }),
      value: formatNumber(currentWaterSupplyKpis.quantityLpcd, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
      trend: {
        direction: toTrendDirection(quantityLpcdChange),
        text: `${formatSignedValue(quantityLpcdChange, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })} LPCD vs last month`,
      },
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#EAF2FA" align="center" justify="center">
          <Icon as={MdOutlineWaterDrop} w="24px" h="24px" color="#2E90FA" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          Quantity (LPCD) = SUM(W<sub>k</sub>) / (SUM(FHTC<sub>i</sub>) x P x N)
        </>,
        [
          <>
            W<sub>k</sub> = water quantity supplied on day k
          </>,
          <>
            FHTC<sub>i</sub> = functional household tap connections of scheme i
          </>,
          <>P = average persons per household</>,
          <>N = number of days</>,
        ]
      ),
    },
    {
      label: t('kpi.labels.regularity', { defaultValue: 'Regularity' }),
      value: `${formatNumber(currentRegularityKpi, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`,
      trend: {
        direction: toTrendDirection(regularityChange),
        text: `${formatSignedValue(regularityChange, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })}% vs last month`,
      },
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#FFF4CC" align="center" justify="center">
          <Image src={wallClockIcon} alt="" w="24px" h="24px" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          Regularity of scheme = X<sub>i</sub> / N
        </>,
        [
          <>
            X<sub>i</sub> = number of supply-days of scheme i
          </>,
          <>N = total number of days in the selected time period</>,
        ]
      ),
    },
  ] as const
  const pumpOperatorsTotal = resolvedDashboardData.pumpOperators.reduce(
    (total, item) => total + item.value,
    0
  )
  const leadingPumpOperators = data.leadingPumpOperators ?? []
  const bottomPumpOperators = data.bottomPumpOperators ?? []
  const operatorsPerformanceTable =
    operatorsPerformanceAnalyticsTable.length > 0
      ? operatorsPerformanceAnalyticsTable
      : [...leadingPumpOperators, ...bottomPumpOperators]
  const villagePhotoEvidenceRows = data?.readingCompliance ?? []

  return (
    <Box>
      <DashboardFilters
        filterTabIndex={filterTabIndex}
        onTabChange={setFilterTabIndex}
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
        selectedDuration={selectedDuration}
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
        mockFilterStates={mockFilterStates}
        mockFilterSchemes={mockFilterSchemes}
        onStateChange={handleStateChange}
        onDistrictChange={handleDistrictChange}
        onBlockChange={handleBlockChange}
        onGramPanchayatChange={handleGramPanchayatChange}
        setSelectedVillage={handleVillageChange}
        setSelectedScheme={setSelectedScheme}
        setSelectedDuration={setSelectedDuration}
        onDepartmentStateChange={handleDepartmentStateChange}
        setSelectedDepartmentZone={setSelectedDepartmentZone}
        setSelectedDepartmentCircle={setSelectedDepartmentCircle}
        setSelectedDepartmentDivision={setSelectedDepartmentDivision}
        setSelectedDepartmentSubdivision={setSelectedDepartmentSubdivision}
        setSelectedDepartmentVillage={setSelectedDepartmentVillage}
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
      {!isVillageSelected ? (
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
              data={data.mapData}
              onStateClick={handleStateClick}
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
        isStateSelected={isStateSelected}
        isDistrictSelected={isDistrictSelected}
        isBlockSelected={isBlockSelected}
        isGramPanchayatSelected={isGramPanchayatSelected}
        selectedVillage={effectiveSelectedVillage}
        quantityPerformanceData={quantityPerformanceData}
        regularityPerformanceData={regularityPerformanceData}
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

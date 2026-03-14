import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Flex, Text, Heading, Grid, Icon, Image } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useLocationChildrenQuery } from '../services/query/use-location-children-query'
import { useLocationSearchQuery } from '../services/query/use-location-search-query'
import { useAverageWaterSupplyPerRegionQuery } from '../services/query/use-average-water-supply-per-region-query'
import { useAverageSchemeRegularityQuery } from '../services/query/use-average-scheme-regularity-query'
import { useOutageReasonsQuery } from '../services/query/use-outage-reasons-query'
import { useReadingSubmissionRateQuery } from '../services/query/use-reading-submission-rate-query'
import { useSchemePerformanceQuery } from '../services/query/use-scheme-performance-query'
import { useSubmissionStatusQuery } from '../services/query/use-submission-status-query'
import { KPICard } from './kpi-card'
import { DashboardBody } from './screens/dashboard-body'
import { IndiaMapChart } from './charts'
import { LoadingSpinner } from '@/shared/components/common'
import { MdOutlineWaterDrop } from 'react-icons/md'
import { LuClock3 } from 'react-icons/lu'
import waterTapIcon from '@/assets/media/water-tap_1822589 1.svg'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import type {
  EntityPerformance,
  OutageReasonSchemeCount,
  OutageReasonsResponse,
  WaterSupplyOutageData,
} from '../types'
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
  mapReadingSubmissionRateFromAnalytics,
  mapReadingSubmissionStatusFromAnalytics,
  mapSchemePerformanceToTable,
  mapSchemePerformanceToPumpOperators,
  getWaterSupplyKpis,
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

const normalizeMockLookupKey = (value: string) => {
  if (!value) {
    return ''
  }

  const normalizedValue = value.includes(':') ? value.split(':').slice(1).join(':') : value
  return normalizedValue.trim().toLowerCase()
}

const parseLocationId = (value: string): number | undefined => {
  if (!value) {
    return undefined
  }

  const idPrefix = value.split(LOCATION_VALUE_SEPARATOR, 1)[0]
  const parsedId = Number.parseInt(idPrefix, 10)
  return Number.isFinite(parsedId) ? parsedId : undefined
}

type LocationOption = {
  value: string
  label: string
  locationId?: number
}

const toStableLocationValue = (locationId: number, label: string): string =>
  `${locationId}${LOCATION_VALUE_SEPARATOR}${slugify(label)}`

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
        value: toStableLocationValue(locationId, normalizedTitle),
        label: normalizedTitle,
        locationId,
      }
    })
}

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

const toIsoDate = (value?: string | null): string | null => {
  if (!value) {
    return null
  }

  const parts = value.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    if (year && month && day) {
      return `${year}-${month}-${day}`
    }
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultAnalyticsDateRange = () => {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 29)

  return {
    startDate: formatDateForApi(startDate),
    endDate: formatDateForApi(endDate),
  }
}

const emptyOutageReasons: WaterSupplyOutageData = {
  label: 'Outages',
  electricityFailure: 0,
  pipelineLeak: 0,
  pumpFailure: 0,
  valveIssue: 0,
  sourceDrying: 0,
}

const normalizeOutageReasonKey = (value: string) => value.replace(/[^a-z]/gi, '').toLowerCase()

const toOutageReasonsData = (
  outageReasonSchemeCount: OutageReasonSchemeCount | undefined
): WaterSupplyOutageData => {
  if (!outageReasonSchemeCount) {
    return emptyOutageReasons
  }

  return Object.entries(outageReasonSchemeCount).reduce<WaterSupplyOutageData>(
    (acc, [key, value]) => {
      const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : 0

      switch (normalizeOutageReasonKey(key)) {
        case 'electricityfailure':
        case 'electricalfailure':
        case 'powerfailure':
          acc.electricityFailure += numericValue
          break
        case 'pipelineleak':
        case 'pipelinebreak':
        case 'pipebreak':
          acc.pipelineLeak += numericValue
          break
        case 'pumpfailure':
          acc.pumpFailure += numericValue
          break
        case 'valveissue':
          acc.valveIssue += numericValue
          break
        case 'sourcedrying':
        case 'sourcedry':
          acc.sourceDrying += numericValue
          break
        default:
          break
      }

      return acc
    },
    { ...emptyOutageReasons }
  )
}

const toOutageDistributionData = (
  childRegions: OutageReasonsResponse['childRegions'] | undefined
): WaterSupplyOutageData[] => {
  if (!childRegions?.length) {
    return []
  }

  return childRegions.map((childRegion) => ({
    ...toOutageReasonsData(childRegion.outageReasonSchemeCount),
    label: childRegion.title,
  }))
}

export function CentralDashboard() {
  const { t, i18n } = useTranslation('dashboard')
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
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
    parseLocationId(effectiveSelectedGramPanchayat) ??
    parseLocationId(effectiveSelectedBlock) ??
    parseLocationId(effectiveSelectedDistrict) ??
    selectedRootOption?.locationId ??
    0
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
  const analyticsParams =
    hierarchyType !== 'LGD' || isVillageSelected || !selectedTenant?.tenantId
      ? null
      : {
          tenantId: selectedTenant.tenantId,
          parentLgdId: analyticsParentId,
          scope: 'child' as const,
          startDate: analyticsDateRange.startDate,
          endDate: analyticsDateRange.endDate,
        }
  const regularityAnalyticsParams =
    hierarchyType !== 'LGD' || isVillageSelected
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
  const parsedSelectedSchemeId = Number.parseInt(selectedScheme, 10)
  const selectedSchemeId = Number.isFinite(parsedSelectedSchemeId)
    ? parsedSelectedSchemeId
    : undefined
  const schemePerformanceAnalyticsParams = selectedTenant?.tenantId
    ? {
        tenantId: selectedTenant.tenantId,
        schemeId: selectedSchemeId,
      }
    : null
  const submissionStatusAnalyticsParams = {
    startDate: analyticsDateRange.startDate,
    endDate: analyticsDateRange.endDate,
  }
  const outageReasonsAnalyticsParams =
    isVillageSelected || !selectedTenant?.tenantId
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
  const previousAnalyticsRange = getPreviousPeriodRange(
    analyticsParams?.startDate ?? defaultAnalyticsRange.startDate,
    analyticsParams?.endDate ?? defaultAnalyticsRange.endDate
  )
  const previousWaterSupplyAnalyticsParams =
    analyticsParams === null
      ? null
      : {
          ...analyticsParams,
          scope: 'current' as const,
          startDate: previousAnalyticsRange.startDate,
          endDate: previousAnalyticsRange.endDate,
        }
  const currentWaterSupplyAnalyticsParams =
    analyticsParams === null
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
    enabled: true,
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
  const quantityPerformanceData = mapQuantityPerformanceFromAnalytics(
    averageWaterSupplyData,
    analyticsFallbackData
  )
  const regularityPerformanceData = mapRegularityPerformanceFromAnalytics(
    averageSchemeRegularityData,
    analyticsFallbackData
  )
  const supplySubmissionRateData = mapReadingSubmissionRateFromAnalytics(
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
  const overallPerformanceTableData = mapOverallPerformanceFromAnalytics(
    averageWaterSupplyData,
    averageSchemeRegularityData,
    overallPerformanceFallbackData,
    5
  )
  const currentWaterSupplyKpis = getWaterSupplyKpis(currentWaterSupplyKpiData, 5)
  const previousWaterSupplyKpis = getWaterSupplyKpis(previousWaterSupplyKpiData, 5)
  const currentRegularityKpi = getRegularityKpi(currentRegularityKpiData)
  const previousRegularityKpi = getRegularityKpi(previousRegularityKpiData)

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
    updateFilterUrl({ state: value })
  }
  const handleDistrictChange = (value: string) => {
    setActiveTrailIndex(null)
    updateFilterUrl({ state: selectedState, district: value })
  }
  const handleBlockChange = (value: string) => {
    setActiveTrailIndex(null)
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: value,
    })
  }
  const handleGramPanchayatChange = (value: string) => {
    setActiveTrailIndex(null)
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: selectedBlock,
      gramPanchayat: value,
    })
  }
  const handleVillageChange: Dispatch<SetStateAction<string>> = (value) => {
    setActiveTrailIndex(null)
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
    const stateOption = mockFilterStates.find(
      (option) => option.label.toLowerCase() === stateName.toLowerCase()
    )
    updateFilterUrl({ state: stateOption?.value ?? toStateSlug(stateName) })
  }

  const handleStateHover = (_stateId: string, _stateName: string, _metrics: unknown) => {
    // Hover tooltip is handled by ECharts
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
  const apiWaterSupplyOutageDistributionData = outageReasonsData?.childRegions?.length
    ? toOutageDistributionData(outageReasonsData.childRegions)
    : null
  const waterSupplyOutagesData = apiWaterSupplyOutageReasonsData ?? data.waterSupplyOutages
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
  const toTrendDirection = (value: number): 'up' | 'down' => (value < 0 ? 'down' : 'up')

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
          <Image src={waterTapIcon} alt="" boxSize="24px" />
        </Flex>
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
          <Icon as={MdOutlineWaterDrop} boxSize="22px" color="#2E90FA" />
        </Flex>
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
          <Icon as={LuClock3} boxSize="22px" color="#CA8A04" />
        </Flex>
      ),
    },
  ] as const
  const villagePumpOperators = [
    {
      name: 'Ajay Yadav',
      scheme: 'Rural Water Supply 001',
      stationLocation: 'Central Pumping Station',
      lastSubmission: '11-02-24, 1:00pm',
      reportingRate: '85%',
      missingSubmissionCount: '3',
      inactiveDays: '2',
    },
    {
      name: 'Vikram Singh',
      scheme: 'Rural Water Supply 002',
      stationLocation: 'North Pumping Station',
      lastSubmission: '13-02-24, 10:30am',
      reportingRate: '78%',
      missingSubmissionCount: '5',
      inactiveDays: '4',
    },
  ]
  const villagePumpOperatorDetails = villagePumpOperators[0]

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
  const villagePhotoEvidenceRows = data.readingCompliance

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
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={4} mb={6}>
        {coreMetrics.map((metric) => (
          <KPICard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
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
            h="710px"
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
            h="710px"
          >
            <Text textStyle="bodyText3" fontWeight="400" mb={4}>
              {t('overallPerformance.title', { defaultValue: 'Overall Performance' })}
            </Text>
            <OverallPerformanceTable
              data={overallPerformanceTableData}
              entityLabel={overallPerformanceEntityLabel}
              scrollMaxHeight="620px"
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
        villagePumpOperators={villagePumpOperators}
      />
    </Box>
  )
}

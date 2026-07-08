import type { NavigateFunction } from 'react-router-dom'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import type {
  EntityPerformance,
  NationalDashboardBoundaryResponse,
  NationalDashboardResponse,
  WaterSupplyOutageData,
} from '../types'
import type { TenantChildLocation } from '../services/api/dashboard-api'
import { ROUTES } from '@/shared/constants/routes'
import { INDIA_STATES, stateSlugToCode } from '@/shared/constants/states'
import { parseDisplayDateToIsoWithFallback } from '@/shared/utils/date-format'
import { slugify, toCapitalizedWords } from './format-location-label'
import { parseStableLocationValue, toStableLocationValue } from './stable-location-value'

export const CENTRAL_DASHBOARD_FILTER_STORAGE_KEY = 'central-dashboard-filters'

// A tenant is only accessible (drillable, selectable, shown with data) when its
// backend status is ACTIVE. Any other status (INACTIVE, ONBOARDED, CONFIGURED,
// SUSPENDED, DEGRADED, ARCHIVED) is treated as non-active: grayed on the national
// map and blocked from drilldown/URL/filter access.
export const isActiveTenantStatus = (status?: string): boolean => status === 'ACTIVE'

export type StoredFilters = {
  selectedState?: string
  selectedDistrict?: string
  selectedBlock?: string
  selectedGramPanchayat?: string
  selectedVillage?: string
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

export type FilterUrlUpdate = {
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

export type PerformanceTimeScaleTab = 'day' | 'week' | 'month' | 'quarter' | 'year'
export type OutageTimeScaleTab = 'day' | 'week' | 'month' | 'quarter' | 'year'

export type LocationScopedTrailIndex = {
  pathname: string
  search: string
  value: number | null
}

export type LocationOption = SearchableSelectOption & {
  locationId?: number
  analyticsId?: number
}

export const navigateWithUpdatedFilters = ({
  filters,
  navigate,
  searchParamsSnapshot,
  selectedState,
  singleTenantOverride,
}: {
  filters: FilterUrlUpdate
  navigate: NavigateFunction
  searchParamsSnapshot: string
  selectedState: string
  singleTenantOverride?: boolean
}) => {
  const forcedState = singleTenantOverride ? selectedState : (filters.state ?? '')
  const nextPath = singleTenantOverride
    ? ROUTES.DASHBOARD
    : forcedState
      ? `/${encodeURIComponent(stateSlugToCode(forcedState) ?? forcedState)}`
      : ROUTES.DASHBOARD
  const nextSearchParams = new URLSearchParams(searchParamsSnapshot)

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

export const parseLocationId = (value: string): number | undefined => {
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

export const parseAnalyticsLocationId = (
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

export const resolveLgdAnalyticsParentId = ({
  selectedVillage,
  selectedGramPanchayat,
  selectedBlock,
  selectedDistrict,
  villageOptions,
  gramPanchayatOptions,
  blockOptions,
  districtOptions,
  rootAnalyticsId,
}: {
  selectedVillage: string
  selectedGramPanchayat: string
  selectedBlock: string
  selectedDistrict: string
  villageOptions: LocationOption[]
  gramPanchayatOptions: LocationOption[]
  blockOptions: LocationOption[]
  districtOptions: LocationOption[]
  rootAnalyticsId?: number
}): number => {
  if (selectedVillage) {
    return parseAnalyticsLocationId(selectedVillage, villageOptions) ?? 0
  }

  if (selectedGramPanchayat) {
    return parseAnalyticsLocationId(selectedGramPanchayat, gramPanchayatOptions) ?? 0
  }

  if (selectedBlock) {
    return parseAnalyticsLocationId(selectedBlock, blockOptions) ?? 0
  }

  if (selectedDistrict) {
    return parseAnalyticsLocationId(selectedDistrict, districtOptions) ?? 0
  }

  return rootAnalyticsId ?? 0
}

export const toIsoDate = (date?: string | Date | null, dateFormat?: string): string | undefined => {
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

export const getDefaultAnalyticsDateRange = () => {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() - 1)
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 29)

  return {
    startDate: toIsoDate(startDate) ?? '',
    endDate: toIsoDate(endDate) ?? '',
  }
}

export const getStateLgdCode = (stateName?: string, stateCode?: string): number | undefined => {
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

export const mapNationalBoundariesToPerformance = (
  response: NationalDashboardBoundaryResponse | undefined,
  fallbackData: EntityPerformance[]
): EntityPerformance[] => {
  if (!response?.stateWiseBoundaries?.length) {
    return fallbackData
  }

  const fallbackById = new Map(fallbackData.map((item) => [item.id, item] as const))
  const fallbackByName = new Map(fallbackData.map((item) => [slugify(item.name), item] as const))

  return response.stateWiseBoundaries.map((region, index) => {
    const stateLgdCode = getStateLgdCode(region.stateTitle, region.stateCode)
    const fallbackMatch =
      fallbackById.get(String(region.tenantId)) ??
      (typeof stateLgdCode === 'number' ? fallbackById.get(String(stateLgdCode)) : undefined) ??
      fallbackByName.get(slugify(region.stateTitle))

    return {
      id: fallbackMatch?.id ?? String(region.tenantId || stateLgdCode || index),
      name: region.stateTitle || fallbackMatch?.name || `State ${index + 1}`,
      coverage: fallbackMatch?.coverage ?? 0,
      regularity: fallbackMatch?.regularity ?? -1,
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: fallbackMatch?.quantity ?? -1,
      compositeScore: fallbackMatch?.compositeScore ?? 0,
      status: fallbackMatch?.status ?? 'needs-attention',
      boundaryGeoJson: region.boundary ?? null,
    }
  })
}

export const getStoredFilters = (): StoredFilters => {
  if (typeof window === 'undefined') return {}
  try {
    const saved = window.localStorage.getItem(CENTRAL_DASHBOARD_FILTER_STORAGE_KEY)
    if (!saved) return {}
    const parsed = JSON.parse(saved) as StoredFilters
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    try {
      window.localStorage.removeItem(CENTRAL_DASHBOARD_FILTER_STORAGE_KEY)
    } catch {
      // Ignore storage errors (quota/private mode)
    }
    return {}
  }
}

export const parseStoredDateValue = (value: unknown, dateFormat?: string) => {
  const isoDate = toIsoDate(typeof value === 'string' ? value : undefined, dateFormat)
  if (!isoDate) {
    return null
  }

  const date = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export const getInitialStoredDuration = (
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
  if (endDate >= today) {
    return null
  }

  return storedDuration
}

export const toStateSlug = (stateName: string) =>
  stateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const findLocationOption = (
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

export const mapLocationOptions = (
  locations: TenantChildLocation[] | undefined
): LocationOption[] => {
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

export const getOutageReasonCount = (distribution: Record<string, number>, keys: string[]) =>
  keys.reduce((total, key) => {
    const value = distribution[key]
    return total + (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  }, 0)

export const toOutageReasonsData = (distribution: Record<string, number>) => ({
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

export const toOutageDistributionData = (
  childRegions: Array<{ title: string; outageReasonSchemeCount: Record<string, number> }>
) =>
  childRegions.map((region) => ({
    ...toOutageReasonsData(region.outageReasonSchemeCount),
    label: toCapitalizedWords(region.title),
  }))

export const sortByMetricDescending = (
  data: EntityPerformance[],
  metric: 'quantity' | 'regularity'
): EntityPerformance[] =>
  [...data].sort((left, right) => {
    const metricDelta = (right[metric] ?? 0) - (left[metric] ?? 0)
    if (metricDelta !== 0) {
      return metricDelta
    }
    return left.name.localeCompare(right.name)
  })

const getTotalOutages = (row: {
  reasons?: Record<string, number>
  electricityFailure?: number
  pipelineLeak?: number
  pumpFailure?: number
  valveIssue?: number
  sourceDrying?: number
}) => {
  const reasonsTotal = Object.values(row.reasons ?? {}).reduce(
    (total, value) => total + (typeof value === 'number' && Number.isFinite(value) ? value : 0),
    0
  )
  if (reasonsTotal > 0) {
    return reasonsTotal
  }

  return (
    (row.electricityFailure ?? 0) +
    (row.pipelineLeak ?? 0) +
    (row.pumpFailure ?? 0) +
    (row.valveIssue ?? 0) +
    (row.sourceDrying ?? 0)
  )
}

export const sortOutageDistributionByTotalDescending = (data: WaterSupplyOutageData[]) =>
  [...data].sort((left, right) => {
    const totalDelta = getTotalOutages(right) - getTotalOutages(left)
    if (totalDelta !== 0) {
      return totalDelta
    }
    return left.label.localeCompare(right.label)
  })

export const filterNationalDashboardByTenantIds = (
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

export const filterNationalDashboardBoundariesByTenantIds = (
  response: NationalDashboardBoundaryResponse | undefined,
  activeTenantIds: Set<number>
): NationalDashboardBoundaryResponse | undefined => {
  if (!response || activeTenantIds.size === 0) {
    return response
  }

  return {
    ...response,
    stateWiseBoundaries: response.stateWiseBoundaries.filter((state) =>
      activeTenantIds.has(state.tenantId)
    ),
  }
}

export const resolvePositiveNumber = (value: unknown, fallback: number) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback
}

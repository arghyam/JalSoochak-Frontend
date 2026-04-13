import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  EntityPerformance,
  NationalDashboardResponse,
  PumpOperatorPerformanceData,
  PumpOperatorsData,
  ReadingSubmissionStatusData,
  ReadingSubmissionRateResponse,
  SchemePerformanceResponse,
  SchemeRegularityPeriodicResponse,
  SubmissionStatusResponse,
  TenantBoundaryResponse,
  GeoJsonGeometry,
  WaterQuantityPeriodicResponse,
  WaterSupplyOutageData,
  WaterQuantityRegionWiseResponse,
} from '../types'
import {
  getLocationTitleFromLookup,
  type LocationTitleLookup,
} from '../services/query/location-title-lookup'
import { slugify, toCapitalizedWords } from './format-location-label'

const DEFAULT_DAYS_IN_RANGE = 30
const MILLION_LITERS = 1_000_000
export const DEFAULT_PERSONS_PER_HOUSEHOLD = 5
export const DEFAULT_LITERS_PER_PERSON_PER_DAY = 50

const isFiniteNumber = (value: number) => Number.isFinite(value)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const getSchemeAchievedFhtcCount = (
  scheme: AverageWaterSupplyPerRegionResponse['schemes'][number]
) => scheme.totalAchievedFhtcCount ?? scheme.achievedFhtcCount ?? 0

const getChildRegionAchievedFhtcCount = (
  region: AverageWaterSupplyPerRegionResponse['childRegions'][number]
) => region.totalAchievedFhtcCount ?? 0

const getNationalAchievedFhtcCount = (
  state: NationalDashboardResponse['stateWiseQuantityPerformance'][number]
) => state.totalAchievedFhtcCount ?? state.totalFhtcCount ?? state.totalHouseholdCount ?? 0

const getNationalDemandFhtcCount = (
  state: NationalDashboardResponse['stateWiseQuantityPerformance'][number]
) =>
  state.totalAchievedFhtcCount ??
  state.totalFhtcCount ??
  state.totalPlannedFhtcCount ??
  state.totalPlannedFhtc ??
  state.totalHouseholdCount ??
  0

const parseIsoDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const resolveMetricDaysInRange = (startDate?: string, endDate?: string) =>
  parseIsoDate(startDate) && parseIsoDate(endDate) ? resolveDaysInRange(0, startDate, endDate) : 0

export const resolveDaysInRange = (
  daysInRange?: number,
  startDate?: string,
  endDate?: string
): number => {
  if (typeof daysInRange === 'number' && daysInRange > 0) {
    return daysInRange
  }

  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  if (start && end) {
    const diff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
    if (diff > 0) {
      return diff
    }
  }

  return DEFAULT_DAYS_IN_RANGE
}

export const getPreviousPeriodRange = (startDate: string, endDate: string) => {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  const daysInRange = resolveDaysInRange(undefined, startDate, endDate)

  if (!start || !end) {
    const today = new Date()
    const previousEnd = new Date(today)
    previousEnd.setDate(today.getDate() - 30)
    const previousStart = new Date(previousEnd)
    previousStart.setDate(previousEnd.getDate() - (daysInRange - 1))

    return {
      startDate: `${previousStart.getFullYear()}-${String(previousStart.getMonth() + 1).padStart(2, '0')}-${String(previousStart.getDate()).padStart(2, '0')}`,
      endDate: `${previousEnd.getFullYear()}-${String(previousEnd.getMonth() + 1).padStart(2, '0')}-${String(previousEnd.getDate()).padStart(2, '0')}`,
    }
  }

  const previousEnd = new Date(start)
  previousEnd.setDate(start.getDate() - 1)
  const previousStart = new Date(previousEnd)
  previousStart.setDate(previousEnd.getDate() - (daysInRange - 1))

  const toIsoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  return {
    startDate: toIsoDate(previousStart),
    endDate: toIsoDate(previousEnd),
  }
}

export const calculateQuantityMld = (
  totalWaterSuppliedLiters: number,
  daysInRange: number
): number => {
  if (
    !isFiniteNumber(totalWaterSuppliedLiters) ||
    totalWaterSuppliedLiters <= 0 ||
    daysInRange <= 0
  ) {
    return 0
  }

  return Number((totalWaterSuppliedLiters / daysInRange / MILLION_LITERS).toFixed(2))
}

export const calculateQuantityLpcd = (
  totalWaterSuppliedLiters: number,
  servedConnectionCount: number,
  daysInRange: number,
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
): number => {
  if (
    !isFiniteNumber(totalWaterSuppliedLiters) ||
    !isFiniteNumber(servedConnectionCount) ||
    !isFiniteNumber(averagePersonsPerHousehold) ||
    totalWaterSuppliedLiters <= 0 ||
    servedConnectionCount <= 0 ||
    averagePersonsPerHousehold <= 0 ||
    daysInRange <= 0
  ) {
    return 0
  }

  return Number(
    (
      totalWaterSuppliedLiters /
      (servedConnectionCount * averagePersonsPerHousehold * daysInRange)
    ).toFixed(1)
  )
}

export const calculateDemandMld = (
  servedConnectionCount: number,
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD,
  litersPerPersonPerDay = DEFAULT_LITERS_PER_PERSON_PER_DAY
): number => {
  if (
    !isFiniteNumber(servedConnectionCount) ||
    !isFiniteNumber(averagePersonsPerHousehold) ||
    !isFiniteNumber(litersPerPersonPerDay) ||
    servedConnectionCount <= 0 ||
    averagePersonsPerHousehold <= 0 ||
    litersPerPersonPerDay <= 0
  ) {
    return 0
  }

  return Number(
    (
      (servedConnectionCount * averagePersonsPerHousehold * litersPerPersonPerDay) /
      MILLION_LITERS
    ).toFixed(2)
  )
}

export const calculateAverageRegularityPercent = (
  totalSupplyDays: number,
  schemeCount: number,
  daysInRange: number
): number => {
  if (
    !isFiniteNumber(totalSupplyDays) ||
    !isFiniteNumber(schemeCount) ||
    totalSupplyDays <= 0 ||
    schemeCount <= 0 ||
    daysInRange <= 0
  ) {
    return 0
  }

  return Number(clamp((totalSupplyDays / (schemeCount * daysInRange)) * 100, 0, 100).toFixed(1))
}

export const calculateReadingSubmissionRatePercent = (
  totalSubmissionDays: number,
  schemeCount: number,
  daysInRange: number
): number => {
  if (
    !isFiniteNumber(totalSubmissionDays) ||
    !isFiniteNumber(schemeCount) ||
    totalSubmissionDays <= 0 ||
    schemeCount <= 0 ||
    daysInRange <= 0
  ) {
    return 0
  }

  return Number(clamp((totalSubmissionDays / (schemeCount * daysInRange)) * 100, 0, 100).toFixed(1))
}

const sumWaterSupplyField = (
  response: AverageWaterSupplyPerRegionResponse | undefined,
  field: 'totalWaterSuppliedLiters' | 'totalAchievedFhtcCount'
) => {
  if (!response) {
    return 0
  }

  if (response.childRegions?.length) {
    if (field === 'totalWaterSuppliedLiters') {
      return response.childRegions.reduce(
        (total, region) => total + (region.totalWaterSuppliedLiters ?? 0),
        0
      )
    }

    return response.childRegions.reduce(
      (total, region) => total + getChildRegionAchievedFhtcCount(region),
      0
    )
  }

  if (!response.schemes?.length) {
    return 0
  }

  return response.schemes.reduce((total, scheme) => {
    if (field === 'totalWaterSuppliedLiters') {
      return total + (scheme.totalWaterSuppliedLiters ?? 0)
    }

    return total + getSchemeAchievedFhtcCount(scheme)
  }, 0)
}

export const hasWaterSupplyData = (response: AverageWaterSupplyPerRegionResponse | undefined) =>
  sumWaterSupplyField(response, 'totalWaterSuppliedLiters') > 0

export const getWaterSupplyKpis = (
  response: AverageWaterSupplyPerRegionResponse | undefined,
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
) => {
  if (!response) {
    return { quantityMld: 0, quantityLpcd: 0 }
  }

  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)
  const totalWaterSuppliedLiters = sumWaterSupplyField(response, 'totalWaterSuppliedLiters')
  const servedConnectionCount = sumWaterSupplyField(response, 'totalAchievedFhtcCount')

  return {
    quantityMld: calculateQuantityMld(totalWaterSuppliedLiters, daysInRange),
    quantityLpcd: calculateQuantityLpcd(
      totalWaterSuppliedLiters,
      servedConnectionCount,
      daysInRange,
      averagePersonsPerHousehold
    ),
  }
}

export const getWaterSupplyKpisFromNationalDashboard = (
  response: NationalDashboardResponse | undefined,
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
) => {
  if (!response?.stateWiseQuantityPerformance?.length) {
    return { quantityMld: 0, quantityLpcd: 0 }
  }

  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)
  const totals = response.stateWiseQuantityPerformance.reduce(
    (acc, state) => ({
      totalWaterSuppliedLiters:
        acc.totalWaterSuppliedLiters + (state.totalWaterSuppliedLiters ?? 0),
      totalServedConnections: acc.totalServedConnections + getNationalAchievedFhtcCount(state),
    }),
    { totalWaterSuppliedLiters: 0, totalServedConnections: 0 }
  )

  return {
    quantityMld: calculateQuantityMld(totals.totalWaterSuppliedLiters, daysInRange),
    quantityLpcd: calculateQuantityLpcd(
      totals.totalWaterSuppliedLiters,
      totals.totalServedConnections,
      daysInRange,
      averagePersonsPerHousehold
    ),
  }
}

export const getRegularityKpi = (response: AverageSchemeRegularityResponse | undefined) => {
  if (!response) {
    return 0
  }

  if (response.childRegions?.length) {
    const valid = response.childRegions.filter((r) => Number.isFinite(r.averageRegularity))
    if (!valid.length) {
      return 0
    }
    const sum = valid.reduce((acc, r) => acc + r.averageRegularity, 0)
    return Number(clamp((sum / valid.length) * 100, 0, 100).toFixed(1))
  }

  if (Number.isFinite(response.averageRegularity)) {
    return Number(clamp(response.averageRegularity * 100, 0, 100).toFixed(1))
  }

  return 0
}

export const getRegularityKpiFromNationalDashboard = (
  response: NationalDashboardResponse | undefined
) => {
  if (!response?.stateWiseRegularity?.length) {
    return 0
  }

  const validStates = response.stateWiseRegularity.filter((state) =>
    Number.isFinite(state.averageRegularity)
  )
  if (!validStates.length) {
    return 0
  }

  const sum = validStates.reduce((acc, state) => acc + state.averageRegularity, 0)
  return Number(clamp((sum / validStates.length) * 100, 0, 100).toFixed(1))
}

export const getWaterSupplyKpisFromPeriodic = (
  response: WaterQuantityPeriodicResponse | undefined,
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
) => {
  if (!response?.metrics?.length) {
    return { quantityMld: 0, quantityLpcd: 0 }
  }

  const totals = response.metrics.reduce(
    (acc, metric) => {
      const metricDays = resolveMetricDaysInRange(metric.periodStartDate, metric.periodEndDate)
      const waterQuantity = Number(metric.averageWaterQuantity ?? 0)
      const chosenAchievedFhtcCount = Number(
        metric.totalAchievedFhtcCount ?? metric.achievedFhtcCount ?? 0
      )

      if (!isFiniteNumber(waterQuantity) || metricDays <= 0) {
        return acc
      }

      return {
        totalWaterSuppliedLiters: acc.totalWaterSuppliedLiters + waterQuantity * metricDays,
        totalServedConnectionsDays:
          acc.totalServedConnectionsDays +
          (isFiniteNumber(chosenAchievedFhtcCount) && chosenAchievedFhtcCount > 0
            ? chosenAchievedFhtcCount
            : 0) *
            metricDays,
        totalDays: acc.totalDays + metricDays,
      }
    },
    { totalWaterSuppliedLiters: 0, totalServedConnectionsDays: 0, totalDays: 0 }
  )

  if (totals.totalDays <= 0) {
    return { quantityMld: 0, quantityLpcd: 0 }
  }

  return {
    quantityMld: calculateQuantityMld(totals.totalWaterSuppliedLiters, totals.totalDays),
    quantityLpcd:
      totals.totalServedConnectionsDays > 0 &&
      Number.isFinite(averagePersonsPerHousehold) &&
      averagePersonsPerHousehold > 0
        ? Number(
            (
              totals.totalWaterSuppliedLiters /
              (totals.totalServedConnectionsDays * averagePersonsPerHousehold)
            ).toFixed(1)
          )
        : 0,
  }
}

export const getRegularityKpiFromPeriodic = (
  response: SchemeRegularityPeriodicResponse | undefined
) => {
  if (!response?.metrics?.length) {
    return 0
  }

  const valid = response.metrics.filter((m) => isFiniteNumber(Number(m.averageRegularity ?? NaN)))
  if (!valid.length) {
    return 0
  }

  const sum = valid.reduce((acc, m) => acc + Number(m.averageRegularity), 0)
  return Number((sum / valid.length).toFixed(1))
}

export const calculatePercentChange = (currentValue: number, previousValue: number) => {
  if (!isFiniteNumber(currentValue) || !isFiniteNumber(previousValue)) {
    return 0
  }

  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 100
  }

  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1))
}

export const calculateAbsoluteChange = (currentValue: number, previousValue: number) =>
  Number((currentValue - previousValue).toFixed(1))

const mapFallbackByName = (fallbackData: EntityPerformance[]) =>
  new Map(fallbackData.map((item) => [slugify(item.name), item] as const))

const GENERIC_REGION_NAME_PATTERN = /^Region\s+\d+$/i

const formatEntityName = (primaryName?: string, fallbackName?: string, defaultName?: string) => {
  const resolvedName = primaryName || fallbackName || defaultName || ''
  return toCapitalizedWords(resolvedName)
}

const isGenericRegionName = (value?: string | null) => {
  const trimmedValue = value?.trim()
  return !trimmedValue || GENERIC_REGION_NAME_PATTERN.test(trimmedValue)
}

type LocationLabelOption = {
  locationId?: number
  label: string
}

const mapFallbackById = (fallbackData: EntityPerformance[]) =>
  new Map(fallbackData.map((item) => [item.id, item] as const))

const mapLocationOptionsById = (locationOptions: LocationLabelOption[]) =>
  new Map(
    locationOptions.flatMap((option) =>
      typeof option.locationId === 'number' ? [[option.locationId, option] as const] : []
    )
  )

const mapLocationOptionsByName = (locationOptions: LocationLabelOption[]) =>
  new Map(
    locationOptions
      .filter((option) => !isGenericRegionName(option.label))
      .map((option) => [slugify(option.label), option] as const)
  )

const getTenantBoundaryRegionId = (
  region: TenantBoundaryResponse['childRegions'][number],
  index: number
) => {
  if (typeof region.childDepartmentId === 'number' && Number.isFinite(region.childDepartmentId)) {
    return String(region.childDepartmentId)
  }

  if (typeof region.childLgdId === 'number' && Number.isFinite(region.childLgdId)) {
    return String(region.childLgdId)
  }

  return `tenant-boundary-${index}`
}

export const mapTenantBoundariesToPerformance = (
  response: TenantBoundaryResponse | undefined,
  fallbackData: EntityPerformance[],
  locationOptions: LocationLabelOption[] = [],
  regularityAnalytics?: AverageSchemeRegularityResponse,
  quantityAnalytics?: WaterQuantityRegionWiseResponse,
  waterSupplyAnalytics?: AverageWaterSupplyPerRegionResponse
): EntityPerformance[] => {
  if (!response?.childRegions?.length) {
    return []
  }

  const fallbackById = mapFallbackById(fallbackData)
  const fallbackByName = mapFallbackByName(fallbackData)
  const locationOptionsById = mapLocationOptionsById(locationOptions)
  const locationOptionsByName = mapLocationOptionsByName(locationOptions)
  const regularityById = new Map<string, number>()
  const regularityByName = new Map<string, number>()
  const quantityById = new Map<string, number>()
  const quantityByName = new Map<string, number>()
  const quantityNoDataById = new Set<string>()
  const quantityNoDataByName = new Set<string>()
  const schemeCountById = new Map<string, number>()
  const schemeCountByName = new Map<string, number>()

  const regularityDaysInRange = resolveDaysInRange(
    regularityAnalytics?.daysInRange,
    regularityAnalytics?.startDate,
    regularityAnalytics?.endDate
  )

  ;(regularityAnalytics?.childRegions ?? []).forEach((region) => {
    const regularityPercent =
      Number.isFinite(region.totalSupplyDays) &&
      region.totalSupplyDays > 0 &&
      Number.isFinite(region.schemeCount) &&
      region.schemeCount > 0 &&
      regularityDaysInRange > 0
        ? calculateAverageRegularityPercent(
            region.totalSupplyDays,
            region.schemeCount,
            regularityDaysInRange
          )
        : typeof region.averageRegularity === 'number' && Number.isFinite(region.averageRegularity)
          ? Number((region.averageRegularity * 100).toFixed(1))
          : 0
    const titleKey = slugify(region.title)
    if (titleKey) {
      regularityByName.set(titleKey, regularityPercent)
    }

    if (typeof region.departmentId === 'number' && region.departmentId > 0) {
      regularityById.set(String(region.departmentId), regularityPercent)
    }
    if (typeof region.lgdId === 'number' && region.lgdId > 0) {
      regularityById.set(String(region.lgdId), regularityPercent)
    }
  })

  const quantityDaysInRange = resolveDaysInRange(
    quantityAnalytics?.daysInRange ?? regularityAnalytics?.daysInRange,
    quantityAnalytics?.startDate ?? regularityAnalytics?.startDate,
    quantityAnalytics?.endDate ?? regularityAnalytics?.endDate
  )

  ;(waterSupplyAnalytics?.childRegions ?? []).forEach((region) => {
    const schemeCount = Number(region.schemeCount)
    if (!Number.isFinite(schemeCount) || schemeCount <= 0) {
      return
    }

    const titleKey = slugify(region.title)
    if (titleKey) {
      schemeCountByName.set(titleKey, schemeCount)
    }

    if (typeof region.departmentId === 'number' && region.departmentId > 0) {
      schemeCountById.set(String(region.departmentId), schemeCount)
    }
    if (typeof region.lgdId === 'number' && region.lgdId > 0) {
      schemeCountById.set(String(region.lgdId), schemeCount)
    }
  })
  ;(quantityAnalytics?.childRegions ?? []).forEach((region) => {
    const titleKey = slugify(region.title)
    const schemeCountRaw = Number(region.schemeCount)
    const schemeCountLookup =
      (typeof region.departmentId === 'number' && region.departmentId > 0
        ? schemeCountById.get(String(region.departmentId))
        : undefined) ??
      (typeof region.lgdId === 'number' && region.lgdId > 0
        ? schemeCountById.get(String(region.lgdId))
        : undefined) ??
      (titleKey ? schemeCountByName.get(titleKey) : undefined)
    const schemeCount =
      Number.isFinite(schemeCountRaw) && schemeCountRaw > 0
        ? schemeCountRaw
        : typeof schemeCountLookup === 'number'
          ? schemeCountLookup
          : Number.NaN
    const supplyDays = Number(region.supplyDaysInEfficientRange)

    const quantityPercent =
      Number.isFinite(schemeCount) &&
      schemeCount > 0 &&
      Number.isFinite(supplyDays) &&
      supplyDays >= 0 &&
      quantityDaysInRange > 0
        ? Number(((supplyDays / (quantityDaysInRange * schemeCount)) * 100).toFixed(1))
        : null

    const idCandidates = [
      typeof region.departmentId === 'number' && region.departmentId > 0
        ? String(region.departmentId)
        : '',
      typeof region.lgdId === 'number' && region.lgdId > 0 ? String(region.lgdId) : '',
    ].filter(Boolean)

    if (quantityPercent == null) {
      idCandidates.forEach((id) => quantityNoDataById.add(id))
      if (titleKey) quantityNoDataByName.add(titleKey)
      return
    }

    idCandidates.forEach((id) => quantityById.set(id, quantityPercent))
    if (titleKey) quantityByName.set(titleKey, quantityPercent)
  })

  return response.childRegions.map((region, index) => {
    const regionTitle =
      region.childLgdTitle ?? region.childDepartmentTitle ?? region.childLgdCName ?? ''
    const regionLocationId =
      typeof region.childDepartmentId === 'number'
        ? region.childDepartmentId
        : typeof region.childLgdId === 'number'
          ? region.childLgdId
          : undefined
    const matchedLocationOption =
      (typeof regionLocationId === 'number'
        ? locationOptionsById.get(regionLocationId)
        : undefined) ??
      (!isGenericRegionName(regionTitle)
        ? locationOptionsByName.get(slugify(regionTitle))
        : undefined) ??
      locationOptions[index]
    const locationId = regionLocationId ?? matchedLocationOption?.locationId
    const locationLabel = matchedLocationOption?.label
    const fallbackMatch =
      (typeof locationId === 'number' ? fallbackById.get(String(locationId)) : undefined) ??
      (!isGenericRegionName(regionTitle) ? fallbackByName.get(slugify(regionTitle)) : undefined) ??
      (!isGenericRegionName(locationLabel)
        ? fallbackByName.get(slugify(locationLabel ?? ''))
        : undefined) ??
      fallbackData[index]
    const preferredRegionName = !isGenericRegionName(regionTitle)
      ? regionTitle
      : !isGenericRegionName(locationLabel)
        ? locationLabel
        : !isGenericRegionName(fallbackMatch?.name)
          ? fallbackMatch?.name
          : undefined

    const preferredRegularity = (() => {
      const regionIdCandidate =
        typeof locationId === 'number'
          ? String(locationId)
          : typeof regionLocationId === 'number'
            ? String(regionLocationId)
            : undefined
      const titleCandidate = !isGenericRegionName(regionTitle) ? slugify(regionTitle) : ''
      const labelCandidate = !isGenericRegionName(locationLabel) ? slugify(locationLabel ?? '') : ''

      const fromAnalytics =
        (regionIdCandidate ? regularityById.get(regionIdCandidate) : undefined) ??
        (titleCandidate ? regularityByName.get(titleCandidate) : undefined) ??
        (labelCandidate ? regularityByName.get(labelCandidate) : undefined)

      if (typeof fromAnalytics === 'number') {
        return fromAnalytics
      }

      if (typeof region.averageSchemeRegularity === 'number') {
        return Number((region.averageSchemeRegularity * 100).toFixed(1))
      }

      return 0
    })()

    const preferredQuantity = (() => {
      if (quantityAnalytics?.childRegions?.length) {
        const regionIdCandidate =
          typeof locationId === 'number'
            ? String(locationId)
            : typeof regionLocationId === 'number'
              ? String(regionLocationId)
              : undefined
        const titleCandidate = !isGenericRegionName(regionTitle) ? slugify(regionTitle) : ''
        const labelCandidate = !isGenericRegionName(locationLabel)
          ? slugify(locationLabel ?? '')
          : ''

        const fromNoData =
          (regionIdCandidate ? quantityNoDataById.has(regionIdCandidate) : false) ||
          (titleCandidate ? quantityNoDataByName.has(titleCandidate) : false) ||
          (labelCandidate ? quantityNoDataByName.has(labelCandidate) : false)

        if (fromNoData) {
          return -1
        }

        const fromAnalytics =
          (regionIdCandidate ? quantityById.get(regionIdCandidate) : undefined) ??
          (titleCandidate ? quantityByName.get(titleCandidate) : undefined) ??
          (labelCandidate ? quantityByName.get(labelCandidate) : undefined)

        if (typeof fromAnalytics === 'number' && Number.isFinite(fromAnalytics)) {
          return fromAnalytics
        }

        return -1
      }

      return -1
    })()

    return {
      id: fallbackMatch?.id ?? getTenantBoundaryRegionId(region, index),
      name: formatEntityName(preferredRegionName, undefined, `Region ${index + 1}`),
      coverage: fallbackMatch?.coverage ?? 0,
      regularity: preferredRegularity,
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: preferredQuantity,
      compositeScore:
        fallbackMatch?.compositeScore ??
        (typeof region.averagePerformanceScore === 'number'
          ? Number((region.averagePerformanceScore * 100).toFixed(1))
          : 0),
      status: fallbackMatch?.status ?? 'needs-attention',
      boundaryGeoJson: (region.boundaryGeoJson as GeoJsonGeometry | null | undefined) ?? null,
    }
  })
}

export const mapQuantityPerformanceFromAnalytics = (
  response: AverageWaterSupplyPerRegionResponse | undefined,
  fallbackData: EntityPerformance[],
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD,
  litersPerPersonPerDay = DEFAULT_LITERS_PER_PERSON_PER_DAY
): EntityPerformance[] => {
  if (!response?.childRegions?.length) {
    return []
  }

  const childRegions = response.childRegions
  const fallbackByName = mapFallbackByName(fallbackData)
  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)

  return childRegions.map((region, index) => {
    const fallbackMatch = fallbackByName.get(slugify(region.title)) ?? fallbackData[index]

    return {
      id:
        fallbackMatch?.id ??
        `quantity-performance-${index}-${slugify(region.title || String(index))}`,
      name: formatEntityName(region.title, fallbackMatch?.name, `Region ${index + 1}`),
      coverage: calculateDemandMld(
        getChildRegionAchievedFhtcCount(region),
        averagePersonsPerHousehold,
        litersPerPersonPerDay
      ),
      regularity: fallbackMatch?.regularity ?? 0,
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: calculateQuantityMld(region.totalWaterSuppliedLiters, daysInRange),
      compositeScore: fallbackMatch?.compositeScore ?? 0,
      status: fallbackMatch?.status ?? 'needs-attention',
    }
  })
}

export const mapRegularityPerformanceFromAnalytics = (
  response: AverageSchemeRegularityResponse | undefined,
  fallbackData: EntityPerformance[]
): EntityPerformance[] => {
  if (!response?.childRegions?.length) {
    return []
  }

  const childRegions = response.childRegions
  const fallbackByName = mapFallbackByName(fallbackData)
  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)

  return childRegions.map((region, index) => {
    const fallbackMatch = fallbackByName.get(slugify(region.title)) ?? fallbackData[index]

    return {
      id:
        fallbackMatch?.id ??
        `regularity-performance-${index}-${slugify(region.title || String(index))}`,
      name: formatEntityName(region.title, fallbackMatch?.name, `Region ${index + 1}`),
      coverage: fallbackMatch?.coverage ?? 0,
      regularity: calculateAverageRegularityPercent(
        region.totalSupplyDays,
        region.schemeCount,
        daysInRange
      ),
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: fallbackMatch?.quantity ?? 0,
      compositeScore: fallbackMatch?.compositeScore ?? 0,
      status: fallbackMatch?.status ?? 'needs-attention',
    }
  })
}

export const mapReadingSubmissionRateFromAnalytics = (
  response: ReadingSubmissionRateResponse | undefined,
  fallbackData: EntityPerformance[]
): EntityPerformance[] => {
  if (!response?.childRegions?.length) {
    return []
  }

  const fallbackByName = mapFallbackByName(fallbackData)
  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)

  return response.childRegions.map((region, index) => {
    const fallbackMatch = fallbackByName.get(slugify(region.title)) ?? fallbackData[index]

    return {
      id:
        fallbackMatch?.id ??
        `reading-submission-rate-${index}-${slugify(region.title || String(index))}`,
      name: formatEntityName(region.title, fallbackMatch?.name, `Region ${index + 1}`),
      coverage: fallbackMatch?.coverage ?? 0,
      regularity: calculateReadingSubmissionRatePercent(
        region.totalSubmissionDays,
        region.schemeCount,
        daysInRange
      ),
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: fallbackMatch?.quantity ?? 0,
      compositeScore: fallbackMatch?.compositeScore ?? 0,
      status: fallbackMatch?.status ?? 'needs-attention',
    }
  })
}

const mapNationalFallbackMatch = (
  fallbackData: EntityPerformance[],
  title: string,
  index: number
) => {
  const fallbackByName = mapFallbackByName(fallbackData)
  return fallbackByName.get(slugify(title)) ?? fallbackData[index]
}

export const mapQuantityPerformanceFromNationalDashboard = (
  response: NationalDashboardResponse | undefined,
  fallbackData: EntityPerformance[],
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD,
  litersPerPersonPerDay = DEFAULT_LITERS_PER_PERSON_PER_DAY,
  resolveDemandInputs?: (
    state: NationalDashboardResponse['stateWiseQuantityPerformance'][number]
  ) =>
    | {
        averagePersonsPerHousehold?: number
        litersPerPersonPerDay?: number
      }
    | undefined
): EntityPerformance[] => {
  if (!response?.stateWiseQuantityPerformance?.length) {
    return []
  }

  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)

  return response.stateWiseQuantityPerformance.map((state, index) => {
    const fallbackMatch = mapNationalFallbackMatch(fallbackData, state.stateTitle, index)
    const demandInputs = resolveDemandInputs?.(state)
    const demandAveragePersonsPerHousehold = demandInputs?.averagePersonsPerHousehold
    const demandLitersPerPersonPerDay = demandInputs?.litersPerPersonPerDay
    const resolvedAveragePersonsPerHousehold =
      typeof demandAveragePersonsPerHousehold === 'number' &&
      Number.isFinite(demandAveragePersonsPerHousehold) &&
      demandAveragePersonsPerHousehold > 0
        ? demandAveragePersonsPerHousehold
        : averagePersonsPerHousehold
    const resolvedLitersPerPersonPerDay =
      typeof demandLitersPerPersonPerDay === 'number' &&
      Number.isFinite(demandLitersPerPersonPerDay) &&
      demandLitersPerPersonPerDay > 0
        ? demandLitersPerPersonPerDay
        : litersPerPersonPerDay

    return {
      id: fallbackMatch?.id ?? `national-quantity-${state.stateCode || index}`,
      name: formatEntityName(state.stateTitle, fallbackMatch?.name, `State ${index + 1}`),
      coverage: calculateDemandMld(
        getNationalDemandFhtcCount(state),
        resolvedAveragePersonsPerHousehold,
        resolvedLitersPerPersonPerDay
      ),
      regularity: fallbackMatch?.regularity ?? 0,
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: calculateQuantityMld(state.totalWaterSuppliedLiters, daysInRange),
      compositeScore: fallbackMatch?.compositeScore ?? 0,
      status: fallbackMatch?.status ?? 'needs-attention',
    }
  })
}

export const mapRegularityPerformanceFromNationalDashboard = (
  response: NationalDashboardResponse | undefined,
  fallbackData: EntityPerformance[]
): EntityPerformance[] => {
  if (!response?.stateWiseRegularity?.length) {
    return []
  }

  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)

  return response.stateWiseRegularity.map((state, index) => {
    const fallbackMatch = mapNationalFallbackMatch(fallbackData, state.stateTitle, index)

    return {
      id: fallbackMatch?.id ?? `national-regularity-${state.stateCode || index}`,
      name: formatEntityName(state.stateTitle, fallbackMatch?.name, `State ${index + 1}`),
      coverage: fallbackMatch?.coverage ?? 0,
      regularity: calculateAverageRegularityPercent(
        state.totalSupplyDays,
        state.schemeCount,
        daysInRange
      ),
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: fallbackMatch?.quantity ?? 0,
      compositeScore: fallbackMatch?.compositeScore ?? 0,
      status: fallbackMatch?.status ?? 'needs-attention',
    }
  })
}

export const mapReadingSubmissionRateFromNationalDashboard = (
  response: NationalDashboardResponse | undefined,
  fallbackData: EntityPerformance[]
): EntityPerformance[] => {
  if (!response?.stateWiseReadingSubmissionRate?.length) {
    return []
  }

  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)

  return response.stateWiseReadingSubmissionRate.map((state, index) => {
    const fallbackMatch = mapNationalFallbackMatch(fallbackData, state.stateTitle, index)

    return {
      id: fallbackMatch?.id ?? `national-submission-rate-${state.stateCode || index}`,
      name: formatEntityName(state.stateTitle, fallbackMatch?.name, `State ${index + 1}`),
      coverage: fallbackMatch?.coverage ?? 0,
      regularity: calculateReadingSubmissionRatePercent(
        state.totalSubmissionDays,
        state.schemeCount,
        daysInRange
      ),
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: fallbackMatch?.quantity ?? 0,
      compositeScore: fallbackMatch?.compositeScore ?? 0,
      status: fallbackMatch?.status ?? 'needs-attention',
    }
  })
}

const getOutageReasonCount = (distribution: Record<string, number>, keys: string[]) => {
  return keys.reduce((total, key) => {
    const value = distribution[key]
    return total + (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  }, 0)
}

export const mapOutageReasonsFromNationalDashboard = (
  response: NationalDashboardResponse | undefined,
  _fallbackData: WaterSupplyOutageData[]
): WaterSupplyOutageData[] => {
  if (!response?.overallOutageReasonDistribution) {
    return []
  }

  if (Object.keys(response.overallOutageReasonDistribution).length === 0) {
    return []
  }

  const distribution = response.overallOutageReasonDistribution
  const mappedData: WaterSupplyOutageData = {
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
  }

  const totalMappedCount =
    mappedData.electricityFailure +
    mappedData.pipelineLeak +
    mappedData.pumpFailure +
    mappedData.valveIssue +
    mappedData.sourceDrying

  if (Number.isNaN(totalMappedCount)) {
    return []
  }

  return [mappedData]
}

export const mapReadingSubmissionStatusFromAnalytics = (
  response: SubmissionStatusResponse | undefined,
  _fallbackData: ReadingSubmissionStatusData[]
): ReadingSubmissionStatusData[] => {
  if (!response) {
    return []
  }

  const compliantCount = response.compliantSubmissionCount ?? 0
  const anomalousCount = response.anomalousSubmissionCount ?? 0
  const totalCount = compliantCount + anomalousCount

  if (Number.isNaN(totalCount) || totalCount <= 0) {
    return []
  }

  return [
    { label: 'Compliant Submissions', value: compliantCount },
    { label: 'Anomalous Submissions', value: anomalousCount },
  ]
}

export const mapSchemePerformanceToPumpOperators = (
  response: SchemePerformanceResponse | undefined,
  fallbackData: PumpOperatorsData[]
): PumpOperatorsData[] => {
  if (!response) {
    return fallbackData
  }

  const activeSchemeCount = response.activeSchemeCount ?? 0
  const inactiveSchemeCount = response.inactiveSchemeCount ?? 0

  if (activeSchemeCount + inactiveSchemeCount <= 0) {
    return []
  }

  return [
    { label: 'Active schemes', value: activeSchemeCount },
    { label: 'Non-active schemes', value: inactiveSchemeCount },
  ]
}

export const mapSchemePerformanceToTable = (
  response: SchemePerformanceResponse | undefined,
  fallbackData: PumpOperatorPerformanceData[],
  options?: {
    blockTitleByParentId?: LocationTitleLookup
    parentLgdTitleById?: LocationTitleLookup
  }
): PumpOperatorPerformanceData[] => {
  if (!response?.topSchemes?.length) {
    return fallbackData
  }

  return response.topSchemes.map((scheme, index) => {
    const parentLgdTitle = getLocationTitleFromLookup(
      options?.parentLgdTitleById,
      scheme.immediateParentLgdId
    )
    const blockTitle = getLocationTitleFromLookup(
      options?.blockTitleByParentId,
      scheme.immediateParentLgdId
    )

    return {
      id: `scheme-performance-${scheme.schemeId ?? index}`,
      name: formatEntityName(
        scheme.schemeName?.trim(),
        undefined,
        `Scheme ${scheme.schemeId ?? index + 1}`
      ),
      village: parentLgdTitle
        ? toCapitalizedWords(parentLgdTitle)
        : scheme.immediateParentLgdTitle?.trim()
          ? toCapitalizedWords(scheme.immediateParentLgdTitle.trim())
          : null,
      block: blockTitle
        ? toCapitalizedWords(blockTitle)
        : scheme.immediateParentDepartmentTitle?.trim()
          ? toCapitalizedWords(scheme.immediateParentDepartmentTitle.trim())
          : null,
      reportingRate:
        typeof scheme.reportingRate === 'number' && Number.isFinite(scheme.reportingRate)
          ? scheme.reportingRate
          : null,
      photoCompliance: 0,
      waterSupplied:
        typeof scheme.totalWaterSupplied === 'number' && Number.isFinite(scheme.totalWaterSupplied)
          ? scheme.totalWaterSupplied
          : null,
    }
  })
}

export const mapOverallPerformanceFromAnalytics = (
  waterSupplyResponse: AverageWaterSupplyPerRegionResponse | undefined,
  regularityResponse: AverageSchemeRegularityResponse | undefined,
  _fallbackData: EntityPerformance[],
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
): EntityPerformance[] => {
  if (!waterSupplyResponse?.childRegions?.length) {
    return []
  }

  const waterChildRegions = waterSupplyResponse.childRegions
  const regularityByName = new Map(
    (regularityResponse?.childRegions ?? []).map(
      (region) => [slugify(region.title), region] as const
    )
  )
  const waterDaysInRange = resolveDaysInRange(
    waterSupplyResponse.daysInRange,
    waterSupplyResponse.startDate,
    waterSupplyResponse.endDate
  )
  const regularityDaysInRange = resolveDaysInRange(
    regularityResponse?.daysInRange,
    regularityResponse?.startDate,
    regularityResponse?.endDate
  )

  return waterChildRegions.map((region, index) => {
    const matchingRegularity = regularityByName.get(slugify(region.title))
    const regionId =
      typeof region.departmentId === 'number' && region.departmentId > 0
        ? String(region.departmentId)
        : typeof region.lgdId === 'number' && region.lgdId > 0
          ? String(region.lgdId)
          : `overall-performance-${index}-${slugify(region.title || String(index))}`

    return {
      id: regionId,
      name: formatEntityName(region.title, undefined, `Region ${index + 1}`),
      coverage: calculateQuantityMld(region.totalWaterSuppliedLiters, waterDaysInRange),
      regularity: matchingRegularity
        ? calculateAverageRegularityPercent(
            matchingRegularity.totalSupplyDays,
            matchingRegularity.schemeCount,
            regularityDaysInRange
          )
        : 0,
      continuity: 0,
      quantity: calculateQuantityLpcd(
        region.totalWaterSuppliedLiters,
        getChildRegionAchievedFhtcCount(region),
        waterDaysInRange,
        averagePersonsPerHousehold
      ),
      compositeScore: 0,
      status: 'needs-attention',
    }
  })
}

export const mapOverallPerformanceFromNationalDashboard = (
  response: NationalDashboardResponse | undefined,
  _fallbackData: EntityPerformance[],
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
): EntityPerformance[] => {
  if (!response?.stateWiseQuantityPerformance?.length) {
    return []
  }

  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)
  const regularityByName = new Map(
    (response.stateWiseRegularity ?? []).map((state) => [slugify(state.stateTitle), state] as const)
  )
  const seenIds = new Set<string>()

  return response.stateWiseQuantityPerformance.map((state, index) => {
    const matchingRegularity = regularityByName.get(slugify(state.stateTitle))
    const baseId = state.stateCode
      ? `national-overall-${state.stateCode}`
      : `national-overall-${slugify(state.stateTitle) || index}`
    let resolvedId = baseId
    if (seenIds.has(resolvedId)) {
      let suffix = 1
      while (seenIds.has(`${baseId}-${suffix}`)) {
        suffix += 1
      }
      resolvedId = `${baseId}-${suffix}`
    }
    seenIds.add(resolvedId)

    return {
      id: resolvedId,
      name: formatEntityName(state.stateTitle, undefined, `State ${index + 1}`),
      coverage: calculateQuantityMld(state.totalWaterSuppliedLiters, daysInRange),
      regularity: matchingRegularity
        ? calculateAverageRegularityPercent(
            matchingRegularity.totalSupplyDays,
            matchingRegularity.schemeCount,
            daysInRange
          )
        : 0,
      continuity: 0,
      quantity: calculateQuantityLpcd(
        state.totalWaterSuppliedLiters,
        getNationalAchievedFhtcCount(state),
        daysInRange,
        averagePersonsPerHousehold
      ),
      compositeScore: 0,
      status: 'needs-attention',
    }
  })
}

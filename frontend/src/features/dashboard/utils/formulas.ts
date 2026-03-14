import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  EntityPerformance,
  ReadingSubmissionStatusData,
  ReadingSubmissionRateResponse,
  SubmissionStatusResponse,
} from '../types'
import { slugify } from './format-location-label'

const DEFAULT_DAYS_IN_RANGE = 30
const MILLION_LITERS = 1_000_000

const isFiniteNumber = (value: number) => Number.isFinite(value)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parseIsoDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

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
  householdCount: number,
  daysInRange: number,
  averagePersonsPerHousehold = 5
): number => {
  if (
    !isFiniteNumber(totalWaterSuppliedLiters) ||
    !isFiniteNumber(householdCount) ||
    !isFiniteNumber(averagePersonsPerHousehold) ||
    totalWaterSuppliedLiters <= 0 ||
    householdCount <= 0 ||
    averagePersonsPerHousehold <= 0 ||
    daysInRange <= 0
  ) {
    return 0
  }

  return Number(
    (
      totalWaterSuppliedLiters /
      (householdCount * averagePersonsPerHousehold * daysInRange)
    ).toFixed(1)
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

const sumWaterSupplySchemeField = (
  response: AverageWaterSupplyPerRegionResponse | undefined,
  field: 'totalWaterSuppliedLiters' | 'householdCount'
) => {
  if (!response?.schemes?.length) {
    return 0
  }

  return response.schemes.reduce((total, scheme) => total + (scheme[field] ?? 0), 0)
}

export const getWaterSupplyKpis = (
  response: AverageWaterSupplyPerRegionResponse | undefined,
  averagePersonsPerHousehold = 5
) => {
  if (!response) {
    return { quantityMld: 0, quantityLpcd: 0 }
  }

  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)
  const totalWaterSuppliedLiters = sumWaterSupplySchemeField(response, 'totalWaterSuppliedLiters')
  const householdCount = sumWaterSupplySchemeField(response, 'householdCount')

  return {
    quantityMld: calculateQuantityMld(totalWaterSuppliedLiters, daysInRange),
    quantityLpcd: calculateQuantityLpcd(
      totalWaterSuppliedLiters,
      householdCount,
      daysInRange,
      averagePersonsPerHousehold
    ),
  }
}

export const getRegularityKpi = (response: AverageSchemeRegularityResponse | undefined) => {
  if (!response) {
    return 0
  }

  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)
  return calculateAverageRegularityPercent(
    response.totalSupplyDays,
    response.schemeCount,
    daysInRange
  )
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

export const mapQuantityPerformanceFromAnalytics = (
  response: AverageWaterSupplyPerRegionResponse | undefined,
  fallbackData: EntityPerformance[]
): EntityPerformance[] => {
  if (!response?.childRegions?.length) {
    return fallbackData
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
      name: region.title || fallbackMatch?.name || `Region ${index + 1}`,
      coverage: fallbackMatch?.coverage ?? 0,
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
    return fallbackData
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
      name: region.title || fallbackMatch?.name || `Region ${index + 1}`,
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
    return fallbackData
  }

  const fallbackByName = mapFallbackByName(fallbackData)
  const daysInRange = resolveDaysInRange(response.daysInRange, response.startDate, response.endDate)

  return response.childRegions.map((region, index) => {
    const fallbackMatch = fallbackByName.get(slugify(region.title)) ?? fallbackData[index]

    return {
      id:
        fallbackMatch?.id ??
        `reading-submission-rate-${index}-${slugify(region.title || String(index))}`,
      name: region.title || fallbackMatch?.name || `Region ${index + 1}`,
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

export const mapReadingSubmissionStatusFromAnalytics = (
  response: SubmissionStatusResponse | undefined,
  fallbackData: ReadingSubmissionStatusData[]
): ReadingSubmissionStatusData[] => {
  if (!response) {
    return fallbackData
  }

  const compliantCount = response.compliantSubmissionCount ?? 0
  const anomalousCount = response.anomalousSubmissionCount ?? 0
  const totalCount = compliantCount + anomalousCount

  // Keep current mock-backed chart data until the submission-status API is populated.
  if (totalCount <= 0) {
    return fallbackData
  }

  return [
    { label: 'Complaint Submission', value: compliantCount },
    { label: 'Anomalous Submissions', value: anomalousCount },
  ]
}

export const mapOverallPerformanceFromAnalytics = (
  waterSupplyResponse: AverageWaterSupplyPerRegionResponse | undefined,
  regularityResponse: AverageSchemeRegularityResponse | undefined,
  fallbackData: EntityPerformance[],
  averagePersonsPerHousehold = 5
): EntityPerformance[] => {
  if (!waterSupplyResponse?.childRegions?.length) {
    return fallbackData
  }

  const waterChildRegions = waterSupplyResponse.childRegions
  const fallbackByName = mapFallbackByName(fallbackData)
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
    const fallbackMatch = fallbackByName.get(slugify(region.title)) ?? fallbackData[index]
    const matchingRegularity = regularityByName.get(slugify(region.title))

    return {
      id:
        fallbackMatch?.id ??
        `overall-performance-${index}-${slugify(region.title || String(index))}`,
      name: region.title || fallbackMatch?.name || `Region ${index + 1}`,
      coverage: calculateQuantityMld(region.totalWaterSuppliedLiters, waterDaysInRange),
      regularity: matchingRegularity
        ? calculateAverageRegularityPercent(
            matchingRegularity.totalSupplyDays,
            matchingRegularity.schemeCount,
            regularityDaysInRange
          )
        : (fallbackMatch?.regularity ?? 0),
      continuity: fallbackMatch?.continuity ?? 0,
      quantity: calculateQuantityLpcd(
        region.totalWaterSuppliedLiters,
        region.totalHouseholdCount,
        waterDaysInRange,
        averagePersonsPerHousehold
      ),
      compositeScore: fallbackMatch?.compositeScore ?? 0,
      status: fallbackMatch?.status ?? 'needs-attention',
    }
  })
}

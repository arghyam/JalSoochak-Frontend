import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  EntityPerformance,
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

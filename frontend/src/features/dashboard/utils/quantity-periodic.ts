import type { MonthlyTrendPoint } from '../components/charts/monthly-trend-chart'
import type { WaterQuantityPeriodicMetric, WaterQuantityPeriodicResponse } from '../types'

const parseIsoDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatSingleDate = (value: string, options: Intl.DateTimeFormatOptions) => {
  const date = parseIsoDate(value)
  if (!date) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', options).format(date)
}

const formatMetricLabel = (
  scale: string,
  metric: Pick<WaterQuantityPeriodicMetric, 'periodStartDate' | 'periodEndDate'>
) => {
  if (scale === 'month') {
    const start = parseIsoDate(metric.periodStartDate)
    const end = parseIsoDate(metric.periodEndDate)

    if (
      start &&
      end &&
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(start)
    }
  }

  const startLabel = formatSingleDate(metric.periodStartDate, {
    day: '2-digit',
    month: 'short',
  })
  const endLabel = formatSingleDate(metric.periodEndDate, {
    day: '2-digit',
    month: 'short',
  })

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
}

export const resolveWaterQuantityPeriodicScale = (
  startDate: string,
  endDate: string
): 'day' | 'week' | 'month' => {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)

  if (!start || !end || start > end) {
    return 'day'
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const daysInRange = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1

  if (daysInRange <= 31) {
    return 'day'
  }

  if (daysInRange <= 120) {
    return 'week'
  }

  return 'month'
}

export const mapWaterQuantityPeriodicToTrendPoints = (
  response: WaterQuantityPeriodicResponse | undefined
): MonthlyTrendPoint[] => {
  if (!response?.metrics?.length) {
    return []
  }

  return response.metrics
    .filter(
      (metric) =>
        typeof metric.averageWaterQuantity === 'number' &&
        Number.isFinite(metric.averageWaterQuantity) &&
        Boolean(metric.periodStartDate) &&
        Boolean(metric.periodEndDate)
    )
    .map((metric) => ({
      period: formatMetricLabel(response.scale, metric),
      value: metric.averageWaterQuantity,
    }))
}

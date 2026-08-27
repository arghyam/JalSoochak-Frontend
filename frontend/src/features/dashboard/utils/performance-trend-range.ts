import { toLocalIsoDate } from '@/shared/utils/date-format'

/**
 * The Regularity / Quantity Performance cards render a *time series*, so a duration of a
 * single day would plot exactly one point. When the duration widget resolves to one day
 * (start === end) those two charts instead look back over a fixed window that ends on the
 * selected day.
 *
 * This only widens the range fed to the two trend queries — the selected duration still
 * drives the KPI tiles, the geography views and every other widget, so the widened window
 * must never be reused as the dashboard's analytics range.
 */
export const PERFORMANCE_TREND_SINGLE_DAY_WINDOW_DAYS = 30

export type PerformanceTrendRange = {
  startDate: string
  endDate: string
}

const parseIsoDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Pure. Returns the range unchanged unless both bounds are the same valid ISO day, in which
 * case the start is pushed back so the window covers
 * `PERFORMANCE_TREND_SINGLE_DAY_WINDOW_DAYS` days *inclusive* of the selected day
 * (30 days → selectedDay-29 … selectedDay). Local-time day math, matching the rest of the
 * duration widget.
 */
export const resolvePerformanceTrendRange = (
  range: PerformanceTrendRange
): PerformanceTrendRange => {
  if (range.startDate !== range.endDate) {
    return range
  }

  const selectedDay = parseIsoDate(range.endDate)
  if (!selectedDay) {
    return range
  }

  const windowStart = new Date(selectedDay)
  windowStart.setDate(selectedDay.getDate() - (PERFORMANCE_TREND_SINGLE_DAY_WINDOW_DAYS - 1))

  return {
    startDate: toLocalIsoDate(windowStart),
    endDate: range.endDate,
  }
}

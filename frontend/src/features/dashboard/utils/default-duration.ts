import { useMemo } from 'react'
import type { DateRange } from '@/shared/components/common'
import { getRuntimeConfig } from '@/config/runtime-config'
import { useCurrentIsoDate } from '@/shared/hooks/use-current-iso-date'
import { isoDateToLocalDate, toLocalIsoDate } from '@/shared/utils/date-format'

const DEFAULT_DASHBOARD_DURATION_DAYS = 1
const DEFAULT_ALLOWED_DASHBOARD_DURATION_DAYS = [1, 7, 30]

const resolveDashboardDefaultDurationDays = () => {
  const durationConfig = getRuntimeConfig().DEFAULT_DASHBOARD_DURATION
  const configuredDuration = durationConfig?.DAYS
  const allowedDurations = durationConfig?.ALLOWED_DAYS
  const validAllowedDurations = allowedDurations?.filter((days) =>
    DEFAULT_ALLOWED_DASHBOARD_DURATION_DAYS.includes(days)
  )

  if (
    typeof configuredDuration === 'number' &&
    (validAllowedDurations?.length
      ? validAllowedDurations
      : DEFAULT_ALLOWED_DASHBOARD_DURATION_DAYS
    ).includes(configuredDuration)
  ) {
    return configuredDuration
  }

  return DEFAULT_DASHBOARD_DURATION_DAYS
}

// The default range always *ends today* — today's data is the dashboard's landing view.
// The window is inclusive, so DAYS: 7 yields today-6 … today.
export const getDashboardDefaultDateRange = (baseDate = new Date()): DateRange => {
  const effectiveDate = new Date(baseDate)

  const endDate = toLocalIsoDate(effectiveDate)
  const startDate = new Date(effectiveDate)
  startDate.setDate(effectiveDate.getDate() - resolveDashboardDefaultDurationDays() + 1)

  return {
    startDate: toLocalIsoDate(startDate),
    endDate,
  }
}

/**
 * Derived purely from the current calendar day, so it can never be stale: there is no
 * timer to miss a midnight. Recomputes only when the day actually changes.
 */
export const useDashboardDefaultDateRange = (): DateRange => {
  const currentIsoDate = useCurrentIsoDate()

  return useMemo(
    () => getDashboardDefaultDateRange(isoDateToLocalDate(currentIsoDate)),
    [currentIsoDate]
  )
}

import { useEffect, useState } from 'react'
import type { DateRange } from '@/shared/components/common'
import { getRuntimeConfig } from '@/config/runtime-config'

export const DASHBOARD_DATA_ROLLOVER_HOUR = 19
const DEFAULT_DASHBOARD_DURATION_DAYS = 1
const DEFAULT_ALLOWED_DASHBOARD_DURATION_DAYS = [1, 7, 30]

const formatIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

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

export const getDashboardDefaultDateRange = (baseDate = new Date()): DateRange => {
  const effectiveDate = new Date(baseDate)

  if (effectiveDate.getHours() < DASHBOARD_DATA_ROLLOVER_HOUR) {
    effectiveDate.setDate(effectiveDate.getDate() - 1)
  }

  const endDate = formatIsoDate(effectiveDate)
  const startDate = new Date(effectiveDate)
  startDate.setDate(effectiveDate.getDate() - resolveDashboardDefaultDurationDays() + 1)

  return {
    startDate: formatIsoDate(startDate),
    endDate,
  }
}

const getNextDashboardRolloverDelay = (baseDate = new Date()) => {
  const nextRollover = new Date(baseDate)
  nextRollover.setHours(DASHBOARD_DATA_ROLLOVER_HOUR, 0, 0, 0)

  if (baseDate.getTime() >= nextRollover.getTime()) {
    nextRollover.setDate(nextRollover.getDate() + 1)
  }

  return Math.max(0, nextRollover.getTime() - baseDate.getTime()) + 1000
}

export const useDashboardDefaultDateRange = () => {
  const [defaultDateRange, setDefaultDateRange] = useState(() => getDashboardDefaultDateRange())

  useEffect(() => {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setDefaultDateRange(getDashboardDefaultDateRange())
    }, getNextDashboardRolloverDelay())

    if (typeof timeoutId === 'object' && 'unref' in timeoutId) {
      timeoutId.unref()
    }

    return () => clearTimeout(timeoutId)
  }, [defaultDateRange.endDate])

  return defaultDateRange
}

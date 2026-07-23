import { useEffect, useState } from 'react'
import type { DateRange } from '@/shared/components/common'
import { getRuntimeConfig } from '@/config/runtime-config'

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

  const endDate = formatIsoDate(effectiveDate)
  const startDate = new Date(effectiveDate)
  startDate.setDate(effectiveDate.getDate() - resolveDashboardDefaultDurationDays() + 1)

  return {
    startDate: formatIsoDate(startDate),
    endDate,
  }
}

const getNextMidnightDelay = (baseDate = new Date()) => {
  const nextMidnight = new Date(baseDate)
  // setHours with 24 rolls over to 00:00 of the following calendar day.
  nextMidnight.setHours(24, 0, 0, 0)

  return Math.max(0, nextMidnight.getTime() - baseDate.getTime()) + 1000
}

export const useDashboardDefaultDateRange = () => {
  const [defaultDateRange, setDefaultDateRange] = useState(() => getDashboardDefaultDateRange())

  useEffect(() => {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setDefaultDateRange(getDashboardDefaultDateRange())
    }, getNextMidnightDelay())

    if (typeof timeoutId === 'object' && 'unref' in timeoutId) {
      timeoutId.unref()
    }

    return () => clearTimeout(timeoutId)
  }, [defaultDateRange.endDate])

  return defaultDateRange
}

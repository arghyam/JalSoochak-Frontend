import { useEffect, useState } from 'react'
import type { DateRange } from '@/shared/components/common'

export const DASHBOARD_DATA_ROLLOVER_HOUR = 19

const formatIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const getDashboardDefaultDateRange = (baseDate = new Date()): DateRange => {
  const effectiveDate = new Date(baseDate)

  if (effectiveDate.getHours() < DASHBOARD_DATA_ROLLOVER_HOUR) {
    effectiveDate.setDate(effectiveDate.getDate() - 1)
  }

  const date = formatIsoDate(effectiveDate)
  return {
    startDate: date,
    endDate: date,
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

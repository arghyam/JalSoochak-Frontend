import { describe, expect, it } from '@jest/globals'
import {
  PERFORMANCE_TREND_SINGLE_DAY_WINDOW_DAYS,
  resolvePerformanceTrendRange,
} from './performance-trend-range'

describe('resolvePerformanceTrendRange', () => {
  it('widens a single-day range to a 30-day window ending on the selected day', () => {
    expect(
      resolvePerformanceTrendRange({ startDate: '2026-08-27', endDate: '2026-08-27' })
    ).toEqual({
      startDate: '2026-07-29',
      endDate: '2026-08-27',
    })
  })

  it('produces a window that spans exactly the configured number of days inclusive', () => {
    const { startDate, endDate } = resolvePerformanceTrendRange({
      startDate: '2026-08-27',
      endDate: '2026-08-27',
    })
    const days =
      Math.round(
        (new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) /
          (24 * 60 * 60 * 1000)
      ) + 1

    expect(days).toBe(PERFORMANCE_TREND_SINGLE_DAY_WINDOW_DAYS)
  })

  it('crosses month and year boundaries correctly', () => {
    expect(
      resolvePerformanceTrendRange({ startDate: '2026-01-10', endDate: '2026-01-10' })
    ).toEqual({
      startDate: '2025-12-12',
      endDate: '2026-01-10',
    })
  })

  it('handles a leap-day selection', () => {
    expect(
      resolvePerformanceTrendRange({ startDate: '2028-02-29', endDate: '2028-02-29' })
    ).toEqual({
      startDate: '2028-01-31',
      endDate: '2028-02-29',
    })
  })

  it('leaves a multi-day range untouched', () => {
    const range = { startDate: '2026-08-01', endDate: '2026-08-27' }

    expect(resolvePerformanceTrendRange(range)).toBe(range)
  })

  it('leaves a two-day range untouched', () => {
    const range = { startDate: '2026-08-26', endDate: '2026-08-27' }

    expect(resolvePerformanceTrendRange(range)).toBe(range)
  })

  it('leaves an unparseable range untouched', () => {
    const emptyRange = { startDate: '', endDate: '' }
    const malformedRange = { startDate: '27/08/2026', endDate: '27/08/2026' }
    const impossibleRange = { startDate: '2026-13-45', endDate: '2026-13-45' }

    expect(resolvePerformanceTrendRange(emptyRange)).toBe(emptyRange)
    expect(resolvePerformanceTrendRange(malformedRange)).toBe(malformedRange)
    expect(resolvePerformanceTrendRange(impossibleRange)).toBe(impossibleRange)
  })
})

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import { getDashboardDefaultDateRange, useDashboardDefaultDateRange } from './default-duration'

type TestWindow = Window & {
  APP_CONFIG?: {
    API_BASE_URL: string
    SINGLE_TENANT_MODE: boolean
    DEFAULT_DASHBOARD_DURATION?: {
      DAYS?: number
      ALLOWED_DAYS?: number[]
    }
  }
}

describe('getDashboardDefaultDateRange', () => {
  const w = window as TestWindow
  const appConfigBefore = w.APP_CONFIG

  afterEach(() => {
    w.APP_CONFIG = appConfigBefore
  })

  it('uses the actual current day earlier in the day', () => {
    expect(getDashboardDefaultDateRange(new Date('2026-05-19T18:59:00'))).toEqual({
      startDate: '2026-05-19',
      endDate: '2026-05-19',
    })
  })

  it('uses the actual current day later in the day', () => {
    expect(getDashboardDefaultDateRange(new Date('2026-05-19T19:00:00'))).toEqual({
      startDate: '2026-05-19',
      endDate: '2026-05-19',
    })
  })

  it('uses the actual current day just after midnight', () => {
    expect(getDashboardDefaultDateRange(new Date('2026-05-19T00:01:00'))).toEqual({
      startDate: '2026-05-19',
      endDate: '2026-05-19',
    })
  })

  it('uses a 7 day range when the configured duration is 7 days', () => {
    w.APP_CONFIG = {
      API_BASE_URL: '',
      SINGLE_TENANT_MODE: false,
      DEFAULT_DASHBOARD_DURATION: {
        DAYS: 7,
        ALLOWED_DAYS: [1, 7, 30],
      },
    }

    expect(getDashboardDefaultDateRange(new Date('2026-05-19T19:00:00'))).toEqual({
      startDate: '2026-05-13',
      endDate: '2026-05-19',
    })
  })

  it('uses a 30 day range when the configured duration is 30 days', () => {
    w.APP_CONFIG = {
      API_BASE_URL: '',
      SINGLE_TENANT_MODE: false,
      DEFAULT_DASHBOARD_DURATION: {
        DAYS: 30,
        ALLOWED_DAYS: [1, 7, 30],
      },
    }

    expect(getDashboardDefaultDateRange(new Date('2026-05-19T19:00:00'))).toEqual({
      startDate: '2026-04-20',
      endDate: '2026-05-19',
    })
  })

  it('falls back to 1 day when the configured duration is not allowed', () => {
    w.APP_CONFIG = {
      API_BASE_URL: '',
      SINGLE_TENANT_MODE: false,
      DEFAULT_DASHBOARD_DURATION: {
        DAYS: 10,
        ALLOWED_DAYS: [1, 7, 30],
      },
    }

    expect(getDashboardDefaultDateRange(new Date('2026-05-19T19:00:00'))).toEqual({
      startDate: '2026-05-19',
      endDate: '2026-05-19',
    })
  })
})

describe('useDashboardDefaultDateRange', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-08-08T10:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('starts on the current day', () => {
    const { result } = renderHook(() => useDashboardDefaultDateRange())

    expect(result.current).toEqual({ startDate: '2026-08-08', endDate: '2026-08-08' })
  })

  it('advances when a suspended tab is revisited, without its midnight timer firing', () => {
    const { result } = renderHook(() => useDashboardDefaultDateRange())

    // Two days pass with the tab frozen: the midnight timer never ran. Revisiting the tab
    // must re-read the clock, not carry the day the timer was originally armed for.
    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toEqual({ startDate: '2026-08-10', endDate: '2026-08-10' })
  })

  it('advances on an ordinary midnight rollover', () => {
    const { result } = renderHook(() => useDashboardDefaultDateRange())

    act(() => {
      jest.advanceTimersByTime(14 * 60 * 60 * 1000 + 2000)
    })

    expect(result.current).toEqual({ startDate: '2026-08-09', endDate: '2026-08-09' })
  })

  it('keeps a stable reference while the day is unchanged', () => {
    const { result } = renderHook(() => useDashboardDefaultDateRange())
    const firstRange = result.current

    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000)
    })

    expect(result.current).toBe(firstRange)
  })
})

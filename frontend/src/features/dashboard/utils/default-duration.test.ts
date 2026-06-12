import { afterEach, describe, expect, it } from '@jest/globals'
import { getDashboardDefaultDateRange } from './default-duration'

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

  it('uses yesterday before the 7 PM data rollover', () => {
    expect(getDashboardDefaultDateRange(new Date('2026-05-19T18:59:00'))).toEqual({
      startDate: '2026-05-18',
      endDate: '2026-05-18',
    })
  })

  it('uses today once the 7 PM data rollover has passed', () => {
    expect(getDashboardDefaultDateRange(new Date('2026-05-19T19:00:00'))).toEqual({
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

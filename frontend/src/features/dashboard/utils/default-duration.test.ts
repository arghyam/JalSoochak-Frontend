import { describe, expect, it } from '@jest/globals'
import { getDashboardDefaultDateRange } from './default-duration'

describe('getDashboardDefaultDateRange', () => {
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
})

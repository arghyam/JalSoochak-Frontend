import { describe, expect, it } from '@jest/globals'
import {
  mapDemandSupplyToTrendPoints,
  mapOutageReasonsPeriodicToTrendPoints,
  mapSchemeRegularityPeriodicToTrendPoints,
  mapWaterQuantityPeriodicToTrendPoints,
  resolveWaterQuantityPeriodicScale,
} from './quantity-periodic'

describe('quantity-periodic utils', () => {
  it('resolves periodic scale from date range length', () => {
    expect(resolveWaterQuantityPeriodicScale('2026-03-01', '2026-03-31')).toBe('day')
    expect(resolveWaterQuantityPeriodicScale('2026-03-01', '2026-05-15')).toBe('week')
    expect(resolveWaterQuantityPeriodicScale('2026-03-01', '2026-09-30')).toBe('month')
  })

  it('maps water quantity periodic metrics into trend points', () => {
    expect(
      mapWaterQuantityPeriodicToTrendPoints({
        lgdId: 17,
        departmentId: 0,
        scale: 'day',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        periodCount: 1,
        metrics: [
          {
            periodStartDate: '2026-03-01',
            periodEndDate: '2026-03-01',
            averageWaterQuantity: 42,
            householdCount: 10,
            achievedFhtcCount: 8,
            plannedFhtcCount: 10,
          },
        ],
      })
    ).toEqual([{ period: '01 Mar', value: 42 }])
  })

  it('maps regularity periodic metrics into trend points', () => {
    expect(
      mapSchemeRegularityPeriodicToTrendPoints({
        lgdId: 17,
        departmentId: 0,
        schemeCount: 2,
        scale: 'week',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        periodCount: 1,
        metrics: [
          {
            periodStartDate: '2026-03-01',
            periodEndDate: '2026-03-07',
            totalSupplyDays: 11,
            averageRegularity: 78.5,
          },
        ],
      })
    ).toEqual([{ period: '01 Mar - 07 Mar', value: 78.5 }])
  })

  it('maps demand supply rows into fallback trend points', () => {
    expect(
      mapDemandSupplyToTrendPoints(
        [
          { period: 'Jan', demand: 100, supply: 80 },
          { period: 'Feb', demand: 120, supply: 96 },
        ],
        (item) => item.supply
      )
    ).toEqual([
      { period: 'Jan', value: 80 },
      { period: 'Feb', value: 96 },
    ])
  })

  it('supports computed fallback trend values from demand supply rows', () => {
    expect(
      mapDemandSupplyToTrendPoints(
        [
          { period: 'Jan', demand: 100, supply: 80 },
          { period: 'Feb', demand: 0, supply: 0 },
        ],
        (item) => (item.demand > 0 ? Math.round((item.supply / item.demand) * 100) : 0)
      )
    ).toEqual([
      { period: 'Jan', value: 80 },
      { period: 'Feb', value: 0 },
    ])
  })

  it('maps outage periodic metrics by summing all outage reasons per period', () => {
    expect(
      mapOutageReasonsPeriodicToTrendPoints({
        lgdId: 17,
        departmentId: 0,
        scale: 'week',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        periodCount: 1,
        metrics: [
          {
            periodStartDate: '2026-03-01',
            periodEndDate: '2026-03-07',
            outageReasonSchemeCount: {
              no_electricity: 3,
              draught: 1,
              pump_failure: 2,
            },
          },
        ],
      })
    ).toEqual([{ period: '01 Mar - 07 Mar', value: 6 }])
  })
})

import { describe, expect, it } from '@jest/globals'
import { dashboardQueryKeys } from './dashboard-query-keys'

describe('dashboardQueryKeys', () => {
  it('normalizes omitted analytics scope to the API default in query keys', () => {
    expect(
      dashboardQueryKeys.averageWaterSupplyPerRegion({
        tenantId: 7,
        parentLgdId: 11,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual(
      dashboardQueryKeys.averageWaterSupplyPerRegion({
        tenantId: 7,
        parentLgdId: 11,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    )

    expect(
      dashboardQueryKeys.averageSchemeRegularity({
        parentLgdId: 11,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual(
      dashboardQueryKeys.averageSchemeRegularity({
        parentLgdId: 11,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    )

    expect(
      dashboardQueryKeys.readingSubmissionRate({
        parentDepartmentId: 21,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual(
      dashboardQueryKeys.readingSubmissionRate({
        parentDepartmentId: 21,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    )
  })

  it('normalizes omitted schemeCount to the API default in query keys', () => {
    expect(
      dashboardQueryKeys.schemePerformance({
        parentDepartmentId: 21,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual(
      dashboardQueryKeys.schemePerformance({
        parentDepartmentId: 21,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        schemeCount: 10,
      })
    )
  })

  it('includes outage periodic scale and entity id in query keys', () => {
    expect(
      dashboardQueryKeys.outageReasonsPeriodic({
        lgdId: 17,
        scale: 'week',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual([
      'dashboard',
      'analytics',
      'outage-reasons-periodic',
      17,
      undefined,
      'week',
      '2026-03-01',
      '2026-03-31',
    ])
  })
})

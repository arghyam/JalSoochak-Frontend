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
        tenantId: 7,
        parentLgdId: 11,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual(
      dashboardQueryKeys.averageSchemeRegularity({
        tenantId: 7,
        parentLgdId: 11,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    )

    expect(
      dashboardQueryKeys.readingSubmissionRate({
        tenantId: 21,
        parentDepartmentId: 21,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual(
      dashboardQueryKeys.readingSubmissionRate({
        tenantId: 21,
        parentDepartmentId: 21,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    )
  })

  it('defaults omitted pageNumber and limit in scheme performance query keys', () => {
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
        pageNumber: 1,
        limit: 15,
      })
    )
  })

  it('includes outage periodic scale and entity id in query keys', () => {
    expect(
      dashboardQueryKeys.outageReasonsPeriodic({
        tenantId: 10,
        lgdId: 17,
        scale: 'week',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual([
      'dashboard',
      'analytics',
      'outage-reasons-periodic',
      10,
      17,
      undefined,
      'week',
      '2026-03-01',
      '2026-03-31',
    ])
  })

  it('includes tenant and entity id in the submission status query key', () => {
    expect(
      dashboardQueryKeys.submissionStatus({
        tenantId: 10,
        lgdId: 17,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual([
      'dashboard',
      'analytics',
      'submission-status',
      10,
      17,
      undefined,
      '2026-03-01',
      '2026-03-31',
    ])
  })

  it('includes scale and dates in the national periodic query key', () => {
    expect(
      dashboardQueryKeys.nationalSchemeRegularityPeriodic({
        scale: 'month',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      })
    ).toEqual([
      'dashboard',
      'analytics',
      'national-scheme-regularity-periodic',
      'month',
      '2026-01-01',
      '2026-03-31',
    ])
  })

  it('includes tenant and parent ids in the tenant boundary query key', () => {
    expect(
      dashboardQueryKeys.tenantBoundaries({
        tenantId: 10,
        parentDepartmentId: 601,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual([
      'dashboard',
      'analytics',
      'tenant-boundaries',
      10,
      undefined,
      601,
      '2026-03-01',
      '2026-03-31',
    ])
  })

  it('includes tenant and parent ids in the reading submission rate query key', () => {
    expect(
      dashboardQueryKeys.readingSubmissionRate({
        tenantId: 10,
        parentDepartmentId: 601,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual([
      'dashboard',
      'analytics',
      'reading-submission-rate',
      10,
      undefined,
      601,
      'child',
      '2026-03-01',
      '2026-03-31',
    ])
  })

  it('includes tenant and entity ids in the scheme regularity periodic query key', () => {
    expect(
      dashboardQueryKeys.schemeRegularityPeriodic({
        tenantId: 10,
        departmentId: 601,
        scale: 'week',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual([
      'dashboard',
      'analytics',
      'scheme-regularity-periodic',
      10,
      undefined,
      601,
      'week',
      '2026-03-01',
      '2026-03-31',
    ])
  })

  it('includes tenant and parent ids in the outage reasons query key', () => {
    expect(
      dashboardQueryKeys.outageReasons({
        tenantId: 10,
        parentDepartmentId: 601,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    ).toEqual([
      'dashboard',
      'analytics',
      'outage-reasons',
      10,
      undefined,
      601,
      '2026-03-01',
      '2026-03-31',
    ])
  })
})

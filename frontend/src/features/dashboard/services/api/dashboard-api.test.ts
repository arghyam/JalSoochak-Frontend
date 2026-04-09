import { beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockGet: jest.Mock = jest.fn()

jest.mock('@/shared/lib/axios', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}))

describe('dashboardApi.getNationalDashboard', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('unwraps wrapped national dashboard data when the backend already returns stateWise arrays', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
        data: {
          startDate: '2026-03-03',
          endDate: '2026-04-01',
          daysInRange: 30,
          stateWiseQuantityPerformance: [
            {
              tenantId: 17,
              stateCode: 'AS',
              stateTitle: 'Assam',
              schemeCount: 17412,
              totalHouseholdCount: 0,
              totalAchievedFhtcCount: 2150302458,
              totalPlannedFhtcCount: 4022202,
              totalWaterSuppliedLiters: 9571163978,
              avgWaterSupplyPerScheme: 549687.8003,
            },
          ],
          stateWiseRegularity: [],
          stateWiseReadingSubmissionRate: [],
          overallOutageReasonDistribution: {},
        },
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getNationalDashboard({
      startDate: '2026-03-03',
      endDate: '2026-04-01',
    })

    expect(response).toEqual({
      startDate: '2026-03-03',
      endDate: '2026-04-01',
      daysInRange: 30,
      stateWiseQuantityPerformance: [
        {
          tenantId: 17,
          stateCode: 'AS',
          stateTitle: 'Assam',
          schemeCount: 17412,
          totalHouseholdCount: 0,
          totalAchievedFhtcCount: 2150302458,
          totalPlannedFhtcCount: 4022202,
          totalWaterSuppliedLiters: 9571163978,
          avgWaterSupplyPerScheme: 549687.8003,
        },
      ],
      stateWiseRegularity: [],
      stateWiseReadingSubmissionRate: [],
      overallOutageReasonDistribution: {},
    })
  })

  it('handles direct NationalDashboardResponse', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        startDate: '2026-03-03',
        endDate: '2026-04-01',
        daysInRange: 30,
        stateWiseQuantityPerformance: [
          {
            tenantId: 17,
            stateCode: 'AS',
            stateTitle: 'Assam',
            schemeCount: 17412,
            totalHouseholdCount: 0,
            totalAchievedFhtcCount: 2150302458,
            totalPlannedFhtcCount: 4022202,
            totalWaterSuppliedLiters: 9571163978,
            avgWaterSupplyPerScheme: 549687.8003,
          },
        ],
        stateWiseRegularity: [],
        stateWiseReadingSubmissionRate: [],
        overallOutageReasonDistribution: {},
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getNationalDashboard({
      startDate: '2026-03-03',
      endDate: '2026-04-01',
    })

    expect(response).toEqual({
      startDate: '2026-03-03',
      endDate: '2026-04-01',
      daysInRange: 30,
      stateWiseQuantityPerformance: [
        {
          tenantId: 17,
          stateCode: 'AS',
          stateTitle: 'Assam',
          schemeCount: 17412,
          totalHouseholdCount: 0,
          totalAchievedFhtcCount: 2150302458,
          totalPlannedFhtcCount: 4022202,
          totalWaterSuppliedLiters: 9571163978,
          avgWaterSupplyPerScheme: 549687.8003,
        },
      ],
      stateWiseRegularity: [],
      stateWiseReadingSubmissionRate: [],
      overallOutageReasonDistribution: {},
    })
  })

  it('throws when the wrapped national dashboard response is missing data', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')

    await expect(
      dashboardApi.getNationalDashboard({
        startDate: '2026-03-03',
        endDate: '2026-04-01',
      })
    ).rejects.toThrow('Invalid national dashboard response: missing data payload')
  })
})

describe('dashboardApi.getSchemeRegularityPeriodic', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('sends tenant_id in periodic scheme regularity requests', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        lgdId: 544,
        departmentId: 0,
        schemeCount: 3,
        scale: 'day',
        startDate: '2026-03-25',
        endDate: '2026-03-26',
        periodCount: 1,
        metrics: [],
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    await dashboardApi.getSchemeRegularityPeriodic({
      tenantId: 16,
      lgdId: 544,
      startDate: '2026-03-25',
      endDate: '2026-03-26',
      scale: 'day',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/scheme-regularity/periodic', {
      params: {
        tenant_id: 16,
        start_date: '2026-03-25',
        end_date: '2026-03-26',
        scale: 'day',
        lgd_id: 544,
        department_id: undefined,
      },
    })
  })
})

describe('dashboardApi.getReadingSubmissionRate', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('sends tenant_id in reading submission rate requests', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        parentLgdId: 10,
        parentDepartmentId: 0,
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        scope: 'child',
        startDate: '2026-03-25',
        endDate: '2026-03-26',
        daysInRange: 2,
        schemeCount: 3,
        totalSubmissionDays: 2,
        readingSubmissionRate: 66.7,
        childRegionCount: 0,
        childRegions: [],
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    await dashboardApi.getReadingSubmissionRate({
      tenantId: 16,
      parentLgdId: 10,
      scope: 'child',
      startDate: '2026-03-25',
      endDate: '2026-03-26',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/reading-submission-rate', {
      params: {
        tenant_id: 16,
        parent_lgd_id: 10,
        parent_department_id: undefined,
        scope: 'child',
        start_date: '2026-03-25',
        end_date: '2026-03-26',
      },
    })
  })
})

describe('dashboardApi.getOutageReasons', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('sends tenant_id in outage reasons requests', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        lgdId: 10,
        departmentId: 0,
        startDate: '2026-03-25',
        endDate: '2026-03-26',
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        outageReasonSchemeCount: {},
        childRegionCount: 0,
        childRegions: [],
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    await dashboardApi.getOutageReasons({
      tenantId: 16,
      parentLgdId: 10,
      startDate: '2026-03-25',
      endDate: '2026-03-26',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/outage-reasons', {
      params: {
        tenant_id: 16,
        start_date: '2026-03-25',
        end_date: '2026-03-26',
        parent_lgd_id: 10,
        parent_department_id: undefined,
      },
    })
  })
})

describe('dashboardApi.getOutageReasonsPeriodic', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('sends tenant_id in outage reasons periodic requests', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        lgdId: 10,
        departmentId: 0,
        scale: 'day',
        startDate: '2026-03-25',
        endDate: '2026-03-26',
        periodCount: 1,
        metrics: [],
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    await dashboardApi.getOutageReasonsPeriodic({
      tenantId: 16,
      lgdId: 10,
      startDate: '2026-03-25',
      endDate: '2026-03-26',
      scale: 'day',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/outage-reasons/periodic', {
      params: {
        tenant_id: 16,
        start_date: '2026-03-25',
        end_date: '2026-03-26',
        scale: 'day',
        lgd_id: 10,
        department_id: undefined,
      },
    })
  })
})

describe('dashboardApi.getSubmissionStatus', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('sends tenant_id in submission status requests', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        startDate: '2026-03-25',
        endDate: '2026-03-26',
        schemeCount: 3,
        compliantSubmissionCount: 2,
        anomalousSubmissionCount: 1,
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    await dashboardApi.getSubmissionStatus({
      tenantId: 16,
      lgdId: 10,
      startDate: '2026-03-25',
      endDate: '2026-03-26',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/submission-status', {
      params: {
        tenant_id: 16,
        start_date: '2026-03-25',
        end_date: '2026-03-26',
        lgd_id: 10,
        department_id: undefined,
      },
    })
  })
})

describe('dashboardApi.getDashboardData', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('keeps api reading compliance for block dashboards when the backend provides it', async () => {
    const apiReadingCompliance = [
      {
        id: 'po-2',
        name: 'Operator 2',
        village: 'Village 2',
        lastSubmission: '2026-01-02',
        readingValue: '456',
      },
    ]

    mockGet.mockImplementation(async () => ({
      data: {
        level: 'block',
        entityId: 'block-1',
        kpis: {
          totalSchemes: 1,
          totalRuralHouseholds: 2,
          functionalTapConnections: 3,
        },
        mapData: [],
        demandSupply: [],
        readingSubmissionStatus: [],
        readingCompliance: apiReadingCompliance,
        pumpOperators: [],
        waterSupplyOutages: [],
        topPerformers: [],
        worstPerformers: [],
        regularityData: [],
        continuityData: [],
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getDashboardData({
      level: 'block',
      entityId: 'block-1',
    })

    expect(response.readingCompliance).toEqual(apiReadingCompliance)
  })

  it('keeps api reading compliance for village dashboards', async () => {
    const apiReadingCompliance = [
      {
        id: 'po-1',
        name: 'Operator 1',
        village: 'Village 1',
        lastSubmission: '2026-01-01',
        readingValue: '123',
      },
    ]

    mockGet.mockImplementation(async () => ({
      data: {
        level: 'village',
        entityId: 'village-1',
        kpis: {
          totalSchemes: 1,
          totalRuralHouseholds: 2,
          functionalTapConnections: 3,
        },
        mapData: [],
        demandSupply: [],
        readingSubmissionStatus: [],
        readingCompliance: apiReadingCompliance,
        pumpOperators: [],
        waterSupplyOutages: [],
        topPerformers: [],
        worstPerformers: [],
        regularityData: [],
        continuityData: [],
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getDashboardData({
      level: 'village',
      entityId: 'village-1',
    })

    expect(response.readingCompliance).toEqual(apiReadingCompliance)
  })

  it('normalizes missing reading compliance to an empty array for gram-panchayat dashboards', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        level: 'gram-panchayat',
        entityId: 'gp-1',
        kpis: {
          totalSchemes: 1,
          totalRuralHouseholds: 2,
          functionalTapConnections: 3,
        },
        mapData: [],
        demandSupply: [],
        readingSubmissionStatus: [],
        pumpOperators: [],
        waterSupplyOutages: [],
        topPerformers: [],
        worstPerformers: [],
        regularityData: [],
        continuityData: [],
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getDashboardData({
      level: 'gram-panchayat',
      entityId: 'gp-1',
    })

    expect(response.readingCompliance).toEqual([])
  })
})

describe('dashboardApi.getNationalSchemeRegularityPeriodic', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('unwraps wrapped national periodic analytics responses', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
        data: {
          schemeCount: 10,
          scale: 'day',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          periodCount: 1,
          metrics: [
            {
              periodStartDate: '2026-01-01',
              periodEndDate: '2026-01-01',
              averageRegularity: 0.74,
            },
          ],
        },
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getNationalSchemeRegularityPeriodic({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      scale: 'day',
    })

    expect(response).toEqual({
      schemeCount: 10,
      scale: 'day',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      periodCount: 1,
      metrics: [
        {
          periodStartDate: '2026-01-01',
          periodEndDate: '2026-01-01',
          averageRegularity: 0.74,
        },
      ],
    })
  })
})

describe('dashboardApi analytics normalization', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('normalizes departmental average water supply child region aliases', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
        data: {
          tenantId: 17,
          stateCode: 'AS',
          parentLgdLevel: 0,
          parentDepartmentLevel: 2,
          startDate: '2026-03-01',
          endDate: '2026-03-30',
          daysInRange: 30,
          schemeCount: 1,
          childRegionCount: 1,
          schemes: [],
          childRegions: [
            {
              childLgdId: 110,
              childLgdTitle: 'Guwahati Circle',
              schemeCount: 2,
              totalAchievedFhtcCount: 150,
              totalWaterSuppliedLiters: 55_200_000,
              avgWaterSupplyPerScheme: 55.2,
            },
          ],
        },
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getAverageWaterSupplyPerRegion({
      tenantId: 17,
      parentDepartmentId: 601,
      scope: 'child',
      startDate: '2026-03-01',
      endDate: '2026-03-30',
    })

    expect(response.childRegions[0]).toEqual(
      expect.objectContaining({
        lgdId: 110,
        title: 'Guwahati Circle',
      })
    )
  })

  it('normalizes departmental average regularity child region aliases', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
        data: {
          lgdId: 0,
          parentDepartmentId: 601,
          parentLgdLevel: 0,
          parentDepartmentLevel: 2,
          scope: 'child',
          startDate: '2026-03-01',
          endDate: '2026-03-30',
          daysInRange: 30,
          schemeCount: 2,
          totalSupplyDays: 10,
          averageRegularity: 0,
          childRegionCount: 1,
          childRegions: [
            {
              childLgdId: 110,
              childLgdTitle: 'Guwahati Circle',
              schemeCount: 2,
              totalSupplyDays: 10,
              averageRegularity: 16.8,
            },
          ],
        },
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getAverageSchemeRegularity({
      tenantId: 10,
      parentDepartmentId: 601,
      scope: 'child',
      startDate: '2026-03-01',
      endDate: '2026-03-30',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/scheme-regularity/average', {
      params: {
        tenant_id: 10,
        parent_lgd_id: undefined,
        parent_department_id: 601,
        scope: 'child',
        start_date: '2026-03-01',
        end_date: '2026-03-30',
      },
    })

    expect(response.childRegions[0]).toEqual(
      expect.objectContaining({
        lgdId: 110,
        title: 'Guwahati Circle',
      })
    )
  })

  it('normalizes tenant boundary geojson payloads for departmental regions', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
        data: {
          tenantId: 10,
          stateCode: 'MP',
          childBoundaryCount: 1,
          boundaryGeoJson: '{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}',
          averageSchemeRegularity: 0.75,
          readingSubmissionRate: 0.84,
          averagePerformanceScore: 0.62,
          childRegions: [
            {
              childDepartmentId: 110,
              childDepartmentTitle: 'Child Region Title',
              childBoundaryGeoJson:
                '{"type":"Polygon","coordinates":[[[0,0],[0.5,0],[0.5,0.5],[0,0.5],[0,0]]]}',
              averageSchemeRegularity: 0.78,
              readingSubmissionRate: 0.86,
              averagePerformanceScore: 0.64,
            },
          ],
        },
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getTenantBoundaries({
      tenantId: 10,
      parentDepartmentId: 601,
      startDate: '2026-03-01',
      endDate: '2026-03-30',
    })

    expect(response.parsedBoundaryGeoJson).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
    })
    expect(response.childRegions[0]).toEqual(
      expect.objectContaining({
        childLgdId: 110,
        childLgdTitle: 'Child Region Title',
        boundaryGeoJson: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [0.5, 0],
              [0.5, 0.5],
              [0, 0.5],
              [0, 0],
            ],
          ],
        },
      })
    )
  })
})

describe('dashboardApi.getAverageWaterSupplyPerRegion', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('unwraps wrapped average water supply per region data', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
        data: {
          tenantId: 17,
          stateCode: 'AS',
          parentLgdLevel: 1,
          parentDepartmentLevel: null,
          startDate: '2026-03-03',
          endDate: '2026-04-01',
          daysInRange: 30,
          schemeCount: null,
          childRegionCount: 1,
          schemes: [],
          childRegions: [
            {
              lgdId: 2,
              departmentId: null,
              title: 'Bajali',
              totalHouseholdCount: 0,
              totalAchievedFhtcCount: 49495,
              totalPlannedFhtcCount: 61827,
              totalWaterSuppliedLiters: 108842160,
              schemeCount: 214,
              avgWaterSupplyPerScheme: 508608.2243,
            },
          ],
        },
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getAverageWaterSupplyPerRegion({
      tenantId: 17,
      startDate: '2026-03-03',
      endDate: '2026-04-01',
    })

    expect(response).toEqual({
      tenantId: 17,
      stateCode: 'AS',
      parentLgdLevel: 1,
      parentDepartmentLevel: null,
      startDate: '2026-03-03',
      endDate: '2026-04-01',
      daysInRange: 30,
      schemeCount: null,
      childRegionCount: 1,
      schemes: [],
      childRegions: [
        {
          lgdId: 2,
          departmentId: null,
          title: 'Bajali',
          totalHouseholdCount: 0,
          totalAchievedFhtcCount: 49495,
          totalPlannedFhtcCount: 61827,
          totalWaterSuppliedLiters: 108842160,
          schemeCount: 214,
          avgWaterSupplyPerScheme: 508608.2243,
        },
      ],
    })
  })
})

describe('state dashboard analytics wrappers', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('unwraps wrapped average scheme regularity data', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
        data: {
          lgdId: 17,
          parentDepartmentId: 0,
          parentLgdLevel: 1,
          parentDepartmentLevel: 0,
          scope: 'child',
          startDate: '2026-03-03',
          endDate: '2026-04-01',
          daysInRange: 30,
          schemeCount: 214,
          totalSupplyDays: 4280,
          averageRegularity: 66.7,
          childRegionCount: 1,
          childRegions: [],
        },
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')
    const response = await dashboardApi.getAverageSchemeRegularity({
      tenantId: 17,
      parentLgdId: 17,
      scope: 'child',
      startDate: '2026-03-03',
      endDate: '2026-04-01',
    })

    expect(response).toEqual({
      lgdId: 17,
      parentDepartmentId: 0,
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      scope: 'child',
      startDate: '2026-03-03',
      endDate: '2026-04-01',
      daysInRange: 30,
      schemeCount: 214,
      totalSupplyDays: 4280,
      averageRegularity: 66.7,
      childRegionCount: 1,
      childRegions: [],
    })
  })

  it('throws when a wrapped analytics payload is missing data', async () => {
    mockGet.mockImplementation(async () => ({
      data: {
        success: true,
        data: undefined,
      },
    }))

    const { dashboardApi } = await import('./dashboard-api')

    await expect(
      dashboardApi.getAverageSchemeRegularity({
        tenantId: 17,
        parentLgdId: 17,
        scope: 'child',
        startDate: '2026-03-03',
        endDate: '2026-04-01',
      })
    ).rejects.toThrow(
      'Invalid average scheme regularity analytics response: wrapped payload is missing data'
    )
  })
})

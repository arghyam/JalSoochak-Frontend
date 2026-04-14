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
        childDepartmentId: 110,
        childDepartmentTitle: 'Child Region Title',
        childLgdId: undefined,
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

describe('dashboardApi.getTenantPublicConfig', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('maps config envelope and defaults when keys missing', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: { configs: {} } } } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getTenantPublicConfig(5)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tenants/5/config/public')
    expect(res.averageMembersPerHousehold).toBe(0)
    expect(res.dateFormatScreen).toEqual({
      dateFormat: null,
      timeFormat: null,
      timezone: null,
    })
  })

  it('reads average members and date format from configs', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          configs: {
            AVERAGE_MEMBERS_PER_HOUSEHOLD: { value: '5' },
            DATE_FORMAT_SCREEN: {
              dateFormat: 'dd/MM/yyyy',
              timeFormat: null,
              timezone: 'Asia/Kolkata',
            },
          },
        },
      },
    } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getTenantPublicConfig(9)
    expect(res.averageMembersPerHousehold).toBe(5)
    expect(res.dateFormatScreen.dateFormat).toBe('dd/MM/yyyy')
  })
})

describe('dashboardApi.getNationalDashboardBoundaries', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('unwraps wrapped boundary payload', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          nationalBoundary: null,
          stateWiseBoundaries: [],
        },
      },
    } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getNationalDashboardBoundaries()
    expect(res.stateWiseBoundaries).toEqual([])
  })
})

describe('dashboardApi.getWaterQuantityPeriodic', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('unwraps wrapped periodic water quantity response', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          lgdId: 1,
          departmentId: 0,
          scale: 'day',
          startDate: 'a',
          endDate: 'b',
          periodCount: 2,
          metrics: [],
        },
      },
    } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getWaterQuantityPeriodic({
      startDate: 'a',
      endDate: 'b',
      scale: 'day',
      lgdId: 1,
    })
    expect(res.periodCount).toBe(2)
  })
})

describe('dashboardApi.getSchemePerformance', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('sends scheme_count and unwraps wrapped payload', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          parentLgdId: 10,
          parentDepartmentId: 0,
          parentLgdCName: '',
          parentDepartmentCName: '',
          parentLgdTitle: '',
          parentDepartmentTitle: '',
          startDate: 's',
          endDate: 'e',
          daysInRange: 1,
          activeSchemeCount: 2,
          inactiveSchemeCount: 1,
          topSchemeCount: 1,
          topSchemes: [],
        },
      },
    } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getSchemePerformance({
      tenantId: 10,
      parentLgdId: 2,
      startDate: 's',
      endDate: 'e',
      schemeCount: 25,
    })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/schemes/dashboard', {
      params: {
        tenant_id: 10,
        parent_lgd_id: 2,
        parent_department_id: undefined,
        start_date: 's',
        end_date: 'e',
        scheme_count: 25,
      },
    })
    expect(res.activeSchemeCount).toBe(2)
  })
})

describe('dashboardApi pump operator endpoints', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('getPumpOperatorDetails normalizes missedSubmissionDays from array length', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        status: 200,
        message: 'ok',
        data: {
          id: 1,
          uuid: 'u',
          name: 'n',
          email: 'e',
          phoneNumber: 'p',
          status: 1,
          schemeId: 9,
          schemeName: 'S',
          schemeLatitude: null,
          schemeLongitude: null,
          lastSubmissionAt: null,
          firstSubmissionDate: null,
          totalDaysSinceFirstSubmission: null,
          submittedDays: 0,
          reportingRatePercent: null,
          missedSubmissionDays: ['2026-01-01', '2026-01-02'],
        },
      },
    } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getPumpOperatorDetails({
      pumpOperatorId: 7,
      tenant_code: 'TN',
    })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/pump-operators/7', {
      params: { tenantCode: 'TN' },
    })
    expect(res.data.missedSubmissionDays).toBe(2)
  })

  it('getPumpOperatorsByScheme returns response data', async () => {
    const payload = { status: 200, message: 'ok', data: [] }
    mockGet.mockResolvedValueOnce({ data: payload } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getPumpOperatorsByScheme({
      tenant_code: 'TN',
      scheme_id: 3,
    })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/pump-operators/by-scheme', {
      params: { tenantCode: 'TN', schemeId: 3 },
    })
    expect(res).toEqual(payload)
  })

  it('getReadingCompliance uses by-scheme path when scheme_id set', async () => {
    const body = { status: 200, message: 'ok', data: { content: [], totalElements: 0 } }
    mockGet.mockResolvedValueOnce({ data: body } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getReadingCompliance({
      tenant_code: 'TN',
      scheme_id: 99,
      page: 1,
      size: 20,
    })
    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/pumpoperator/pump-operators/by-scheme/reading-compliance',
      { params: { tenantCode: 'TN', schemeId: 99, page: 1, size: 20 } }
    )
    expect(res).toEqual(body)
  })

  it('getReadingCompliance uses global path when scheme_id absent', async () => {
    const body = { status: 200, message: 'ok', data: { content: [], totalElements: 0 } }
    mockGet.mockResolvedValueOnce({ data: body } as never)
    const { dashboardApi } = await import('./dashboard-api')
    await dashboardApi.getReadingCompliance({ tenant_code: 'TN' })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/pump-operators/reading-compliance', {
      params: { tenantCode: 'TN', schemeId: undefined, page: 0, size: 50 },
    })
  })
})

describe('dashboardApi.getDashboardData validation', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockGet.mockReset()
  })

  it('throws when entityId missing', async () => {
    const { dashboardApi } = await import('./dashboard-api')
    await expect(dashboardApi.getDashboardData({ level: 'block', entityId: '' })).rejects.toThrow(
      /entityId is required/
    )
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('throws when payload is not valid dashboard data', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        level: 'block',
        entityId: 'b1',
        kpis: {},
      },
    } as never)
    const { dashboardApi } = await import('./dashboard-api')
    await expect(dashboardApi.getDashboardData({ level: 'block', entityId: 'b1' })).rejects.toThrow(
      /invalid payload/
    )
  })
})

describe('dashboardApi.getTenants', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockGet.mockReset()
  })

  it('aggregates a single page of tenants', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        content: [{ id: 1, name: 'A' }],
        totalElements: 1,
      },
    } as never)
    const { dashboardApi } = await import('./dashboard-api')
    const res = await dashboardApi.getTenants()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tenants', { params: { page: 0, size: 10 } })
    expect(res.content).toHaveLength(1)
    expect(res.totalElements).toBe(1)
  })
})

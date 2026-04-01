import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { mockReadingCompliance } from '../mock/dashboard-mock'

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

describe('dashboardApi.getDashboardData', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('keeps api reading compliance for block dashboards when the backend provides it', async () => {
    const apiReadingCompliance: typeof mockReadingCompliance = [
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

  it('uses mock reading compliance for gram-panchayat dashboards when the backend omits it', async () => {
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

    expect(response.readingCompliance).toEqual(mockReadingCompliance)
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

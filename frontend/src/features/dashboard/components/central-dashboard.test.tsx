import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData } from '../types'
import { CentralDashboard } from './central-dashboard'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useLocationSearchQuery } from '../services/query/use-location-search-query'
import { useLocationChildrenQuery } from '../services/query/use-location-children-query'
import { useAverageWaterSupplyPerRegionQuery } from '../services/query/use-average-water-supply-per-region-query'
import { useAverageSchemeRegularityQuery } from '../services/query/use-average-scheme-regularity-query'
import { useOutageReasonsQuery } from '../services/query/use-outage-reasons-query'
import { useReadingComplianceQuery } from '../services/query/use-reading-compliance-query'
import { useSchemePerformanceQuery } from '../services/query/use-scheme-performance-query'
import { useSubmissionStatusQuery } from '../services/query/use-submission-status-query'

const mockNavigate = jest.fn()
const mockUseParams = jest.fn(() => ({}))
const mockUseSearchParams = jest.fn(() => [new URLSearchParams(), jest.fn()])
const mockDashboardFilters = jest.fn((_props: unknown) => <div data-testid="dashboard-filters" />)
const mockDashboardBody = jest.fn((_props: unknown) => <div data-testid="dashboard-body" />)
const mockIndiaMapChart = jest.fn((_props: unknown) => <div data-testid="india-map-chart" />)
const mockOverallPerformanceTable = jest.fn((_props: unknown) => (
  <div data-testid="overall-performance-table" />
))
const mockKPICard = jest.fn((_props: unknown) => <div data-testid="kpi-card" />)

const getLatestDashboardFilterProps = <T extends object>() => {
  const calls = mockDashboardFilters.mock.calls as unknown[][]
  return calls[calls.length - 1]?.[0] as T
}

const getLatestDashboardBodyProps = <T extends object>() => {
  const calls = mockDashboardBody.mock.calls as unknown[][]
  return calls[calls.length - 1]?.[0] as T
}

const getLatestIndiaMapChartProps = <T extends object>() => {
  const calls = mockIndiaMapChart.mock.calls as unknown[][]
  return calls[calls.length - 1]?.[0] as T
}

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useSearchParams: () => mockUseSearchParams(),
}))

jest.mock('../hooks/use-dashboard-data', () => ({
  useDashboardData: jest.fn(),
}))

jest.mock('../services/query/use-location-search-query', () => ({
  useLocationSearchQuery: jest.fn(),
}))

jest.mock('../services/query/use-location-children-query', () => ({
  useLocationChildrenQuery: jest.fn(),
}))

jest.mock('../services/query/use-average-water-supply-per-region-query', () => ({
  useAverageWaterSupplyPerRegionQuery: jest.fn(),
}))

jest.mock('../services/query/use-average-scheme-regularity-query', () => ({
  useAverageSchemeRegularityQuery: jest.fn(),
}))

jest.mock('../services/query/use-outage-reasons-query', () => ({
  useOutageReasonsQuery: jest.fn(),
}))

jest.mock('../services/query/use-reading-compliance-query', () => ({
  useReadingComplianceQuery: jest.fn(),
}))

jest.mock('../services/query/use-scheme-performance-query', () => ({
  useSchemePerformanceQuery: jest.fn(),
}))

jest.mock('../services/query/use-submission-status-query', () => ({
  useSubmissionStatusQuery: jest.fn(),
}))

jest.mock('./filters/dashboard-filters', () => ({
  DashboardFilters: (props: unknown) => mockDashboardFilters(props),
}))

jest.mock('./kpi-card', () => ({
  KPICard: (props: unknown) => mockKPICard(props),
}))

jest.mock('./charts', () => ({
  IndiaMapChart: (props: unknown) => mockIndiaMapChart(props),
}))

jest.mock('./screens/dashboard-body', () => ({
  DashboardBody: (props: unknown) => mockDashboardBody(props),
}))

jest.mock('./tables', () => ({
  OverallPerformanceTable: (props: unknown) => mockOverallPerformanceTable(props),
}))

const mockDashboardData: DashboardData = {
  level: 'central',
  kpis: {
    totalSchemes: 100,
    totalRuralHouseholds: 1000,
    functionalTapConnections: 800,
  },
  mapData: [
    {
      id: 'st-1',
      name: 'Alpha',
      coverage: 65,
      regularity: 72,
      continuity: 0,
      quantity: 54,
      compositeScore: 64,
      status: 'needs-attention',
    },
  ],
  demandSupply: [{ period: 'Jan', demand: 100, supply: 90 }],
  readingSubmissionStatus: [{ label: 'On time', value: 80 }],
  readingCompliance: [
    {
      id: 'pe-1',
      name: 'Operator 1',
      village: 'Village 1',
      lastSubmission: '2026-02-20',
      readingValue: '123',
    },
  ],
  pumpOperators: [{ label: 'Active', value: 12 }],
  waterSupplyOutages: [
    {
      label: 'District 1',
      electricityFailure: 1,
      pipelineLeak: 1,
      pumpFailure: 1,
      valveIssue: 1,
      sourceDrying: 1,
    },
  ],
  topPerformers: [],
  worstPerformers: [],
  regularityData: [],
  continuityData: [],
}

describe('CentralDashboard', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseParams.mockReset()
    mockUseSearchParams.mockReset()
    mockDashboardFilters.mockClear()
    mockDashboardBody.mockClear()
    mockIndiaMapChart.mockClear()
    mockOverallPerformanceTable.mockClear()
    mockKPICard.mockClear()
    mockUseParams.mockReturnValue({})
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useOutageReasonsQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useReadingComplianceQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useSubmissionStatusQuery as jest.Mock).mockReturnValue({ data: undefined })
  })

  it('renders Overall Performance table panel for central view', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<CentralDashboard />)

    expect(screen.getByText('Overall Performance')).toBeTruthy()
    expect(screen.getByTestId('overall-performance-table')).toBeTruthy()
    expect(screen.queryByText('Core Metrics')).toBeNull()
  })

  it('hydrates location filters from path and query params', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'district=sangareddy&block=patancheru&gramPanchayat=ismailkhanpet&village=rudraram'
      ),
      jest.fn(),
    ])

    renderWithProviders(<CentralDashboard />)

    const dashboardFilterProps = getLatestDashboardFilterProps<{
      selectedState: string
      selectedDistrict: string
      selectedBlock: string
      selectedGramPanchayat: string
      selectedVillage: string
    }>()

    expect(dashboardFilterProps.selectedState).toBe('telangana')
    expect(dashboardFilterProps.selectedDistrict).toBe('sangareddy')
    expect(dashboardFilterProps.selectedBlock).toBe('patancheru')
    expect(dashboardFilterProps.selectedGramPanchayat).toBe('ismailkhanpet')
    expect(dashboardFilterProps.selectedVillage).toBe('rudraram')
  })

  it('uses district data in Overall Performance table when a state is selected', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })

    renderWithProviders(<CentralDashboard />)

    const calls = mockOverallPerformanceTable.mock.calls as unknown[][]
    const tableProps = calls[calls.length - 1]?.[0] as {
      entityLabel: string
      data: Array<{ name: string }>
    }

    expect(tableProps.entityLabel).toBe('District')
    expect(tableProps.data.some((row) => row.name === 'Sangareddy')).toBe(true)
    expect(tableProps.data.some((row) => row.name === 'Alpha')).toBe(false)
  })

  it('overrides reading submission status from analytics when counts are available', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    ;(useSubmissionStatusQuery as jest.Mock).mockReturnValue({
      data: {
        userId: 0,
        startDate: '2026-03-14',
        endDate: '2026-03-14',
        schemeCount: 12,
        compliantSubmissionCount: 7,
        anomalousSubmissionCount: 5,
        dailySubmissionSchemeDistribution: [],
      },
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{ data: DashboardData }>()

    expect(dashboardBodyProps.data.readingSubmissionStatus).toEqual([
      { label: 'Complaint Submission', value: 7 },
      { label: 'Anomalous Submissions', value: 5 },
    ])
  })

  it('overrides active schemes chart data from scheme performance analytics when rows are available', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          schemeId: 101,
          tenantId: 16,
          performanceScore: 82,
          lastWaterSupplyDate: '2026-03-14',
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
        {
          id: 2,
          schemeId: 102,
          tenantId: 16,
          performanceScore: 0,
          lastWaterSupplyDate: '2026-03-10',
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
      ],
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{ data: DashboardData }>()

    expect(dashboardBodyProps.data.pumpOperators).toEqual([
      { label: 'Active schemes', value: 1 },
      { label: 'Non-active schemes', value: 1 },
    ])
  })

  it('overrides scheme performance table rows from scheme performance analytics when rows are available', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          schemeId: 101,
          tenantId: 16,
          performanceScore: 82,
          lastWaterSupplyDate: '2026-03-14',
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
      ],
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      operatorsPerformanceTable: Array<{
        name: string
        village: string | null
        block: string | null
        reportingRate: number | null
        waterSupplied: number | null
      }>
    }>()

    expect(dashboardBodyProps.operatorsPerformanceTable).toEqual([
      {
        id: 'scheme-performance-101',
        name: 'Scheme 101',
        village: null,
        block: null,
        reportingRate: null,
        photoCompliance: 0,
        waterSupplied: null,
      },
    ])
  })

  it('passes formula-derived overall performance rows to the table when analytics child data exists', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 10, title: 'Telangana' }],
      },
    })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReturnValue({
      data: {
        tenantId: 16,
        stateCode: 'TG',
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 2,
        childRegionCount: 1,
        schemes: [],
        childRegions: [
          {
            lgdId: 101,
            departmentId: 0,
            title: 'Alpha',
            totalHouseholdCount: 1000,
            totalWaterSuppliedLiters: 90_000_000,
            schemeCount: 2,
            avgWaterSupplyPerScheme: 0,
          },
        ],
      },
    })
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 10,
        parentDepartmentId: 0,
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 3,
        totalSupplyDays: 45,
        averageRegularity: 0,
        childRegionCount: 1,
        childRegions: [
          {
            lgdId: 101,
            departmentId: 0,
            title: 'Alpha',
            schemeCount: 3,
            totalSupplyDays: 45,
            averageRegularity: 0,
          },
        ],
      },
    })

    renderWithProviders(<CentralDashboard />)

    const tableProps = mockOverallPerformanceTable.mock.calls.at(-1)?.[0] as {
      entityLabel: string
      data: Array<{ name: string; coverage: number; quantity: number; regularity: number }>
    }

    expect(tableProps.entityLabel).toBe('District')
    expect(tableProps.data[0]).toEqual(
      expect.objectContaining({
        name: 'Alpha',
        coverage: 3,
        quantity: 600,
        regularity: 50,
      })
    )
  })

  it('uses mock lookup data when query params include stable id-prefixed values', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('district=101:sangareddy&block=202:patancheru&gramPanchayat=303:isnapur'),
      jest.fn(),
    ])

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      villageTableData: Array<{ name: string }>
      gramPanchayatTableData: Array<{ name: string }>
      blockTableData: Array<{ name: string }>
    }>()

    expect(dashboardBodyProps.blockTableData.some((row) => row.name === 'Nabha')).toBe(true)
    expect(dashboardBodyProps.gramPanchayatTableData.some((row) => row.name === 'Isnapur')).toBe(
      true
    )
    expect(dashboardBodyProps.villageTableData.some((row) => row.name === 'Kistareddypet')).toBe(
      true
    )
  })

  it('passes formula-derived quantity and regularity performance data to dashboard body', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 10, title: 'Telangana' }],
      },
    })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReturnValue({
      data: {
        tenantId: 16,
        stateCode: 'TG',
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 2,
        childRegionCount: 1,
        schemes: [],
        childRegions: [
          {
            lgdId: 101,
            departmentId: 0,
            title: 'Alpha',
            totalHouseholdCount: 1000,
            totalWaterSuppliedLiters: 90_000_000,
            schemeCount: 2,
            avgWaterSupplyPerScheme: 0,
          },
        ],
      },
    })
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 10,
        parentDepartmentId: 0,
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 2,
        totalSupplyDays: 45,
        averageRegularity: 0,
        childRegionCount: 1,
        childRegions: [
          {
            lgdId: 101,
            departmentId: 0,
            title: 'Alpha',
            schemeCount: 3,
            totalSupplyDays: 45,
            averageRegularity: 0,
          },
        ],
      },
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      quantityPerformanceData: Array<{ name: string; quantity: number }>
      regularityPerformanceData: Array<{ name: string; regularity: number }>
    }>()

    expect(dashboardBodyProps.quantityPerformanceData[0]).toEqual(
      expect.objectContaining({
        name: 'Alpha',
        quantity: 3,
      })
    )
    expect(dashboardBodyProps.regularityPerformanceData[0]).toEqual(
      expect.objectContaining({
        name: 'Alpha',
        regularity: 50,
      })
    )
  })

  it('passes API-mapped outage reasons data to dashboard body when outage analytics exist', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 10, title: 'Telangana' }],
      },
    })
    ;(useOutageReasonsQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 10,
        departmentId: 0,
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        outageReasonSchemeCount: {
          electrical_failure: 7,
          pipeline_break: 5,
          pump_failure: 3,
          valve_issue: 2,
          source_drying: 1,
        },
        childRegionCount: 0,
        childRegions: [],
      },
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      waterSupplyOutagesData: Array<{
        electricityFailure: number
        pipelineLeak: number
        pumpFailure: number
        valveIssue: number
        sourceDrying: number
      }>
      waterSupplyOutageDistributionData: Array<{
        label: string
        electricityFailure: number
        pipelineLeak: number
        pumpFailure: number
        valveIssue: number
        sourceDrying: number
      }>
    }>()

    expect(dashboardBodyProps.waterSupplyOutagesData).toEqual([
      expect.objectContaining({
        electricityFailure: 7,
        pipelineLeak: 5,
        pumpFailure: 3,
        valveIssue: 2,
        sourceDrying: 1,
      }),
    ])
    expect(dashboardBodyProps.waterSupplyOutageDistributionData).toEqual(
      mockDashboardData.waterSupplyOutages
    )
  })

  it('maps outage child regions into distribution chart data', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 10, title: 'Telangana' }],
      },
    })
    ;(useOutageReasonsQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 10,
        departmentId: 0,
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        outageReasonSchemeCount: {
          electrical_failure: 7,
        },
        childRegionCount: 2,
        childRegions: [
          {
            lgdId: 101,
            departmentId: 0,
            title: 'Sangareddy',
            outageReasonSchemeCount: {
              electrical_failure: 4,
              pipeline_break: 2,
            },
          },
          {
            lgdId: 102,
            departmentId: 0,
            title: 'Medak',
            outageReasonSchemeCount: {
              pump_failure: 3,
              source_drying: 1,
            },
          },
        ],
      },
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      waterSupplyOutageDistributionData: Array<{
        label: string
        electricityFailure: number
        pipelineLeak: number
        pumpFailure: number
        valveIssue: number
        sourceDrying: number
      }>
    }>()

    expect(dashboardBodyProps.waterSupplyOutageDistributionData).toEqual([
      {
        label: 'Sangareddy',
        electricityFailure: 4,
        pipelineLeak: 2,
        pumpFailure: 0,
        valveIssue: 0,
        sourceDrying: 0,
      },
      {
        label: 'Medak',
        electricityFailure: 0,
        pipelineLeak: 0,
        pumpFailure: 3,
        valveIssue: 0,
        sourceDrying: 1,
      },
    ])
  })

  it('passes computed KPI values and comparison trends to KPI cards', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 10, title: 'Telangana' }],
      },
    })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock)
      .mockReturnValueOnce({
        data: {
          tenantId: 16,
          stateCode: 'TG',
          parentLgdLevel: 1,
          parentDepartmentLevel: 0,
          startDate: '2026-03-01',
          endDate: '2026-03-30',
          daysInRange: 30,
          schemeCount: 1,
          childRegionCount: 1,
          schemes: [],
          childRegions: [
            {
              lgdId: 101,
              departmentId: 0,
              title: 'Alpha',
              totalHouseholdCount: 1000,
              totalWaterSuppliedLiters: 90_000_000,
              schemeCount: 1,
              avgWaterSupplyPerScheme: 0,
            },
          ],
        },
      })
      .mockReturnValueOnce({
        data: {
          tenantId: 16,
          stateCode: 'TG',
          parentLgdLevel: 1,
          parentDepartmentLevel: 0,
          startDate: '2026-03-01',
          endDate: '2026-03-30',
          daysInRange: 30,
          schemeCount: 2,
          childRegionCount: 0,
          schemes: [
            {
              schemeId: 1,
              schemeName: 'Scheme 1',
              householdCount: 1000,
              totalWaterSuppliedLiters: 90_000_000,
              supplyDays: 30,
              avgLitersPerHousehold: 0,
            },
            {
              schemeId: 2,
              schemeName: 'Scheme 2',
              householdCount: 1000,
              totalWaterSuppliedLiters: 60_000_000,
              supplyDays: 30,
              avgLitersPerHousehold: 0,
            },
          ],
          childRegions: [],
        },
      })
      .mockReturnValueOnce({
        data: {
          tenantId: 16,
          stateCode: 'TG',
          parentLgdLevel: 1,
          parentDepartmentLevel: 0,
          startDate: '2026-01-30',
          endDate: '2026-02-28',
          daysInRange: 30,
          schemeCount: 2,
          childRegionCount: 0,
          schemes: [
            {
              schemeId: 1,
              schemeName: 'Scheme 1',
              householdCount: 1000,
              totalWaterSuppliedLiters: 120_000_000,
              supplyDays: 30,
              avgLitersPerHousehold: 0,
            },
            {
              schemeId: 2,
              schemeName: 'Scheme 2',
              householdCount: 1000,
              totalWaterSuppliedLiters: 60_000_000,
              supplyDays: 30,
              avgLitersPerHousehold: 0,
            },
          ],
          childRegions: [],
        },
      })
    ;(useAverageSchemeRegularityQuery as jest.Mock)
      .mockReturnValueOnce({
        data: {
          lgdId: 10,
          parentDepartmentId: 0,
          parentLgdLevel: 1,
          parentDepartmentLevel: 0,
          scope: 'child',
          startDate: '2026-03-01',
          endDate: '2026-03-30',
          daysInRange: 30,
          schemeCount: 2,
          totalSupplyDays: 45,
          averageRegularity: 0,
          childRegionCount: 1,
          childRegions: [
            {
              lgdId: 101,
              departmentId: 0,
              title: 'Alpha',
              schemeCount: 3,
              totalSupplyDays: 45,
              averageRegularity: 0,
            },
          ],
        },
      })
      .mockReturnValueOnce({
        data: {
          lgdId: 10,
          parentDepartmentId: 0,
          parentLgdLevel: 1,
          parentDepartmentLevel: 0,
          scope: 'current',
          startDate: '2026-03-01',
          endDate: '2026-03-30',
          daysInRange: 30,
          schemeCount: 2,
          totalSupplyDays: 42,
          averageRegularity: 0,
          childRegionCount: 0,
          childRegions: [],
        },
      })
      .mockReturnValueOnce({
        data: {
          lgdId: 10,
          parentDepartmentId: 0,
          parentLgdLevel: 1,
          parentDepartmentLevel: 0,
          scope: 'current',
          startDate: '2026-01-30',
          endDate: '2026-02-28',
          daysInRange: 30,
          schemeCount: 2,
          totalSupplyDays: 48,
          averageRegularity: 0,
          childRegionCount: 0,
          childRegions: [],
        },
      })

    renderWithProviders(<CentralDashboard />)

    const kpiProps = mockKPICard.mock.calls.map(
      (call) =>
        call[0] as {
          title: string
          value: string
          trend?: { direction: 'up' | 'down'; text: string }
        }
    )

    expect(kpiProps).toHaveLength(3)
    expect(kpiProps[0]?.title).toBe('Quantity in MLD')
    expect(kpiProps[0]?.value).toBe('5')
    expect(kpiProps[0]?.trend).toEqual({ direction: 'down', text: '-16.7% vs last 30 days' })

    expect(kpiProps[1]?.title).toBe('Quantity in LPCD')
    expect(kpiProps[1]?.value).toBe('500')
    expect(kpiProps[1]?.trend).toEqual({ direction: 'down', text: '-100 LPCD vs last month' })

    expect(kpiProps[2]?.title).toBe('Regularity')
    expect(kpiProps[2]?.value).toBe('70.0%')
    expect(kpiProps[2]?.trend).toEqual({ direction: 'down', text: '-12.5% vs last month' })
  })

  it('hides map and overall performance panel when a village is selected', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'district=sangareddy&block=patancheru&gramPanchayat=ismailkhanpet&village=rudraram'
      ),
      jest.fn(),
    ])

    renderWithProviders(<CentralDashboard />)

    expect(screen.queryByTestId('india-map-chart')).toBeNull()
    expect(screen.queryByTestId('overall-performance-table')).toBeNull()
  })

  it('updates URL with state in pathname and district in query params', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })

    renderWithProviders(<CentralDashboard />)

    const dashboardFilterProps = getLatestDashboardFilterProps<{
      onDistrictChange: (value: string) => void
    }>()
    dashboardFilterProps.onDistrictChange('sangareddy')

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/telangana',
      search: '?district=sangareddy',
    })
  })

  it('guards URL-keyed lookups against prototype-chain keys', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: '__proto__' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('district=constructor&block=__proto__&gramPanchayat=constructor'),
      jest.fn(),
    ])

    renderWithProviders(<CentralDashboard />)

    expect(screen.getByTestId('dashboard-body')).toBeTruthy()

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      districtTableData: unknown[]
      blockTableData: unknown[]
      gramPanchayatTableData: unknown[]
      villageTableData: unknown[]
      waterSupplyOutagesData: unknown[]
    }>()

    expect(dashboardBodyProps.districtTableData).toEqual([])
    expect(dashboardBodyProps.blockTableData).toEqual([])
    expect(dashboardBodyProps.gramPanchayatTableData).toEqual([])
    expect(dashboardBodyProps.villageTableData).toEqual([])
    expect(dashboardBodyProps.waterSupplyOutagesData).toEqual(mockDashboardData.waterSupplyOutages)
  })

  it('uses state slug route format when map state is clicked', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<CentralDashboard />)

    const mapProps = getLatestIndiaMapChartProps<{
      onStateClick: (stateId: string, stateName: string) => void
    }>()
    mapProps.onStateClick('TG', 'Telangana')

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/telangana',
      search: '',
    })
  })

  it('renders a fallback message when dashboard data is unavailable', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<CentralDashboard />)

    expect(screen.getByText('Dashboard data unavailable')).toBeTruthy()
    expect(screen.getByText('No dashboard data was returned.')).toBeTruthy()
  })
})

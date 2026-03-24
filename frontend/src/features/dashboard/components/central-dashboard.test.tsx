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
import { useNationalDashboardQuery } from '../services/query/use-national-dashboard-query'
import { useOutageReasonsQuery } from '../services/query/use-outage-reasons-query'
import { useReadingComplianceQuery } from '../services/query/use-reading-compliance-query'
import { useReadingSubmissionRateQuery } from '../services/query/use-reading-submission-rate-query'
import { useSchemePerformanceQuery } from '../services/query/use-scheme-performance-query'
import { useSubmissionStatusQuery } from '../services/query/use-submission-status-query'
import { getPreviousPeriodRange } from '../utils/formulas'
import { useAuthStore } from '@/app/store'

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

const mockAuthStoreState = (userId: string | null) => {
  ;(useAuthStore as unknown as jest.Mock).mockImplementation((...args: unknown[]) => {
    const selector = args[0] as (state: { user: { id: string } | null }) => unknown

    return selector({
      user: userId ? { id: userId } : null,
    })
  })
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

jest.mock('../services/query/use-national-dashboard-query', () => ({
  useNationalDashboardQuery: jest.fn(),
}))

jest.mock('../services/query/use-outage-reasons-query', () => ({
  useOutageReasonsQuery: jest.fn(),
}))

jest.mock('../services/query/use-reading-compliance-query', () => ({
  useReadingComplianceQuery: jest.fn(),
}))

jest.mock('../services/query/use-reading-submission-rate-query', () => ({
  useReadingSubmissionRateQuery: jest.fn(),
}))

jest.mock('../services/query/use-scheme-performance-query', () => ({
  useSchemePerformanceQuery: jest.fn(),
}))

jest.mock('../services/query/use-submission-status-query', () => ({
  useSubmissionStatusQuery: jest.fn(),
}))

jest.mock('@/app/store', () => ({
  useAuthStore: jest.fn(),
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
    window.localStorage.clear()
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
    ;(useNationalDashboardQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useOutageReasonsQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useReadingComplianceQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useReadingSubmissionRateQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useSubmissionStatusQuery as jest.Mock).mockReturnValue({ data: undefined })
    mockAuthStoreState(null)
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

  it('requests national dashboard analytics on the unfiltered central landing view', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<CentralDashboard />)

    expect(useNationalDashboardQuery).toHaveBeenCalledWith({
      params: {
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })
  })

  it('computes previous national dashboard analytics from the active selected duration', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        selectedDuration: {
          startDate: '2026-03-10',
          endDate: '2026-03-20',
        },
      })
    )

    renderWithProviders(<CentralDashboard />)

    const previousRange = getPreviousPeriodRange('2026-03-10', '2026-03-20')

    expect((useNationalDashboardQuery as jest.Mock).mock.calls).toContainEqual([
      {
        params: {
          startDate: '2026-03-10',
          endDate: '2026-03-20',
        },
        enabled: true,
      },
    ])
    expect((useNationalDashboardQuery as jest.Mock).mock.calls).toContainEqual([
      {
        params: previousRange,
        enabled: true,
      },
    ])
  })

  it('ignores a future stored selected duration and falls back to the default analytics range', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-02-21T09:00:00'))
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        selectedDuration: {
          startDate: '2026-01-23',
          endDate: '2026-02-21',
        },
      })
    )

    renderWithProviders(<CentralDashboard />)

    expect(useNationalDashboardQuery).toHaveBeenCalledWith({
      params: {
        startDate: '2025-01-23',
        endDate: '2025-02-21',
      },
      enabled: true,
    })

    jest.useRealTimers()
  })

  it('does not enable national dashboard analytics once a location filter is selected', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })

    renderWithProviders(<CentralDashboard />)

    expect(useNationalDashboardQuery).toHaveBeenCalledWith({
      params: null,
      enabled: false,
    })
  })

  it('does not enable submission status analytics on the public central landing view', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<CentralDashboard />)

    expect(useSubmissionStatusQuery).toHaveBeenCalledWith({
      params: null,
      enabled: false,
    })
  })

  it('does not enable LGD regularity analytics before the selected state resolves to a root location id', () => {
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
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({ data: undefined })

    renderWithProviders(<CentralDashboard />)

    expect(useAverageSchemeRegularityQuery).toHaveBeenCalledWith({
      params: null,
      enabled: false,
    })
  })

  it('maps national dashboard analytics into central charts and overall performance table', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    ;(useNationalDashboardQuery as jest.Mock).mockReturnValue({
      data: {
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        stateWiseQuantityPerformance: [
          {
            tenantId: 1,
            stateCode: 'KA',
            stateTitle: 'Karnataka',
            schemeCount: 2,
            totalHouseholdCount: 1000,
            totalFhtcCount: 500,
            totalWaterSuppliedLiters: 90_000_000,
            avgWaterSupplyPerScheme: 0,
          },
        ],
        stateWiseRegularity: [
          {
            tenantId: 1,
            stateCode: 'KA',
            stateTitle: 'Karnataka',
            schemeCount: 3,
            totalSupplyDays: 45,
            averageRegularity: 0,
          },
        ],
        stateWiseReadingSubmissionRate: [
          {
            tenantId: 1,
            stateCode: 'KA',
            stateTitle: 'Karnataka',
            schemeCount: 4,
            totalSubmissionDays: 60,
            readingSubmissionRate: 0,
          },
        ],
        overallOutageReasonDistribution: {
          electrical_failure: 7,
          pipeline_break: 5,
          pump_failure: 3,
          valve_issue: 2,
          source_drying: 1,
        },
      },
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      quantityPerformanceData: Array<{ name: string; quantity: number }>
      regularityPerformanceData: Array<{ name: string; regularity: number }>
      supplySubmissionRateData: Array<{ name: string; regularity: number }>
      waterSupplyOutagesData: Array<{
        electricityFailure: number
        pipelineLeak: number
        pumpFailure: number
        valveIssue: number
        sourceDrying: number
      }>
    }>()
    const overallPerformanceProps = (mockOverallPerformanceTable.mock.calls as unknown[][]).slice(
      -1
    )[0]?.[0] as {
      data: Array<{ name: string; coverage: number; quantity: number; regularity: number }>
    }

    expect(dashboardBodyProps.quantityPerformanceData[0]).toEqual(
      expect.objectContaining({
        name: 'Karnataka',
        quantity: 3,
      })
    )
    expect(dashboardBodyProps.regularityPerformanceData[0]).toEqual(
      expect.objectContaining({
        name: 'Karnataka',
        regularity: 50,
      })
    )
    expect(dashboardBodyProps.supplySubmissionRateData[0]).toEqual(
      expect.objectContaining({
        name: 'Karnataka',
        regularity: 50,
      })
    )
    expect(dashboardBodyProps.waterSupplyOutagesData).toEqual([
      expect.objectContaining({
        electricityFailure: 7,
        pipelineLeak: 5,
        pumpFailure: 3,
        valveIssue: 2,
        sourceDrying: 1,
      }),
    ])
    expect(overallPerformanceProps.data[0]).toEqual(
      expect.objectContaining({
        name: 'Karnataka',
        coverage: 3,
        quantity: 1200,
        regularity: 50,
      })
    )
  })

  it('uses national dashboard analytics for central landing KPI cards', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    ;(useNationalDashboardQuery as jest.Mock)
      .mockReturnValueOnce({
        data: {
          startDate: '2026-03-01',
          endDate: '2026-03-30',
          daysInRange: 30,
          stateWiseQuantityPerformance: [
            {
              tenantId: 1,
              stateCode: 'KA',
              stateTitle: 'Karnataka',
              schemeCount: 2,
              totalHouseholdCount: 1000,
              totalFhtcCount: 500,
              totalWaterSuppliedLiters: 90_000_000,
              avgWaterSupplyPerScheme: 0,
            },
            {
              tenantId: 2,
              stateCode: 'TN',
              stateTitle: 'Tamil Nadu',
              schemeCount: 2,
              totalHouseholdCount: 1000,
              totalFhtcCount: 500,
              totalWaterSuppliedLiters: 60_000_000,
              avgWaterSupplyPerScheme: 0,
            },
          ],
          stateWiseRegularity: [
            {
              tenantId: 1,
              stateCode: 'KA',
              stateTitle: 'Karnataka',
              schemeCount: 2,
              totalSupplyDays: 42,
              averageRegularity: 0,
            },
            {
              tenantId: 2,
              stateCode: 'TN',
              stateTitle: 'Tamil Nadu',
              schemeCount: 2,
              totalSupplyDays: 42,
              averageRegularity: 0,
            },
          ],
          stateWiseReadingSubmissionRate: [],
          overallOutageReasonDistribution: {},
        },
      })
      .mockReturnValueOnce({
        data: {
          startDate: '2026-01-30',
          endDate: '2026-02-28',
          daysInRange: 30,
          stateWiseQuantityPerformance: [
            {
              tenantId: 1,
              stateCode: 'KA',
              stateTitle: 'Karnataka',
              schemeCount: 2,
              totalHouseholdCount: 1000,
              totalFhtcCount: 500,
              totalWaterSuppliedLiters: 120_000_000,
              avgWaterSupplyPerScheme: 0,
            },
            {
              tenantId: 2,
              stateCode: 'TN',
              stateTitle: 'Tamil Nadu',
              schemeCount: 2,
              totalHouseholdCount: 1000,
              totalFhtcCount: 500,
              totalWaterSuppliedLiters: 60_000_000,
              avgWaterSupplyPerScheme: 0,
            },
          ],
          stateWiseRegularity: [
            {
              tenantId: 1,
              stateCode: 'KA',
              stateTitle: 'Karnataka',
              schemeCount: 2,
              totalSupplyDays: 48,
              averageRegularity: 0,
            },
            {
              tenantId: 2,
              stateCode: 'TN',
              stateTitle: 'Tamil Nadu',
              schemeCount: 2,
              totalSupplyDays: 48,
              averageRegularity: 0,
            },
          ],
          stateWiseReadingSubmissionRate: [],
          overallOutageReasonDistribution: {},
        },
      })

    renderWithProviders(<CentralDashboard />)

    const kpiProps = mockKPICard.mock.calls.slice(0, 3).map(
      (call) =>
        call[0] as {
          title: string
          value: string
          trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
        }
    )

    expect(kpiProps).toHaveLength(3)
    expect(kpiProps[0]?.title).toBe('Quantity in MLD')
    expect(kpiProps[0]?.value).toBe('5')
    expect(kpiProps[0]?.trend).toEqual({ direction: 'down', text: '-16.7% vs last 30 days' })

    expect(kpiProps[1]?.title).toBe('Quantity in LPCD')
    expect(kpiProps[1]?.value).toBe('1000')
    expect(kpiProps[1]?.trend).toEqual({ direction: 'down', text: '-200 LPCD vs last month' })

    expect(kpiProps[2]?.title).toBe('Regularity')
    expect(kpiProps[2]?.value).toBe('70.0%')
    expect(kpiProps[2]?.trend).toEqual({ direction: 'down', text: '-12.5% vs last month' })
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

  it('overrides reading submission status from analytics when a logged-in user opens a filtered view', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockAuthStoreState('42')
    ;(useSubmissionStatusQuery as jest.Mock).mockReturnValue({
      data: {
        userId: 42,
        startDate: '2026-03-14',
        endDate: '2026-03-14',
        schemeCount: 12,
        compliantSubmissionCount: 7,
        anomalousSubmissionCount: 5,
        dailySubmissionSchemeDistribution: [],
      },
    })

    renderWithProviders(<CentralDashboard />)

    expect(useSubmissionStatusQuery).toHaveBeenCalledWith({
      params: {
        userId: 42,
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })

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
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 1, title: 'Telangana' }],
      },
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({
      data: {
        parentLgdId: 1,
        parentDepartmentId: 0,
        parentLgdCName: 'state',
        parentDepartmentCName: '',
        parentLgdTitle: 'Telangana',
        parentDepartmentTitle: '',
        startDate: '2026-03-14',
        endDate: '2026-03-14',
        daysInRange: 1,
        activeSchemeCount: 1,
        inactiveSchemeCount: 1,
        topSchemeCount: 2,
        topSchemes: [
          {
            schemeId: 101,
            schemeName: 'Scheme 101',
            statusCode: 1,
            status: 'Active',
            submissionDays: 30,
            reportingRate: 82,
            totalWaterSupplied: 4500,
            immediateParentLgdId: 11,
            immediateParentLgdCName: 'district',
            immediateParentLgdTitle: 'Sangareddy',
            immediateParentDepartmentId: 0,
            immediateParentDepartmentCName: '',
            immediateParentDepartmentTitle: '',
          },
          {
            schemeId: 102,
            schemeName: 'Scheme 102',
            statusCode: 0,
            status: 'Inactive',
            submissionDays: 0,
            reportingRate: 0,
            totalWaterSupplied: 0,
            immediateParentLgdId: 12,
            immediateParentLgdCName: 'district',
            immediateParentLgdTitle: 'Ranga Reddy',
            immediateParentDepartmentId: 0,
            immediateParentDepartmentCName: '',
            immediateParentDepartmentTitle: '',
          },
        ],
      },
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
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 1, title: 'Telangana' }],
      },
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({
      data: {
        parentLgdId: 1,
        parentDepartmentId: 0,
        parentLgdCName: 'state',
        parentDepartmentCName: '',
        parentLgdTitle: 'Telangana',
        parentDepartmentTitle: '',
        startDate: '2026-03-14',
        endDate: '2026-03-14',
        daysInRange: 1,
        activeSchemeCount: 1,
        inactiveSchemeCount: 0,
        topSchemeCount: 1,
        topSchemes: [
          {
            schemeId: 101,
            schemeName: 'Scheme 101',
            statusCode: 1,
            status: 'Active',
            submissionDays: 30,
            reportingRate: 82,
            totalWaterSupplied: 4500,
            immediateParentLgdId: 11,
            immediateParentLgdCName: 'district',
            immediateParentLgdTitle: 'Sangareddy',
            immediateParentDepartmentId: 0,
            immediateParentDepartmentCName: '',
            immediateParentDepartmentTitle: '',
          },
        ],
      },
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
        village: 'Sangareddy',
        block: null,
        reportingRate: 82,
        photoCompliance: 0,
        waterSupplied: 4500,
      },
    ])
  })

  it('does not fall back to legacy pump operator chart data when scheme analytics should be used', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: {
        ...mockDashboardData,
        pumpOperators: [{ label: 'Legacy active', value: 12 }],
      },
      isLoading: false,
      error: null,
    })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 1, title: 'Telangana' }],
      },
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({ data: undefined })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{ data: DashboardData }>()

    expect(dashboardBodyProps.data.pumpOperators).toEqual([])
  })

  it('does not fall back to legacy scheme performance rows when scheme analytics should be used', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: {
        ...mockDashboardData,
        leadingPumpOperators: [
          {
            id: 'legacy-leading',
            name: 'Legacy Scheme',
            village: 'Legacy Village',
            block: 'Legacy Block',
            reportingRate: 0.5,
            photoCompliance: 0,
            waterSupplied: 1000,
          },
        ],
        bottomPumpOperators: [
          {
            id: 'legacy-bottom',
            name: 'Legacy Bottom Scheme',
            village: 'Legacy Village',
            block: 'Legacy Block',
            reportingRate: 0.1,
            photoCompliance: 0,
            waterSupplied: 100,
          },
        ],
      },
      isLoading: false,
      error: null,
    })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 1, title: 'Telangana' }],
      },
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({ data: undefined })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      operatorsPerformanceTable: Array<{ id: string }>
    }>()

    expect(dashboardBodyProps.operatorsPerformanceTable).toEqual([])
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
            title: 'SANGAREDDY',
            outageReasonSchemeCount: {
              electrical_failure: 4,
              pipeline_break: 2,
            },
          },
          {
            lgdId: 102,
            departmentId: 0,
            title: 'MEDAK',
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
      expect.objectContaining({
        label: 'Sangareddy',
        electricityFailure: 4,
        pipelineLeak: 2,
        pumpFailure: 0,
        valveIssue: 0,
        sourceDrying: 0,
      }),
      expect.objectContaining({
        label: 'Medak',
        electricityFailure: 0,
        pipelineLeak: 0,
        pumpFailure: 3,
        valveIssue: 0,
        sourceDrying: 1,
      }),
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

    const initialWaterSupplyQueryCallCount = (useAverageWaterSupplyPerRegionQuery as jest.Mock).mock
      .calls.length

    renderWithProviders(<CentralDashboard />)

    const kpiProps = mockKPICard.mock.calls.slice(-3).map(
      (call) =>
        call[0] as {
          title: string
          value: string
          trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
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

    const waterSupplyQueryCalls = (useAverageWaterSupplyPerRegionQuery as jest.Mock).mock.calls
      .slice(initialWaterSupplyQueryCallCount)
      .map(
        ([args]) =>
          args as {
            enabled?: boolean
            params?: {
              tenantId?: number
              parentLgdId?: number
              scope?: 'child' | 'current'
              startDate?: string
              endDate?: string
            } | null
          }
      )

    expect(
      waterSupplyQueryCalls.filter(
        (call) =>
          call?.enabled === true &&
          call?.params?.tenantId === 16 &&
          call?.params?.parentLgdId === 10 &&
          call?.params?.scope === 'child'
      )
    ).toHaveLength(3)
    expect(waterSupplyQueryCalls.some((call) => call?.params?.scope === 'current')).toBe(false)
  })

  it('passes neutral KPI trends when comparison values do not change', () => {
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
          totalSupplyDays: 42,
          averageRegularity: 0,
          childRegionCount: 0,
          childRegions: [],
        },
      })

    renderWithProviders(<CentralDashboard />)

    const kpiProps = mockKPICard.mock.calls.slice(0, 3).map(
      (call) =>
        call[0] as {
          title: string
          value: string
          trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
        }
    )

    expect(kpiProps).toHaveLength(3)
    expect(kpiProps[0]?.trend).toEqual({ direction: 'neutral', text: '0% vs last 30 days' })
    expect(kpiProps[1]?.trend).toEqual({ direction: 'neutral', text: '0 LPCD vs last month' })
    expect(kpiProps[2]?.trend).toEqual({ direction: 'neutral', text: '0% vs last month' })
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

  it('uses the selected village LGD id for scheme performance analytics', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'district=101:sangareddy&block=202:patancheru&gramPanchayat=303:ismailkhanpet&village=404:rudraram'
      ),
      jest.fn(),
    ])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })

    renderWithProviders(<CentralDashboard />)

    expect(useSchemePerformanceQuery).toHaveBeenCalledWith({
      params: expect.objectContaining({
        parentLgdId: 404,
      }),
      enabled: true,
    })
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

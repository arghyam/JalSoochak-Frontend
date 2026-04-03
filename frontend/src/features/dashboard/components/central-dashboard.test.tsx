import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData } from '../types'
import { CentralDashboard } from './central-dashboard'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useLocationSearchQuery } from '../services/query/use-location-search-query'
import { useLocationChildrenQuery } from '../services/query/use-location-children-query'
import { useDistrictSchemeBlockLookupQuery } from '../services/query/use-district-scheme-block-lookup-query'
import { useBlockSchemePanchayatLookupQuery } from '../services/query/use-block-scheme-panchayat-lookup-query'
import { useLocationHierarchyQuery } from '../services/query/use-location-hierarchy-query'
import { useAverageWaterSupplyPerRegionQuery } from '../services/query/use-average-water-supply-per-region-query'
import { useAverageSchemeRegularityQuery } from '../services/query/use-average-scheme-regularity-query'
import { useNationalDashboardQuery } from '../services/query/use-national-dashboard-query'
import { useNationalSchemeRegularityPeriodicQuery } from '../services/query/use-national-scheme-regularity-periodic-query'
import { useOutageReasonsPeriodicQuery } from '../services/query/use-outage-reasons-periodic-query'
import { useOutageReasonsQuery } from '../services/query/use-outage-reasons-query'
import { useReadingComplianceQuery } from '../services/query/use-reading-compliance-query'
import { useReadingSubmissionRateQuery } from '../services/query/use-reading-submission-rate-query'
import { useSchemeRegularityPeriodicQuery } from '../services/query/use-scheme-regularity-periodic-query'
import { useSchemePerformanceQuery } from '../services/query/use-scheme-performance-query'
import { useSubmissionStatusQuery } from '../services/query/use-submission-status-query'
import { useWaterQuantityPeriodicQuery } from '../services/query/use-water-quantity-periodic-query'
import { useTenantBoundariesQuery } from '../services/query/use-tenant-boundaries-query'
import { getPreviousPeriodRange } from '../utils/formulas'

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

jest.mock('../services/query/use-district-scheme-block-lookup-query', () => ({
  useDistrictSchemeBlockLookupQuery: jest.fn(),
}))

jest.mock('../services/query/use-block-scheme-panchayat-lookup-query', () => ({
  useBlockSchemePanchayatLookupQuery: jest.fn(),
}))

jest.mock('../services/query/use-location-hierarchy-query', () => ({
  useLocationHierarchyQuery: jest.fn(),
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

jest.mock('../services/query/use-national-scheme-regularity-periodic-query', () => ({
  useNationalSchemeRegularityPeriodicQuery: jest.fn(),
}))

jest.mock('../services/query/use-outage-reasons-periodic-query', () => ({
  useOutageReasonsPeriodicQuery: jest.fn(),
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

jest.mock('../services/query/use-scheme-regularity-periodic-query', () => ({
  useSchemeRegularityPeriodicQuery: jest.fn(),
}))

jest.mock('../services/query/use-scheme-performance-query', () => ({
  useSchemePerformanceQuery: jest.fn(),
}))

jest.mock('../services/query/use-submission-status-query', () => ({
  useSubmissionStatusQuery: jest.fn(),
}))

jest.mock('../services/query/use-water-quantity-periodic-query', () => ({
  useWaterQuantityPeriodicQuery: jest.fn(),
}))

jest.mock('../services/query/use-tenant-boundaries-query', () => ({
  useTenantBoundariesQuery: jest.fn(),
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
    ;(useDashboardData as jest.Mock).mockReset()
    ;(useLocationSearchQuery as jest.Mock).mockReset()
    ;(useLocationChildrenQuery as jest.Mock).mockReset()
    ;(useDistrictSchemeBlockLookupQuery as jest.Mock).mockReset()
    ;(useBlockSchemePanchayatLookupQuery as jest.Mock).mockReset()
    ;(useLocationHierarchyQuery as jest.Mock).mockReset()
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReset()
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReset()
    ;(useNationalDashboardQuery as jest.Mock).mockReset()
    ;(useNationalSchemeRegularityPeriodicQuery as jest.Mock).mockReset()
    ;(useOutageReasonsPeriodicQuery as jest.Mock).mockReset()
    ;(useOutageReasonsQuery as jest.Mock).mockReset()
    ;(useReadingComplianceQuery as jest.Mock).mockReset()
    ;(useReadingSubmissionRateQuery as jest.Mock).mockReset()
    ;(useSchemeRegularityPeriodicQuery as jest.Mock).mockReset()
    ;(useSchemePerformanceQuery as jest.Mock).mockReset()
    ;(useSubmissionStatusQuery as jest.Mock).mockReset()
    ;(useWaterQuantityPeriodicQuery as jest.Mock).mockReset()
    ;(useTenantBoundariesQuery as jest.Mock).mockReset()
    mockUseParams.mockReturnValue({})
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useDistrictSchemeBlockLookupQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useBlockSchemePanchayatLookupQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useLocationHierarchyQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useNationalDashboardQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useNationalSchemeRegularityPeriodicQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
    })
    ;(useOutageReasonsPeriodicQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useOutageReasonsQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useReadingComplianceQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useReadingSubmissionRateQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useSchemeRegularityPeriodicQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
    })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useSubmissionStatusQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useWaterQuantityPeriodicQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
    })
    ;(useTenantBoundariesQuery as jest.Mock).mockReturnValue({ data: undefined })
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
    expect(useNationalSchemeRegularityPeriodicQuery).toHaveBeenCalledWith({
      params: {
        startDate: expect.any(String),
        endDate: expect.any(String),
        scale: expect.any(String),
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
    expect(useNationalSchemeRegularityPeriodicQuery).toHaveBeenCalledWith({
      params: null,
      enabled: false,
    })
  })

  it('ignores stale filters from the inactive tab when deciding the national landing view', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        filterTabIndex: 0,
        selectedDepartmentState: '501:department-state',
      })
    )

    renderWithProviders(<CentralDashboard />)

    expect(useNationalDashboardQuery).toHaveBeenCalledWith({
      params: {
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
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
    ;(useNationalSchemeRegularityPeriodicQuery as jest.Mock).mockReturnValue({
      data: {
        schemeCount: 4,
        scale: 'week',
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        periodCount: 2,
        metrics: [
          {
            periodStartDate: '2026-03-01',
            periodEndDate: '2026-03-07',
            totalSupplyDays: 10,
            totalWaterQuantity: 1500,
            averageRegularity: 48,
          },
          {
            periodStartDate: '2026-03-08',
            periodEndDate: '2026-03-14',
            totalSupplyDays: 11,
            totalWaterQuantity: 1750,
            averageRegularity: 52,
          },
        ],
      },
      isFetching: false,
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      quantityPerformanceData: Array<{ name: string; coverage: number; quantity: number }>
      regularityPerformanceData: Array<{ name: string; regularity: number }>
      quantityTimeTrendData: Array<{ period: string; value: number }>
      regularityTimeTrendData: Array<{ period: string; value: number }>
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
        coverage: 0.13,
        quantity: 3,
      })
    )
    expect(dashboardBodyProps.regularityPerformanceData[0]).toEqual(
      expect.objectContaining({
        name: 'Karnataka',
        regularity: 50,
      })
    )
    expect(dashboardBodyProps.quantityTimeTrendData).toEqual([
      { period: '01 Mar - 07 Mar', value: 1500 },
      { period: '08 Mar - 14 Mar', value: 1750 },
    ])
    expect(dashboardBodyProps.regularityTimeTrendData).toEqual([
      { period: '01 Mar - 07 Mar', value: 48 },
      { period: '08 Mar - 14 Mar', value: 52 },
    ])
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

  it('calls useWaterQuantityPeriodicQuery with the resolved params and passes mapped quantity trend data to dashboard body', () => {
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

    const selectedDuration = getPreviousPeriodRange('2026-03-22', '2026-03-31')
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        selectedDuration,
      })
    )
    ;(useWaterQuantityPeriodicQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 10,
        startDate: selectedDuration.startDate,
        endDate: selectedDuration.endDate,
        scale: 'day',
        metrics: [
          {
            periodStartDate: '2026-03-12',
            periodEndDate: '2026-03-12',
            averageWaterQuantity: 87,
          },
          {
            periodStartDate: '2026-03-13',
            periodEndDate: '2026-03-13',
            averageWaterQuantity: 91,
          },
        ],
      },
      isFetching: false,
      isAwaitingParams: false,
    })

    renderWithProviders(<CentralDashboard />)

    expect(useWaterQuantityPeriodicQuery).toHaveBeenCalledWith({
      params: {
        lgdId: 10,
        startDate: selectedDuration.startDate,
        endDate: selectedDuration.endDate,
        scale: 'day',
      },
      enabled: true,
    })

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      quantityTimeTrendData: Array<{ period: string; value: number }>
      isQuantityTimeTrendLoading: boolean
    }>()

    expect(dashboardBodyProps.quantityTimeTrendData).toEqual([
      { period: '12 Mar', value: 87 },
      { period: '13 Mar', value: 91 },
    ])
    expect(dashboardBodyProps.isQuantityTimeTrendLoading).toBe(false)
  })

  it('uses the analytics id from village filter values for village periodic charts', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'district=11:211:sangareddy&block=22:322:patancheru&gramPanchayat=33:433:ismailkhanpet&village=44:544:rudraram'
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

    expect(useWaterQuantityPeriodicQuery).toHaveBeenCalledWith({
      params: {
        lgdId: 544,
        startDate: expect.any(String),
        endDate: expect.any(String),
        scale: expect.any(String),
      },
      enabled: true,
    })
    expect(useSchemeRegularityPeriodicQuery).toHaveBeenCalledWith({
      params: {
        lgdId: 544,
        startDate: expect.any(String),
        endDate: expect.any(String),
        scale: expect.any(String),
      },
      enabled: true,
    })
  })

  it('passes isQuantityTimeTrendLoading=true to dashboard body while useWaterQuantityPeriodicQuery is loading', () => {
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
    ;(useWaterQuantityPeriodicQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: true,
      isAwaitingParams: false,
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      isQuantityTimeTrendLoading: boolean
    }>()

    expect(dashboardBodyProps.isQuantityTimeTrendLoading).toBe(true)
  })

  it('does not fall back to dashboard demandSupply for filtered quantity and regularity charts', () => {
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
        data: [{ id: 10, lgdCode: 110, title: 'Telangana' }],
      },
    })
    ;(useWaterQuantityPeriodicQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
      isAwaitingParams: false,
    })
    ;(useSchemeRegularityPeriodicQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      quantityTimeTrendData: Array<{ period: string; value: number }>
      regularityTimeTrendData: Array<{ period: string; value: number }>
    }>()

    expect(dashboardBodyProps.quantityTimeTrendData).toEqual([])
    expect(dashboardBodyProps.regularityTimeTrendData).toEqual([])
  })

  it('derives village KPI cards from periodic village analytics', () => {
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        selectedDuration: {
          startDate: '2026-03-25',
          endDate: '2026-03-26',
        },
      })
    )
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'district=25:25:lakhimpur&block=199:199:boginadi&gramPanchayat=2093:2093:bhimpara&village=19501:19501:no-2-ghagarmukh'
      ),
      jest.fn(),
    ])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 18, tenantCode: 'AS' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 1, lgdCode: 1, title: 'Assam' }],
      },
    })
    ;(useWaterQuantityPeriodicQuery as jest.Mock).mockImplementation((options: unknown) => {
      const params = (options as { params?: { startDate?: string } } | undefined)?.params
      return {
        data:
          params?.startDate === '2026-03-23'
            ? {
                lgdId: 19501,
                departmentId: 0,
                scale: 'day',
                startDate: '2026-03-23',
                endDate: '2026-03-24',
                periodCount: 2,
                metrics: [
                  {
                    periodStartDate: '2026-03-23',
                    periodEndDate: '2026-03-23',
                    averageWaterQuantity: 30000,
                    householdCount: 0,
                    achievedFhtcCount: 500,
                    plannedFhtcCount: 448,
                  },
                  {
                    periodStartDate: '2026-03-24',
                    periodEndDate: '2026-03-24',
                    averageWaterQuantity: 30000,
                    householdCount: 0,
                    achievedFhtcCount: 500,
                    plannedFhtcCount: 448,
                  },
                ],
              }
            : {
                lgdId: 19501,
                departmentId: 0,
                scale: 'day',
                startDate: '2026-03-25',
                endDate: '2026-03-26',
                periodCount: 2,
                metrics: [
                  {
                    periodStartDate: '2026-03-25',
                    periodEndDate: '2026-03-25',
                    averageWaterQuantity: 41243,
                    householdCount: 0,
                    achievedFhtcCount: 501,
                    plannedFhtcCount: 448,
                  },
                  {
                    periodStartDate: '2026-03-26',
                    periodEndDate: '2026-03-26',
                    averageWaterQuantity: 50100,
                    householdCount: 0,
                    achievedFhtcCount: 500,
                    plannedFhtcCount: 448,
                  },
                ],
              },
        isFetching: false,
        isAwaitingParams: false,
      }
    })
    ;(useSchemeRegularityPeriodicQuery as jest.Mock).mockImplementation((options: unknown) => {
      const params = (options as { params?: { startDate?: string } } | undefined)?.params
      return {
        data:
          params?.startDate === '2026-03-23'
            ? {
                lgdId: 19501,
                departmentId: 0,
                schemeCount: 1,
                scale: 'day',
                startDate: '2026-03-23',
                endDate: '2026-03-24',
                periodCount: 2,
                metrics: [
                  {
                    periodStartDate: '2026-03-23',
                    periodEndDate: '2026-03-23',
                    totalSupplyDays: 0,
                    averageRegularity: 0,
                  },
                  {
                    periodStartDate: '2026-03-24',
                    periodEndDate: '2026-03-24',
                    totalSupplyDays: 0,
                    averageRegularity: 0,
                  },
                ],
              }
            : {
                lgdId: 19501,
                departmentId: 0,
                schemeCount: 1,
                scale: 'day',
                startDate: '2026-03-25',
                endDate: '2026-03-26',
                periodCount: 2,
                metrics: [
                  {
                    periodStartDate: '2026-03-25',
                    periodEndDate: '2026-03-25',
                    totalSupplyDays: 1,
                    averageRegularity: 100,
                  },
                  {
                    periodStartDate: '2026-03-26',
                    periodEndDate: '2026-03-26',
                    totalSupplyDays: 0,
                    averageRegularity: 0,
                  },
                ],
              },
        isFetching: false,
      }
    })

    renderWithProviders(<CentralDashboard />)

    const kpiProps = mockKPICard.mock.calls.slice(-3).map(
      (call) =>
        call[0] as {
          title: string
          value: string
          trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
        }
    )

    expect(kpiProps[0]?.title).toBe('Quantity in MLD')
    expect(kpiProps[0]?.value).toBe('0.05')
    expect(kpiProps[0]?.trend).toEqual(
      expect.objectContaining({ text: expect.stringContaining('vs last 30 days') })
    )
    expect(kpiProps[1]?.title).toBe('Quantity in LPCD')
    expect(kpiProps[1]?.value).toBe('18.3')
    expect(kpiProps[2]?.title).toBe('Regularity')
    expect(kpiProps[2]?.value).toBe('50.0%')
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
              totalAchievedFhtcCount: 500,
              totalPlannedFhtcCount: 550,
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
    expect(kpiProps[1]?.value).toBe('1,000')
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

  it('hydrates departmental filters and active tab from query params', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'departmentZone=601:department-zone&departmentCircle=701:department-circle&departmentDivision=801:department-division&departmentSubdivision=901:department-subdivision'
      ),
      jest.fn(),
    ])

    renderWithProviders(<CentralDashboard />)

    const dashboardFilterProps = getLatestDashboardFilterProps<{
      filterTabIndex: number
      selectedDepartmentState: string
      selectedDepartmentZone: string
      selectedDepartmentCircle: string
      selectedDepartmentDivision: string
      selectedDepartmentSubdivision: string
    }>()

    expect(dashboardFilterProps.filterTabIndex).toBe(1)
    expect(dashboardFilterProps.selectedDepartmentState).toBe('assam')
    expect(dashboardFilterProps.selectedDepartmentZone).toBe('601:department-zone')
    expect(dashboardFilterProps.selectedDepartmentCircle).toBe('701:department-circle')
    expect(dashboardFilterProps.selectedDepartmentDivision).toBe('801:department-division')
    expect(dashboardFilterProps.selectedDepartmentSubdivision).toBe('901:department-subdivision')
  })

  it('uses district data in Overall Performance table when a state is selected', () => {
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
            title: 'Sangareddy',
            totalWaterSuppliedLiters: 90_000_000,
            totalAchievedFhtcCount: 1000,
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
            title: 'Sangareddy',
            schemeCount: 3,
            totalSupplyDays: 45,
            averageRegularity: 0,
          },
        ],
      },
    })

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

  it('overrides reading submission status from analytics when a filtered view is open', () => {
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
    ;(useSubmissionStatusQuery as jest.Mock).mockReturnValue({
      data: {
        startDate: '2026-03-14',
        endDate: '2026-03-14',
        schemeCount: 12,
        compliantSubmissionCount: 7,
        anomalousSubmissionCount: 5,
      },
    })

    renderWithProviders(<CentralDashboard />)

    expect(useSubmissionStatusQuery).toHaveBeenCalledWith({
      params: {
        lgdId: expect.any(Number),
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })

    const dashboardBodyProps = getLatestDashboardBodyProps<{ data: DashboardData }>()

    expect(dashboardBodyProps.data.readingSubmissionStatus).toEqual([
      { label: 'Compliant Submissions', value: 7 },
      { label: 'Anomalous Submissions', value: 5 },
    ])
  })

  it('enables departmental submission status analytics from the selected department trail', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        filterTabIndex: 1,
        selectedDepartmentState: '501:department-state',
      })
    )
    ;(useSubmissionStatusQuery as jest.Mock).mockReturnValue({
      data: {
        startDate: '2026-03-14',
        endDate: '2026-03-14',
        schemeCount: 9,
        compliantSubmissionCount: 6,
        anomalousSubmissionCount: 3,
      },
    })

    renderWithProviders(<CentralDashboard />)

    expect(useSubmissionStatusQuery).toHaveBeenCalledWith({
      params: {
        departmentId: 501,
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })

    const dashboardBodyProps = getLatestDashboardBodyProps<{ data: DashboardData }>()

    expect(dashboardBodyProps.data.readingSubmissionStatus).toEqual([
      { label: 'Compliant Submissions', value: 6 },
      { label: 'Anomalous Submissions', value: 3 },
    ])
  })

  it('uses parentDepartmentId for departmental zone analytics in KPI and overall performance queries', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 17, tenantCode: 'AS' }],
      },
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        filterTabIndex: 1,
        selectedDepartmentState: '501:department-state',
        selectedDepartmentZone: '601:department-zone',
      })
    )

    renderWithProviders(<CentralDashboard />)

    expect(useAverageWaterSupplyPerRegionQuery).toHaveBeenCalledWith({
      params: {
        tenantId: 17,
        parentDepartmentId: 601,
        scope: 'child',
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })
    expect(useAverageSchemeRegularityQuery).toHaveBeenCalledWith({
      params: {
        parentDepartmentId: 601,
        scope: 'child',
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })
  })

  it('uses departmental hierarchy labels for the overall performance first column', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 17, tenantCode: 'AS' }],
      },
    })
    ;(useLocationHierarchyQuery as jest.Mock).mockReturnValue({
      data: {
        data: {
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Sub Division' }] },
          ],
        },
      },
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        filterTabIndex: 1,
        selectedDepartmentState: '501:department-state',
        selectedDepartmentZone: '601:department-zone',
      })
    )

    renderWithProviders(<CentralDashboard />)

    const overallPerformanceTableProps = mockOverallPerformanceTable.mock.calls.at(-1)?.[0] as {
      entityLabel: string
    }

    expect(overallPerformanceTableProps.entityLabel).toBe('Circle')
  })

  it('uses route state as the departmental root when no department zone is selected yet', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 17, tenantCode: 'AS' }],
      },
    })
    ;(useLocationHierarchyQuery as jest.Mock).mockReturnValue({
      data: {
        data: {
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Sub Division' }] },
          ],
        },
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockImplementation((args: unknown) => {
      const { parentId } = (args ?? {}) as { parentId?: number }

      if (parentId === undefined) {
        return {
          data: {
            data: [{ id: 501, title: 'Assam' }],
          },
        }
      }

      if (parentId === 501) {
        return {
          data: {
            data: [
              { id: 601, title: 'North Assam Zone' },
              { id: 602, title: 'Lower Assam Zone' },
            ],
          },
        }
      }

      return { data: undefined }
    })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReturnValue({
      data: {
        tenantId: 17,
        stateCode: 'AS',
        parentLgdLevel: 0,
        parentDepartmentLevel: 1,
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 2,
        childRegionCount: 2,
        schemes: [],
        childRegions: [
          {
            departmentId: 601,
            title: 'North Assam Zone',
            totalAchievedFhtcCount: 100,
            totalWaterSuppliedLiters: 30_000_000,
            schemeCount: 1,
            avgWaterSupplyPerScheme: 0,
          },
          {
            departmentId: 602,
            title: 'Lower Assam Zone',
            totalAchievedFhtcCount: 100,
            totalWaterSuppliedLiters: 45_000_000,
            schemeCount: 1,
            avgWaterSupplyPerScheme: 0,
          },
        ],
      },
    })
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 0,
        parentDepartmentId: 501,
        parentLgdLevel: 0,
        parentDepartmentLevel: 1,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 2,
        totalSupplyDays: 0,
        averageRegularity: 0,
        childRegionCount: 2,
        childRegions: [
          {
            departmentId: 601,
            title: 'North Assam Zone',
            schemeCount: 1,
            totalSupplyDays: 15,
            averageRegularity: 0,
          },
          {
            departmentId: 602,
            title: 'Lower Assam Zone',
            schemeCount: 1,
            totalSupplyDays: 18,
            averageRegularity: 0,
          },
        ],
      },
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        filterTabIndex: 1,
      })
    )

    renderWithProviders(<CentralDashboard />)

    const overallPerformanceTableProps = mockOverallPerformanceTable.mock.calls.at(-1)?.[0] as {
      entityLabel: string
      data: Array<{ name: string }>
    }
    const dashboardBodyProps = getLatestDashboardBodyProps<{ supplySubmissionRateLabel: string }>()

    expect(overallPerformanceTableProps.entityLabel).toBe('Zone')
    expect(overallPerformanceTableProps.data.map((row) => row.name)).toEqual([
      'North Assam Zone',
      'Lower Assam Zone',
    ])
    expect(dashboardBodyProps.supplySubmissionRateLabel).toBe('Zones')
  })

  it('filters stray departmental rows from overall performance using the loaded child options', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 17, tenantCode: 'AS' }],
      },
    })
    ;(useLocationHierarchyQuery as jest.Mock).mockReturnValue({
      data: {
        data: {
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Sub Division' }] },
          ],
        },
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockImplementation((args: unknown) => {
      const { parentId } = (args ?? {}) as { parentId?: number }

      if (parentId === undefined) {
        return {
          data: {
            data: [{ id: 501, title: 'Department State' }],
          },
        }
      }

      if (parentId === 501) {
        return {
          data: {
            data: [{ id: 601, title: 'North Zone' }],
          },
        }
      }

      if (parentId === 601) {
        return {
          data: {
            data: [{ id: 701, title: 'Silchar Circle' }],
          },
        }
      }

      if (parentId === 701) {
        return {
          data: {
            data: [{ id: 801, title: 'Silchar Division' }],
          },
        }
      }

      if (parentId === 801) {
        return {
          data: {
            data: [
              { id: 901, title: 'Sub Division A' },
              { id: 902, title: 'Sub Division B' },
            ],
          },
        }
      }

      return { data: undefined }
    })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReturnValue({
      data: {
        tenantId: 17,
        stateCode: 'AS',
        parentLgdLevel: 0,
        parentDepartmentLevel: 4,
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 4,
        childRegionCount: 4,
        schemes: [],
        childRegions: [
          {
            departmentId: 11,
            title: 'Arunachal Pradesh',
            totalAchievedFhtcCount: 100,
            totalWaterSuppliedLiters: 10_000_000,
            schemeCount: 1,
            avgWaterSupplyPerScheme: 0,
          },
          {
            departmentId: 12,
            title: 'Bihar',
            totalAchievedFhtcCount: 100,
            totalWaterSuppliedLiters: 10_000_000,
            schemeCount: 1,
            avgWaterSupplyPerScheme: 0,
          },
          {
            departmentId: 901,
            title: 'Sub Division A',
            totalAchievedFhtcCount: 100,
            totalWaterSuppliedLiters: 30_000_000,
            schemeCount: 1,
            avgWaterSupplyPerScheme: 0,
          },
          {
            departmentId: 902,
            title: 'Sub Division B',
            totalAchievedFhtcCount: 100,
            totalWaterSuppliedLiters: 45_000_000,
            schemeCount: 1,
            avgWaterSupplyPerScheme: 0,
          },
        ],
      },
    })
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 0,
        parentDepartmentId: 801,
        parentLgdLevel: 0,
        parentDepartmentLevel: 4,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 4,
        totalSupplyDays: 0,
        averageRegularity: 0,
        childRegionCount: 4,
        childRegions: [
          {
            departmentId: 901,
            title: 'Sub Division A',
            schemeCount: 1,
            totalSupplyDays: 15,
            averageRegularity: 0,
          },
          {
            departmentId: 902,
            title: 'Sub Division B',
            schemeCount: 1,
            totalSupplyDays: 18,
            averageRegularity: 0,
          },
        ],
      },
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        filterTabIndex: 1,
        selectedDepartmentState: '501:department-state',
        selectedDepartmentZone: '601:department-zone',
        selectedDepartmentCircle: '701:department-circle',
        selectedDepartmentDivision: '801:department-division',
      })
    )

    renderWithProviders(<CentralDashboard />)

    const overallPerformanceTableProps = mockOverallPerformanceTable.mock.calls.at(-1)?.[0] as {
      entityLabel: string
      data: Array<{ name: string }>
    }

    expect(overallPerformanceTableProps.entityLabel).toBe('Sub Division')
    expect(overallPerformanceTableProps.data.map((row) => row.name)).toEqual([
      'Sub Division A',
      'Sub Division B',
    ])
  })

  it('treats departmental subdivision as a leaf selection for the detail dashboard flow', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 17, tenantCode: 'AS' }],
      },
    })
    ;(useSchemePerformanceQuery as jest.Mock).mockReturnValue({
      data: {
        parentLgdId: 0,
        parentDepartmentId: 901,
        parentLgdCName: '',
        parentDepartmentCName: '',
        parentLgdTitle: '',
        parentDepartmentTitle: 'Silchar I',
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        activeSchemeCount: 1,
        inactiveSchemeCount: 0,
        topSchemeCount: 1,
        topSchemes: [
          {
            schemeId: 1234,
            schemeName: 'Subdivision Scheme',
            immediateParentDepartmentTitle: 'Silchar I',
            immediateParentLgdTitle: 'Silchar I',
            reportingRate: 100,
            totalWaterSupplied: 42,
          },
        ],
      },
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        filterTabIndex: 1,
        selectedDepartmentState: '501:department-state',
        selectedDepartmentZone: '601:department-zone',
        selectedDepartmentCircle: '701:department-circle',
        selectedDepartmentDivision: '801:department-division',
        selectedDepartmentSubdivision: '901:department-subdivision',
      })
    )

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      selectedVillage: string
      schemeId?: number
    }>()

    expect(dashboardBodyProps.selectedVillage).toBe('901:department-subdivision')
    expect(dashboardBodyProps.schemeId).toBe(1234)
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
            totalWaterSuppliedLiters: 90_000_000,
            totalAchievedFhtcCount: 1000,
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

  it('keeps dashboard performance table props empty when query params include stable id-prefixed values', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'district=101:211:sangareddy&block=202:322:patancheru&gramPanchayat=303:433:isnapur'
      ),
      jest.fn(),
    ])

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      villageTableData: Array<{ name: string }>
      gramPanchayatTableData: Array<{ name: string }>
      blockTableData: Array<{ name: string }>
    }>()

    expect(dashboardBodyProps.blockTableData).toEqual([])
    expect(dashboardBodyProps.gramPanchayatTableData).toEqual([])
    expect(dashboardBodyProps.villageTableData).toEqual([])
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
    expect(dashboardBodyProps.waterSupplyOutageDistributionData).toEqual([])
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

  it('maps outage periodic analytics into the outage time trend', () => {
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
    ;(useOutageReasonsPeriodicQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 10,
        departmentId: 0,
        scale: 'week',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        periodCount: 2,
        metrics: [
          {
            periodStartDate: '2026-03-01',
            periodEndDate: '2026-03-07',
            outageReasonSchemeCount: {
              no_electricity: 3,
              draught: 1,
            },
          },
          {
            periodStartDate: '2026-03-08',
            periodEndDate: '2026-03-14',
            outageReasonSchemeCount: {
              no_electricity: 2,
            },
          },
        ],
      },
    })

    renderWithProviders(<CentralDashboard />)

    const dashboardBodyProps = getLatestDashboardBodyProps<{
      data: DashboardData
    }>()

    expect(dashboardBodyProps.data.supplyOutageTrend).toEqual([
      { period: '01 Mar - 07 Mar', value: 4 },
      { period: '08 Mar - 14 Mar', value: 2 },
    ])
  })

  it('enables outage reasons analytics for a selected village using the village LGD id', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: {
        ...mockDashboardData,
        level: 'village',
      },
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'district=44:404:chirang&block=55:505:sidli-chirang&gramPanchayat=66:606:santipur&village=77:707:kherkheria-grant'
      ),
      jest.fn(),
    ])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 18, tenantCode: 'AS' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockImplementation((args: unknown) => {
      const { parentId } = (args ?? {}) as { parentId?: number }

      if (parentId === undefined) {
        return {
          data: {
            data: [{ id: 18, title: 'Assam', lgdCode: 18 }],
          },
        }
      }

      if (parentId === 18) {
        return {
          data: {
            data: [{ id: 44, title: 'Chirang', lgdCode: 404 }],
          },
        }
      }

      if (parentId === 44) {
        return {
          data: {
            data: [{ id: 55, title: 'Sidli-Chirang', lgdCode: 505 }],
          },
        }
      }

      if (parentId === 55) {
        return {
          data: {
            data: [{ id: 66, title: 'Santipur', lgdCode: 606 }],
          },
        }
      }

      if (parentId === 66) {
        return {
          data: {
            data: [{ id: 77, title: 'Kherkheria Grant', lgdCode: 707 }],
          },
        }
      }

      return { data: undefined }
    })

    renderWithProviders(<CentralDashboard />)

    expect(useOutageReasonsQuery).toHaveBeenCalledWith({
      params: {
        startDate: expect.any(String),
        endDate: expect.any(String),
        parentLgdId: 707,
      },
      enabled: true,
    })
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
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockImplementation(
      (() => {
        let callCount = 0

        return () => {
          const sequenceIndex = callCount % 3
          callCount += 1

          if (sequenceIndex === 0) {
            return {
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
                    totalWaterSuppliedLiters: 90_000_000,
                    totalAchievedFhtcCount: 1000,
                    schemeCount: 1,
                    avgWaterSupplyPerScheme: 0,
                  },
                ],
              },
            }
          }

          if (sequenceIndex === 1) {
            return {
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
                    totalAchievedFhtcCount: 1000,
                    totalWaterSuppliedLiters: 90_000_000,
                    supplyDays: 30,
                    avgLitersPerHousehold: 0,
                  },
                  {
                    schemeId: 2,
                    schemeName: 'Scheme 2',
                    totalAchievedFhtcCount: 1000,
                    totalWaterSuppliedLiters: 60_000_000,
                    supplyDays: 30,
                    avgLitersPerHousehold: 0,
                  },
                ],
                childRegions: [],
              },
            }
          }

          return {
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
                  totalAchievedFhtcCount: 1000,
                  totalWaterSuppliedLiters: 120_000_000,
                  supplyDays: 30,
                  avgLitersPerHousehold: 0,
                },
                {
                  schemeId: 2,
                  schemeName: 'Scheme 2',
                  totalAchievedFhtcCount: 1000,
                  totalWaterSuppliedLiters: 60_000_000,
                  supplyDays: 30,
                  avgLitersPerHousehold: 0,
                },
              ],
              childRegions: [],
            },
          }
        }
      })()
    )
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockImplementation(
      (() => {
        let callCount = 0

        return () => {
          const sequenceIndex = callCount % 3
          callCount += 1

          if (sequenceIndex === 0) {
            return {
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
            }
          }

          if (sequenceIndex === 1) {
            return {
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
            }
          }

          return {
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
          }
        }
      })()
    )

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
      ).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      waterSupplyQueryCalls.filter(
        (call) =>
          call?.enabled === true &&
          call?.params?.tenantId === 16 &&
          call?.params?.parentLgdId === 10 &&
          call?.params?.scope === 'current'
      ).length
    ).toBeGreaterThanOrEqual(2)
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

  it('keeps KPI trends neutral when current values are zero even if the previous period had data', () => {
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
          stateWiseQuantityPerformance: [],
          stateWiseRegularity: [],
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
              stateCode: 'TG',
              stateTitle: 'Telangana',
              totalWaterSuppliedLiters: 150_000_000,
              totalAchievedFhtcCount: 2000,
            },
          ],
          stateWiseRegularity: [
            {
              stateCode: 'TG',
              stateTitle: 'Telangana',
              schemeCount: 2,
              totalSupplyDays: 42,
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
          trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
        }
    )

    expect(kpiProps[0]?.trend).toEqual({ direction: 'neutral', text: '0% vs last 30 days' })
    expect(kpiProps[1]?.trend).toEqual({ direction: 'neutral', text: '0 LPCD vs last month' })
    expect(kpiProps[2]?.trend).toEqual({ direction: 'neutral', text: '0% vs last month' })
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

  it('resolves legacy locationId-slug values to the loaded analytics id for scheme performance analytics', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockUseSearchParams.mockReturnValue([new URLSearchParams('district=44:sangareddy'), jest.fn()])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'telangana', label: 'Telangana', tenantId: 16, tenantCode: 'TG' }],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockImplementation((args: unknown) => {
      const { parentId } = (args ?? {}) as { parentId?: number }

      if (parentId === undefined) {
        return {
          data: {
            data: [{ id: 1, title: 'Telangana' }],
          },
        }
      }

      if (parentId === 1) {
        return {
          data: {
            data: [{ id: 44, title: 'Sangareddy', lgdCode: 404 }],
          },
        }
      }

      return { data: undefined }
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
      search: '?district=sangareddy&tab=administrative',
    })
  })

  it('resolves LGD analytics ids from loaded options when administrative URL params use slugs', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'telangana' })
    mockUseSearchParams.mockReturnValue([new URLSearchParams('district=sangareddy'), jest.fn()])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        states: [
          {
            value: 'telangana',
            label: 'Telangana',
            tenantId: 16,
            tenantCode: 'TG',
          },
        ],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock)
      .mockReturnValueOnce({
        data: {
          data: [
            {
              id: 101,
              title: 'Telangana',
              lgdCode: 10,
            },
          ],
        },
      })
      .mockReturnValueOnce({
        data: {
          data: [
            {
              id: 202,
              title: 'Sangareddy',
              lgdCode: 404,
            },
          ],
        },
      })
      .mockReturnValue({ data: undefined })

    renderWithProviders(<CentralDashboard />)

    expect(useTenantBoundariesQuery).toHaveBeenCalledWith({
      params: {
        tenantId: 16,
        parentLgdId: 404,
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })
  })

  it('updates URL with departmental query params when departmental selections change', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()])

    renderWithProviders(<CentralDashboard />)

    const dashboardFilterProps = getLatestDashboardFilterProps<{
      onTabChange: (value: number) => void
      onDepartmentZoneChange: (value: string) => void
    }>()
    dashboardFilterProps.onTabChange(1)
    dashboardFilterProps.onDepartmentZoneChange('601:department-zone')

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenNthCalledWith(1, {
      pathname: '/assam',
      search: '?departmentZone=601%3Adepartment-zone',
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
    expect(dashboardBodyProps.waterSupplyOutagesData).toEqual([])
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

  it('renders the dashboard shell with empty fallback data when dashboard data is unavailable', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<CentralDashboard />)

    expect(screen.getByTestId('dashboard-filters')).toBeTruthy()
    expect(screen.getByTestId('dashboard-body')).toBeTruthy()
  })

  it('does not block the dashboard shell while the legacy dashboard request is loading', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    renderWithProviders(<CentralDashboard />)

    expect(screen.getByTestId('dashboard-filters')).toBeTruthy()
    expect(screen.getByTestId('dashboard-body')).toBeTruthy()
  })

  it('uses tenant boundary analytics for departmental map rendering', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'madhya-pradesh' })
    mockUseSearchParams.mockReturnValue([new URLSearchParams('departmentZone=201'), jest.fn()])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        states: [
          {
            value: 'madhya-pradesh',
            label: 'Madhya Pradesh',
            tenantId: 10,
            tenantCode: 'mp',
          },
        ],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock)
      .mockReturnValueOnce({
        data: {
          data: [
            {
              id: 101,
              title: 'Madhya Pradesh',
              lgdCode: 10,
            },
          ],
        },
      })
      .mockReturnValueOnce({
        data: {
          data: [
            {
              id: 201,
              title: 'Bhopal Zone',
              lgdCode: 601,
            },
          ],
        },
      })
      .mockReturnValue({ data: undefined })
    ;(useTenantBoundariesQuery as jest.Mock).mockReturnValue({
      data: {
        tenantId: 10,
        stateCode: 'MP',
        childBoundaryCount: 1,
        childRegions: [
          {
            childDepartmentId: 110,
            childDepartmentTitle: 'Child Region Title',
            averageSchemeRegularity: 0.78,
            readingSubmissionRate: 0.86,
            averagePerformanceScore: 0.64,
            boundaryGeoJson: {
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
            },
          },
        ],
      },
    })

    renderWithProviders(<CentralDashboard />)

    expect(useTenantBoundariesQuery).toHaveBeenLastCalledWith({
      params: {
        tenantId: 10,
        parentDepartmentId: 201,
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })

    const mapProps = getLatestIndiaMapChartProps<{
      data: Array<{ name: string; boundaryGeoJson?: unknown; regularity: number; quantity: number }>
      mapName: string
      fallbackToIndiaMap: boolean
      onStateClick?: unknown
    }>()

    expect(mapProps.mapName).toBe('tenant-boundary-department-201')
    expect(mapProps.fallbackToIndiaMap).toBe(false)
    expect(mapProps.onStateClick).toBeUndefined()
    expect(mapProps.data).toEqual([
      expect.objectContaining({
        name: 'Child Region Title',
        regularity: 78,
        boundaryGeoJson: {
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
        },
      }),
    ])
  })

  it('does not fall back to the India map for filtered LGD selections', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        states: [
          {
            value: 'assam',
            label: 'Assam',
            tenantId: 17,
            tenantCode: 'AS',
          },
        ],
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({
      data: {
        data: [
          {
            id: 101,
            title: 'Assam',
            lgdCode: 18,
          },
        ],
      },
    })
    ;(useTenantBoundariesQuery as jest.Mock).mockReturnValue({
      data: {
        tenantId: 17,
        stateCode: 'AS',
        childBoundaryCount: 1,
        childRegions: [
          {
            childLgdId: 201,
            childLgdTitle: 'Kamrup',
            averageSchemeRegularity: 0.78,
            boundaryGeoJson: {
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
            },
          },
        ],
      },
    })

    renderWithProviders(<CentralDashboard />)

    expect(useTenantBoundariesQuery).toHaveBeenLastCalledWith({
      params: {
        tenantId: 17,
        parentLgdId: 18,
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      enabled: true,
    })

    const mapProps = getLatestIndiaMapChartProps<{
      data: Array<{ name: string; boundaryGeoJson?: unknown; regularity: number }>
      mapName: string
      fallbackToIndiaMap: boolean
      onStateClick?: unknown
    }>()

    expect(mapProps.mapName).toBe('tenant-boundary-lgd-18')
    expect(mapProps.fallbackToIndiaMap).toBe(false)
    expect(mapProps.onStateClick).toBeUndefined()
    expect(mapProps.data).toEqual([
      expect.objectContaining({
        name: 'Kamrup',
        regularity: 78,
        boundaryGeoJson: {
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
        },
      }),
    ])
  })

  it('uses loaded departmental labels when tenant boundary regions are unnamed', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: {
        ...mockDashboardData,
        mapData: [
          {
            id: 'region-1',
            name: 'Region 1',
            coverage: 65,
            regularity: 72,
            continuity: 0,
            quantity: 54,
            compositeScore: 64,
            status: 'needs-attention',
          },
          {
            id: 'region-2',
            name: 'Region 2',
            coverage: 60,
            regularity: 70,
            continuity: 0,
            quantity: 50,
            compositeScore: 60,
            status: 'needs-attention',
          },
        ],
      },
      isLoading: false,
      error: null,
    })
    mockUseParams.mockReturnValue({ stateSlug: 'assam' })
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({
      data: {
        states: [
          {
            value: 'assam',
            label: 'Assam',
            tenantId: 17,
            tenantCode: 'AS',
          },
        ],
      },
    })
    ;(useLocationHierarchyQuery as jest.Mock).mockReturnValue({
      data: {
        data: {
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Sub Division' }] },
          ],
        },
      },
    })
    ;(useLocationChildrenQuery as jest.Mock).mockImplementation((args: unknown) => {
      const { parentId } = (args ?? {}) as { parentId?: number }

      if (parentId === undefined) {
        return {
          data: {
            data: [{ id: 501, title: 'Assam' }],
          },
        }
      }

      if (parentId === 501) {
        return {
          data: {
            data: [
              { id: 601, title: 'North Assam Zone' },
              { id: 602, title: 'Lower Assam Zone' },
            ],
          },
        }
      }

      return { data: undefined }
    })
    ;(useTenantBoundariesQuery as jest.Mock).mockReturnValue({
      data: {
        tenantId: 17,
        stateCode: 'AS',
        childBoundaryCount: 2,
        childRegions: [
          {
            childDepartmentId: 601,
            averageSchemeRegularity: 0.78,
            readingSubmissionRate: 0.86,
            averagePerformanceScore: 0.64,
            boundaryGeoJson: {
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
            },
          },
          {
            childDepartmentId: 602,
            averageSchemeRegularity: 0.8,
            readingSubmissionRate: 0.88,
            averagePerformanceScore: 0.66,
            boundaryGeoJson: {
              type: 'Polygon',
              coordinates: [
                [
                  [2, 2],
                  [3, 2],
                  [3, 3],
                  [2, 3],
                  [2, 2],
                ],
              ],
            },
          },
        ],
      },
    })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReturnValue({
      data: {
        tenantId: 17,
        stateCode: 'AS',
        parentLgdLevel: 0,
        parentDepartmentLevel: 1,
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 2,
        childRegionCount: 2,
        schemes: [],
        childRegions: [
          {
            departmentId: 601,
            title: 'North Assam Zone',
            totalAchievedFhtcCount: 100,
            totalWaterSuppliedLiters: 0,
            schemeCount: 1,
            avgWaterSupplyPerScheme: 0,
          },
          {
            departmentId: 602,
            title: 'Lower Assam Zone',
            totalAchievedFhtcCount: 100,
            totalWaterSuppliedLiters: 318_000,
            schemeCount: 1,
            avgWaterSupplyPerScheme: 0,
          },
        ],
      },
    })
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReturnValue({
      data: {
        lgdId: 0,
        parentDepartmentId: 501,
        parentLgdLevel: 0,
        parentDepartmentLevel: 1,
        scope: 'child',
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 2,
        totalSupplyDays: 0,
        averageRegularity: 0,
        childRegionCount: 2,
        childRegions: [
          {
            departmentId: 601,
            title: 'North Assam Zone',
            schemeCount: 1,
            totalSupplyDays: 4.5,
            averageRegularity: 0,
          },
          {
            departmentId: 602,
            title: 'Lower Assam Zone',
            schemeCount: 1,
            totalSupplyDays: 4.5,
            averageRegularity: 0,
          },
        ],
      },
    })
    window.localStorage.setItem(
      'central-dashboard-filters',
      JSON.stringify({
        filterTabIndex: 1,
      })
    )

    renderWithProviders(<CentralDashboard />)

    const mapProps = getLatestIndiaMapChartProps<{
      data: Array<{ name: string }>
    }>()

    expect(mapProps.data.map((item) => item.name)).toEqual(['North Assam Zone', 'Lower Assam Zone'])
    expect(mapProps.data).toEqual([
      expect.objectContaining({
        name: 'North Assam Zone',
        quantity: 0,
        regularity: 15,
      }),
      expect.objectContaining({
        name: 'Lower Assam Zone',
        quantity: 21.2,
        regularity: 15,
      }),
    ])
  })
})

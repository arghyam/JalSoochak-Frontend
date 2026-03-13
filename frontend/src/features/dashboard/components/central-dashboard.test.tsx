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

const mockNavigate = jest.fn()
const mockUseParams = jest.fn(() => ({}))
const mockUseSearchParams = jest.fn(() => [new URLSearchParams(), jest.fn()])
const mockDashboardFilters = jest.fn((_props: unknown) => <div data-testid="dashboard-filters" />)
const mockDashboardBody = jest.fn((_props: unknown) => <div data-testid="dashboard-body" />)
const mockIndiaMapChart = jest.fn((_props: unknown) => <div data-testid="india-map-chart" />)
const mockOverallPerformanceTable = jest.fn((_props: unknown) => (
  <div data-testid="overall-performance-table" />
))

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

jest.mock('./filters/dashboard-filters', () => ({
  DashboardFilters: (props: unknown) => mockDashboardFilters(props),
}))

jest.mock('./kpi-card', () => ({
  KPICard: ({ title }: { title: string }) => <div>{title}</div>,
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
    mockUseParams.mockReturnValue({})
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()])
    ;(useLocationSearchQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useLocationChildrenQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useAverageWaterSupplyPerRegionQuery as jest.Mock).mockReturnValue({ data: undefined })
    ;(useAverageSchemeRegularityQuery as jest.Mock).mockReturnValue({ data: undefined })
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

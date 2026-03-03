import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData } from '../types'
import { CentralDashboard } from './central-dashboard'
import { useDashboardData } from '../hooks/use-dashboard-data'

const mockNavigate = jest.fn()
const mockUseParams = jest.fn(() => ({}))
const mockUseSearchParams = jest.fn(() => [new URLSearchParams(), jest.fn()])
const mockDashboardFilters = jest.fn((_props: unknown) => <div data-testid="dashboard-filters" />)
const mockDashboardBody = jest.fn((_props: unknown) => <div data-testid="dashboard-body" />)
const mockIndiaMapChart = jest.fn((_props: unknown) => <div data-testid="india-map-chart" />)

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
  AllStatesTable: () => <div data-testid="all-states-table" />,
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
  imageSubmissionStatus: [{ label: 'On time', value: 80 }],
  photoEvidenceCompliance: [
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
      district: 'District 1',
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
    mockUseParams.mockReturnValue({})
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()])
  })

  it('renders Overall Performance table panel for central view', () => {
    ;(useDashboardData as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<CentralDashboard />)

    expect(screen.getByText('Overall Performance')).toBeTruthy()
    expect(screen.getByTestId('all-states-table')).toBeTruthy()
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
})

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { ComponentProps } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData, EntityPerformance, PumpOperatorPerformanceData } from '../../types'
import { DashboardBody } from './dashboard-body'

const mockMetricPerformanceChart = jest.fn(
  (_props: { data: EntityPerformance[]; metric: string }) => (
    <div data-testid="metric-performance-chart" />
  )
)

jest.mock('../charts', () => ({
  MetricPerformanceChart: (props: { data: EntityPerformance[]; metric: string }) =>
    mockMetricPerformanceChart(props),
  SupplySubmissionRateChart: () => <div data-testid="supply-submission-rate-chart" />,
  IssueTypeBreakdownChart: () => <div data-testid="issue-type-breakdown-chart" />,
}))

jest.mock('./state-ut-dashboard', () => ({
  StateUtDashboardScreen: () => <div data-testid="state-ut-dashboard-screen" />,
}))

jest.mock('./district-dashboard', () => ({
  DistrictDashboardScreen: () => <div data-testid="district-dashboard-screen" />,
}))

jest.mock('./block-dashboard', () => ({
  BlockDashboardScreen: () => <div data-testid="block-dashboard-screen" />,
}))

jest.mock('./gram-panchayat-dashboard', () => ({
  GramPanchayatDashboardScreen: () => <div data-testid="gram-panchayat-dashboard-screen" />,
}))

jest.mock('./village-dashboard', () => ({
  VillageDashboardScreen: () => <div data-testid="village-dashboard-screen" />,
}))

const mockEntityData: EntityPerformance[] = [
  {
    id: 'e1',
    name: 'Alpha',
    coverage: 55,
    regularity: 62,
    continuity: 0,
    quantity: 48,
    compositeScore: 56,
    status: 'needs-attention',
  },
  {
    id: 'e2',
    name: 'Beta',
    coverage: 72,
    regularity: 74,
    continuity: 0,
    quantity: 65,
    compositeScore: 71,
    status: 'good',
  },
]

const mockDashboardData: DashboardData = {
  level: 'central',
  kpis: {
    totalSchemes: 100,
    totalRuralHouseholds: 1000,
    functionalTapConnections: 800,
  },
  mapData: mockEntityData,
  demandSupply: [{ period: 'Jan', demand: 90, supply: 85 }],
  imageSubmissionStatus: [{ label: 'On time', value: 80 }],
  photoEvidenceCompliance: [
    {
      id: 'pe-1',
      name: 'Operator 1',
      village: 'Village 1',
      lastSubmission: '2026-02-20',
      readingValue: '120',
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

const mockOperatorsPerformanceTable: PumpOperatorPerformanceData[] = [
  {
    id: 'op-1',
    name: 'Operator 1',
    block: 'Block 1',
    village: 'Village 1',
    reportingRate: 90,
    photoCompliance: 88,
    waterSupplied: 200,
  },
]

function renderDashboardBody(overrides: Partial<ComponentProps<typeof DashboardBody>> = {}) {
  return renderWithProviders(
    <DashboardBody
      data={mockDashboardData}
      isStateSelected={false}
      isDistrictSelected={false}
      isBlockSelected={false}
      isGramPanchayatSelected={false}
      selectedVillage=""
      performanceState=""
      onPerformanceStateChange={jest.fn()}
      districtTableData={mockEntityData}
      blockTableData={mockEntityData}
      gramPanchayatTableData={mockEntityData}
      villageTableData={mockEntityData}
      supplySubmissionRateData={mockEntityData}
      supplySubmissionRateLabel="States/UTs"
      waterSupplyOutagesData={mockDashboardData.waterSupplyOutages}
      pumpOperatorsTotal={12}
      operatorsPerformanceTable={mockOperatorsPerformanceTable}
      villagePhotoEvidenceRows={mockDashboardData.photoEvidenceCompliance}
      {...overrides}
    />
  )
}

describe('DashboardBody', () => {
  beforeEach(() => {
    mockMetricPerformanceChart.mockClear()
  })

  it('wires performance selectors to map-data options', () => {
    renderDashboardBody()

    const quantitySelect = screen.getByRole('combobox', { name: 'Quantity performance state' })
    const regularitySelect = screen.getByRole('combobox', {
      name: 'Regularity performance state',
    })

    expect(quantitySelect).toBeTruthy()
    expect(regularitySelect).toBeTruthy()
    expect(screen.getAllByRole('option', { name: 'Alpha' })).toHaveLength(2)
    expect(screen.getAllByRole('option', { name: 'Beta' })).toHaveLength(2)
  })

  it('filters metric chart data by selected performance state', () => {
    mockMetricPerformanceChart.mockClear()

    renderDashboardBody({ performanceState: 'Beta' })

    const metricChartCalls = mockMetricPerformanceChart.mock.calls as Array<
      [{ data: EntityPerformance[]; metric: string }]
    >

    expect(metricChartCalls).toHaveLength(2)
    expect(metricChartCalls[0][0].data).toHaveLength(1)
    expect(metricChartCalls[0][0].data[0]?.name).toBe('Beta')
    expect(metricChartCalls[1][0].data).toHaveLength(1)
    expect(metricChartCalls[1][0].data[0]?.name).toBe('Beta')
  })

  it('calls onPerformanceStateChange from selector changes', () => {
    const onPerformanceStateChange = jest.fn()
    renderDashboardBody({ onPerformanceStateChange })

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'Alpha' } })
    fireEvent.change(selects[1], { target: { value: 'Beta' } })

    expect(onPerformanceStateChange).toHaveBeenNthCalledWith(1, 'Alpha')
    expect(onPerformanceStateChange).toHaveBeenNthCalledWith(2, 'Beta')
  })

  it('renders outage reasons pie card and reading submission card in central default view', () => {
    renderDashboardBody()

    expect(screen.getByText('Supply Outage Reasons')).toBeTruthy()
    expect(screen.getByTestId('issue-type-breakdown-chart')).toBeTruthy()
    expect(screen.getByText('Reading Submission Rate')).toBeTruthy()
    expect(screen.getByTestId('supply-submission-rate-chart')).toBeTruthy()
    expect(screen.queryByText('All States/UTs')).toBeNull()
  })

  it('renders village screen only when village is selected', () => {
    renderDashboardBody({ selectedVillage: 'Village 1' })

    expect(screen.getByTestId('village-dashboard-screen')).toBeTruthy()
    expect(screen.queryByText('Supply Outage Reasons')).toBeNull()
    expect(screen.queryByText('Reading Submission Rate')).toBeNull()
  })
})

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData, EntityPerformance, PumpOperatorPerformanceData } from '../../types'
import { BlockDashboardScreen } from './block-dashboard'

const mockMetricPerformanceChart = jest.fn((_props: unknown) => (
  <div data-testid="metric-performance-chart" />
))
const mockMonthlyTrendChart = jest.fn((_props: unknown) => (
  <div data-testid="monthly-trend-chart" />
))
const mockSupplyOutageReasonsChart = jest.fn((_props: unknown) => (
  <div data-testid="supply-outage-reasons-chart" />
))
const mockSupplyOutageDistributionChart = jest.fn((_props: unknown) => (
  <div data-testid="supply-outage-distribution-chart" />
))
const mockActiveSchemesChart = jest.fn((_props: unknown) => (
  <div data-testid="pump-operators-chart" />
))
const mockReadingSubmissionStatusChart = jest.fn((_props: unknown) => (
  <div data-testid="reading-submission-status-chart" />
))
const mockReadingSubmissionRateChart = jest.fn((_props: unknown) => (
  <div data-testid="reading-submission-rate-chart" />
))
const mockSchemePerformanceTable = jest.fn((_props: unknown) => (
  <div data-testid="pump-operators-performance-table" />
))
const mockReadingComplianceTable = jest.fn((_props: unknown) => (
  <div data-testid="reading-compliance-table" />
))

jest.mock('../charts', () => ({
  MetricPerformanceChart: (props: unknown) => mockMetricPerformanceChart(props),
  MonthlyTrendChart: (props: unknown) => mockMonthlyTrendChart(props),
  SupplyOutageReasonsChart: (props: unknown) => mockSupplyOutageReasonsChart(props),
  SupplyOutageDistributionChart: (props: unknown) => mockSupplyOutageDistributionChart(props),
  ActiveSchemesChart: (props: unknown) => mockActiveSchemesChart(props),
  ReadingSubmissionStatusChart: (props: unknown) => mockReadingSubmissionStatusChart(props),
  ReadingSubmissionRateChart: (props: unknown) => mockReadingSubmissionRateChart(props),
}))

jest.mock('../tables', () => ({
  SchemePerformanceTable: (props: unknown) => mockSchemePerformanceTable(props),
  ReadingComplianceTable: (props: unknown) => mockReadingComplianceTable(props),
}))

jest.mock('@/shared/components/common/view-by-select', () => ({
  ViewBySelect: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: 'geography' | 'time'
    onChange: (value: 'geography' | 'time') => void
    ariaLabel: string
  }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value as 'geography' | 'time')}
    >
      <option value="geography">Geography</option>
      <option value="time">Time</option>
    </select>
  ),
}))

const gramPanchayatTableData: EntityPerformance[] = [
  {
    id: 'gp-1',
    name: 'Gram Panchayat 1',
    coverage: 70,
    regularity: 82,
    continuity: 0,
    quantity: 55,
    compositeScore: 75,
    status: 'good',
  },
]

const supplySubmissionRateData: EntityPerformance[] = [
  {
    id: 'gp-1',
    name: 'Gram Panchayat 1',
    coverage: 0,
    regularity: 88,
    continuity: 0,
    quantity: 0,
    compositeScore: 0,
    status: 'good',
  },
]

const waterSupplyOutagesData = [
  {
    label: 'Gram Panchayat 1',
    electricityFailure: 10,
    pipelineLeak: 12,
    pumpFailure: 8,
    valveIssue: 6,
    sourceDrying: 4,
  },
]

const operatorsPerformanceTable: PumpOperatorPerformanceData[] = [
  {
    id: 'op-1',
    name: 'Vikash',
    village: 'Bibipur',
    block: 'Bibipur',
    reportingRate: 90,
    photoCompliance: 85,
    waterSupplied: 50,
  },
]

const data: DashboardData = {
  level: 'block',
  kpis: {
    totalSchemes: 1,
    totalRuralHouseholds: 1,
    functionalTapConnections: 1,
  },
  mapData: [],
  demandSupply: [{ period: 'Jan', demand: 100, supply: 90 }],
  readingSubmissionStatus: [{ label: 'Compliant Submissions', value: 60 }],
  readingCompliance: [
    {
      id: 'pe-1',
      name: 'Operator 1',
      village: 'Village 1',
      lastSubmission: '2026-02-20',
      readingValue: '120',
    },
  ],
  pumpOperators: [
    { label: 'Active pump operators', value: 10 },
    { label: 'Non-active pump operators', value: 5 },
  ],
  waterSupplyOutages: waterSupplyOutagesData,
  supplyOutageTrend: [{ period: 'Jan', value: 12 }],
  readingSubmissionTrend: [{ period: 'Jan', value: 77 }],
  topPerformers: [],
  worstPerformers: [],
  regularityData: [],
  continuityData: [],
}

function renderBlockDashboard() {
  return renderWithProviders(
    <BlockDashboardScreen
      data={data}
      quantityPerformanceData={gramPanchayatTableData}
      regularityPerformanceData={gramPanchayatTableData}
      gramPanchayatTableData={gramPanchayatTableData}
      supplySubmissionRateData={supplySubmissionRateData}
      supplySubmissionRateLabel="Gram Panchayats"
      operatorsPerformanceTable={operatorsPerformanceTable}
      pumpOperatorsTotal={15}
    />
  )
}

describe('BlockDashboardScreen', () => {
  beforeEach(() => {
    mockMetricPerformanceChart.mockClear()
    mockMonthlyTrendChart.mockClear()
    mockSupplyOutageReasonsChart.mockClear()
    mockSupplyOutageDistributionChart.mockClear()
    mockActiveSchemesChart.mockClear()
    mockReadingSubmissionStatusChart.mockClear()
    mockReadingSubmissionRateChart.mockClear()
    mockSchemePerformanceTable.mockClear()
    mockReadingComplianceTable.mockClear()
  })

  it('renders block view selectors with Geography selected by default', () => {
    renderBlockDashboard()

    const quantitySelect = screen.getByRole('combobox', {
      name: 'Block quantity performance view by',
    }) as HTMLSelectElement
    const regularitySelect = screen.getByRole('combobox', {
      name: 'Block regularity performance view by',
    }) as HTMLSelectElement
    const outageSelect = screen.getByRole('combobox', {
      name: 'Block supply outage distribution view by',
    }) as HTMLSelectElement

    expect(quantitySelect.value).toBe('geography')
    expect(regularitySelect.value).toBe('geography')
    expect(outageSelect.value).toBe('geography')
  })

  it('renders pump operators row and all 3 charts under it', () => {
    renderBlockDashboard()

    expect(screen.getByText('Schemes')).toBeTruthy()
    expect(screen.getByText('Total: 15')).toBeTruthy()
    expect(screen.getByText('Reading Submission Status')).toBeTruthy()
    expect(screen.getByText('Reading Submission Rate')).toBeTruthy()

    expect(screen.getByTestId('pump-operators-chart')).toBeTruthy()
    expect(screen.getByTestId('pump-operators-performance-table')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-status-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-rate-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-compliance-table')).toBeTruthy()
  })

  it('renders geography charts by default with gram panchayat labels and reading compliance title', () => {
    renderBlockDashboard()

    const metricCalls = mockMetricPerformanceChart.mock.calls as Array<[Record<string, unknown>]>
    expect(metricCalls).toHaveLength(2)
    const metricProps = metricCalls.map(([props]) => props)
    const quantityMetricCall = metricProps.find((props) => props.metric === 'quantity')
    const regularityMetricCall = metricProps.find((props) => props.metric === 'regularity')

    expect(quantityMetricCall?.entityLabel).toBe('Gram Panchayats')
    expect(regularityMetricCall?.entityLabel).toBe('Gram Panchayats')
    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()

    const outagesProps = mockSupplyOutageDistributionChart.mock.calls[0]?.[0] as {
      xAxisLabel: string
      data: Array<{ label: string }>
    }
    expect(outagesProps.xAxisLabel).toBe('Gram Panchayats')
    expect(outagesProps.data[0]?.label).toBe('Gram Panchayat 1')

    const submissionProps = mockReadingSubmissionRateChart.mock.calls[0]?.[0] as {
      entityLabel: string
    }
    expect(submissionProps.entityLabel).toBe('Gram Panchayats')

    const complianceProps = mockReadingComplianceTable.mock.calls[0]?.[0] as {
      title: string
    }
    expect(complianceProps.title).toBe('Reading Compliance')
  })

  it('switches quantity chart to time mode', () => {
    renderBlockDashboard()

    const quantitySelect = screen.getByRole('combobox', {
      name: 'Block quantity performance view by',
    })
    fireEvent.change(quantitySelect, { target: { value: 'time' } })

    const monthlyCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    const quantityCall = monthlyCalls.find((call) => call[0]?.seriesName === 'Quantity')
    expect(quantityCall).toBeDefined()
    expect(quantityCall?.[0].xAxisLabel).toBe('Month')
    expect(quantityCall?.[0].yAxisLabel).toBe('Quantity')
    expect(quantityCall?.[0].data).toEqual([
      {
        period: 'Jan',
        value: 90,
      },
    ])
  })

  it('switches outage distribution chart to time mode with outage trend data', () => {
    renderBlockDashboard()

    const outageSelect = screen.getByRole('combobox', {
      name: 'Block supply outage distribution view by',
    })
    fireEvent.change(outageSelect, { target: { value: 'time' } })

    const monthlyCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    const outageCall = monthlyCalls.find((call) => call[0]?.seriesName === 'Supply outage')
    expect(outageCall).toBeDefined()
    expect(outageCall?.[0].xAxisLabel).toBe('Month')
    expect(outageCall?.[0].yAxisLabel).toBe('No. of days')
    expect(outageCall?.[0].data).toEqual([
      {
        period: 'Jan',
        value: 12,
      },
    ])
  })
})

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
}))

jest.mock('@/shared/components/common/view-by-select', () => ({
  ViewBySelect: ({
    value,
    onChange,
    ariaLabel,
    disabled,
  }: {
    value: 'geography' | 'time'
    onChange: (value: 'geography' | 'time') => void
    ariaLabel: string
    disabled?: boolean
  }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as 'geography' | 'time')}
    >
      <option value="geography">Geography</option>
      <option value="time">Time</option>
    </select>
  ),
}))

const quantityPerformanceData: EntityPerformance[] = [
  {
    id: 'quantity-gp-1',
    name: 'Quantity Gram Panchayat',
    coverage: 61,
    regularity: 41,
    continuity: 0,
    quantity: 55,
    compositeScore: 68,
    status: 'good',
  },
]

const regularityPerformanceData: EntityPerformance[] = [
  {
    id: 'regularity-gp-1',
    name: 'Regularity Gram Panchayat',
    coverage: 73,
    regularity: 89,
    continuity: 0,
    quantity: 38,
    compositeScore: 81,
    status: 'good',
  },
]

const gramPanchayatTableData: EntityPerformance[] = [
  {
    id: 'table-gp-1',
    name: 'Table Gram Panchayat',
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
    reasons: {
      electricityFailure: 10,
      pipelineLeak: 12,
    },
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

const quantityTimeTrendData = [{ period: '01 Mar', value: 90 }]
const regularityTimeTrendData = [{ period: '01 Mar', value: 72 }]

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
  readingCompliance: [],
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
      quantityPerformanceData={quantityPerformanceData}
      quantityTimeTrendData={quantityTimeTrendData}
      regularityPerformanceData={regularityPerformanceData}
      regularityTimeTrendData={regularityTimeTrendData}
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

  it('renders pump operators row and both submission charts under it', () => {
    renderBlockDashboard()

    expect(screen.getByText('Schemes')).toBeTruthy()
    expect(screen.getByText('Total: 15')).toBeTruthy()
    expect(screen.getByText('Reading Submission Status')).toBeTruthy()
    expect(screen.getByText('Reading Submission Rate')).toBeTruthy()

    expect(screen.getByTestId('pump-operators-chart')).toBeTruthy()
    expect(screen.getByTestId('pump-operators-performance-table')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-status-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-rate-chart')).toBeTruthy()
  })

  it('can hide only the reading submission rate card while keeping outage charts side by side', () => {
    renderWithProviders(
      <BlockDashboardScreen
        data={data}
        quantityPerformanceData={quantityPerformanceData}
        quantityTimeTrendData={quantityTimeTrendData}
        regularityPerformanceData={regularityPerformanceData}
        regularityTimeTrendData={regularityTimeTrendData}
        gramPanchayatTableData={gramPanchayatTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel="Gram Panchayats"
        operatorsPerformanceTable={operatorsPerformanceTable}
        pumpOperatorsTotal={15}
        showReadingSubmissionRate={false}
      />
    )

    expect(screen.getByText('Supply Outage Reasons')).toBeTruthy()
    expect(screen.getByTestId('supply-outage-reasons-chart')).toBeTruthy()
    expect(screen.getByText('Supply Outage Distribution')).toBeTruthy()
    expect(screen.getByText('Reading Submission Status')).toBeTruthy()
    expect(screen.queryByText('Reading Submission Rate')).toBeNull()
    expect(screen.queryByTestId('reading-submission-rate-chart')).toBeNull()
  })

  it('can hide the entire reading submission section', () => {
    renderWithProviders(
      <BlockDashboardScreen
        data={data}
        quantityPerformanceData={quantityPerformanceData}
        quantityTimeTrendData={quantityTimeTrendData}
        regularityPerformanceData={regularityPerformanceData}
        regularityTimeTrendData={regularityTimeTrendData}
        gramPanchayatTableData={gramPanchayatTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel="Gram Panchayats"
        operatorsPerformanceTable={operatorsPerformanceTable}
        pumpOperatorsTotal={15}
        showReadingSubmissionSection={false}
      />
    )

    expect(screen.queryByText('Reading Submission Status')).toBeNull()
    expect(screen.queryByText('Reading Submission Rate')).toBeNull()
    expect(screen.queryByTestId('reading-submission-status-chart')).toBeNull()
    expect(screen.queryByTestId('reading-submission-rate-chart')).toBeNull()
  })

  it('renders geography charts by default with gram panchayat labels', () => {
    renderBlockDashboard()

    const metricCalls = mockMetricPerformanceChart.mock.calls as Array<[Record<string, unknown>]>
    expect(metricCalls).toHaveLength(2)
    const metricProps = metricCalls.map(([props]) => props)
    const quantityMetricCall = metricProps.find((props) => props.metric === 'quantity')
    const regularityMetricCall = metricProps.find((props) => props.metric === 'regularity')

    expect(quantityMetricCall?.entityLabel).toBe('Gram Panchayats')
    expect(quantityMetricCall?.showAreaLine).toBe(true)
    expect(regularityMetricCall?.entityLabel).toBe('Gram Panchayats')
    expect(quantityMetricCall?.data).toEqual(quantityPerformanceData)
    expect(regularityMetricCall?.data).toEqual(regularityPerformanceData)
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
    expect(quantityCall?.[0].yAxisLabel).toBe('Quantity (MLD)')
    expect(quantityCall?.[0].data).toEqual(quantityTimeTrendData)
  })

  it('shows no data for regularity time mode when periodic analytics are empty', () => {
    renderWithProviders(
      <BlockDashboardScreen
        data={data}
        quantityPerformanceData={quantityPerformanceData}
        quantityTimeTrendData={quantityTimeTrendData}
        regularityPerformanceData={regularityPerformanceData}
        regularityTimeTrendData={[]}
        gramPanchayatTableData={gramPanchayatTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel="Gram Panchayats"
        operatorsPerformanceTable={operatorsPerformanceTable}
        pumpOperatorsTotal={15}
      />
    )

    fireEvent.change(
      screen.getByRole('combobox', { name: 'Block regularity performance view by' }),
      {
        target: { value: 'time' },
      }
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()
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
    expect(outageCall?.[0].xAxisLabel).toBe('Time')
    expect(outageCall?.[0].yAxisLabel).toBe('No. of Reasons')
    expect(outageCall?.[0].data).toEqual([
      {
        period: 'Jan',
        value: 12,
      },
    ])
  })

  it('shows no data for outage distribution when outage reasons have no renderable values', () => {
    renderWithProviders(
      <BlockDashboardScreen
        data={{
          ...data,
          supplyOutageTrend: [{ period: 'Jan', value: 12 }],
        }}
        waterSupplyOutagesData={[
          {
            label: 'Gram Panchayat 1',
            reasons: {},
            electricityFailure: 10,
            pipelineLeak: 12,
            pumpFailure: 8,
            valveIssue: 6,
            sourceDrying: 4,
          },
        ]}
        waterSupplyOutageDistributionData={waterSupplyOutagesData}
        quantityPerformanceData={quantityPerformanceData}
        quantityTimeTrendData={quantityTimeTrendData}
        regularityPerformanceData={regularityPerformanceData}
        regularityTimeTrendData={regularityTimeTrendData}
        gramPanchayatTableData={gramPanchayatTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel="Gram Panchayats"
        operatorsPerformanceTable={operatorsPerformanceTable}
        pumpOperatorsTotal={15}
      />
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(screen.queryByTestId('supply-outage-distribution-chart')).toBeNull()
    expect(
      screen
        .getByRole('combobox', { name: 'Block supply outage distribution view by' })
        .getAttribute('disabled')
    ).not.toBeNull()
  })
})

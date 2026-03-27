import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData, EntityPerformance, PumpOperatorPerformanceData } from '../../types'
import { DistrictDashboardScreen } from './district-dashboard'

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
const mockReadingSubmissionStatusChart = jest.fn((_props: unknown) => (
  <div data-testid="reading-submission-status-chart" />
))
const mockReadingSubmissionRateChart = jest.fn((_props: unknown) => (
  <div data-testid="reading-submission-rate-chart" />
))
const mockActiveSchemesChart = jest.fn((_props: unknown) => (
  <div data-testid="pump-operators-chart" />
))
const mockSchemePerformanceTable = jest.fn((_props: unknown) => (
  <div data-testid="pump-operators-performance-table" />
))

jest.mock('../charts', () => ({
  MetricPerformanceChart: (props: unknown) => mockMetricPerformanceChart(props),
  MonthlyTrendChart: (props: unknown) => mockMonthlyTrendChart(props),
  SupplyOutageReasonsChart: (props: unknown) => mockSupplyOutageReasonsChart(props),
  SupplyOutageDistributionChart: (props: unknown) => mockSupplyOutageDistributionChart(props),
  ReadingSubmissionStatusChart: (props: unknown) => mockReadingSubmissionStatusChart(props),
  ReadingSubmissionRateChart: (props: unknown) => mockReadingSubmissionRateChart(props),
  ActiveSchemesChart: (props: unknown) => mockActiveSchemesChart(props),
}))

jest.mock('../tables', () => ({
  SchemePerformanceTable: (props: unknown) => mockSchemePerformanceTable(props),
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

const blockTableData: EntityPerformance[] = [
  {
    id: 'b1',
    name: 'Block 1',
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
    id: 'b1',
    name: 'Block 1',
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
    label: 'Block 1',
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
  level: 'district',
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

function renderDistrictDashboard() {
  return renderWithProviders(
    <DistrictDashboardScreen
      data={data}
      quantityPerformanceData={blockTableData}
      quantityTimeTrendData={quantityTimeTrendData}
      regularityPerformanceData={blockTableData}
      regularityTimeTrendData={regularityTimeTrendData}
      blockTableData={blockTableData}
      supplySubmissionRateData={supplySubmissionRateData}
      supplySubmissionRateLabel="Blocks"
      operatorsPerformanceTable={operatorsPerformanceTable}
      pumpOperatorsTotal={15}
    />
  )
}

describe('DistrictDashboardScreen', () => {
  beforeEach(() => {
    mockMetricPerformanceChart.mockClear()
    mockMonthlyTrendChart.mockClear()
    mockSupplyOutageReasonsChart.mockClear()
    mockSupplyOutageDistributionChart.mockClear()
    mockReadingSubmissionStatusChart.mockClear()
    mockReadingSubmissionRateChart.mockClear()
    mockActiveSchemesChart.mockClear()
    mockSchemePerformanceTable.mockClear()
  })

  it('renders all district view selectors with Geography selected by default', () => {
    renderDistrictDashboard()

    const quantitySelect = screen.getByRole('combobox', {
      name: 'District quantity performance view by',
    }) as HTMLSelectElement
    const regularitySelect = screen.getByRole('combobox', {
      name: 'District regularity performance view by',
    }) as HTMLSelectElement
    const outageSelect = screen.getByRole('combobox', {
      name: 'District supply outage distribution view by',
    }) as HTMLSelectElement

    expect(quantitySelect.value).toBe('geography')
    expect(regularitySelect.value).toBe('geography')
    expect(outageSelect.value).toBe('geography')
    expect(
      screen.queryByRole('combobox', {
        name: 'District reading submission rate view by',
      })
    ).toBeNull()
  })

  it('renders geography charts by default and forwards full-height table prop', () => {
    renderDistrictDashboard()

    const metricCalls = mockMetricPerformanceChart.mock.calls as Array<[Record<string, unknown>]>
    expect(metricCalls).toHaveLength(2)
    expect(metricCalls[0]?.[0].metric).toBe('quantity')
    expect(metricCalls[1]?.[0].metric).toBe('regularity')
    expect(metricCalls[0]?.[0].showAreaLine).toBe(true)
    expect(metricCalls[0]?.[0].entityLabel).toBe('Blocks')
    expect(metricCalls[1]?.[0].entityLabel).toBe('Blocks')
    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()

    const outagesProps = mockSupplyOutageDistributionChart.mock.calls[0]?.[0] as {
      xAxisLabel: string
      data: Array<{ label: string }>
    }
    expect(outagesProps.xAxisLabel).toBe('Blocks')
    expect(outagesProps.data[0]?.label).toBe('Block 1')

    const submissionProps = mockReadingSubmissionRateChart.mock.calls[0]?.[0] as {
      entityLabel: string
    }
    expect(submissionProps.entityLabel).toBe('Blocks')

    const operatorsTableProps = mockSchemePerformanceTable.mock.calls[0]?.[0] as {
      fillHeight: boolean
    }
    expect(operatorsTableProps.fillHeight).toBe(true)
  })

  it('switches quantity chart to time mode when selector changes', () => {
    renderDistrictDashboard()

    const quantitySelect = screen.getByRole('combobox', {
      name: 'District quantity performance view by',
    })
    fireEvent.change(quantitySelect, { target: { value: 'time' } })

    const monthlyCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    const quantityCall = monthlyCalls.find((call) => call[0]?.seriesName === 'Quantity')
    expect(quantityCall).toBeDefined()
    expect(quantityCall?.[0].xAxisLabel).toBe('Month')
    expect(quantityCall?.[0].yAxisLabel).toBe('Quantity')
    expect(quantityCall?.[0].data).toEqual(quantityTimeTrendData)
  })

  it('shows no data for quantity time mode when periodic analytics are empty', () => {
    renderWithProviders(
      <DistrictDashboardScreen
        data={data}
        quantityPerformanceData={blockTableData}
        quantityTimeTrendData={[]}
        regularityPerformanceData={blockTableData}
        regularityTimeTrendData={regularityTimeTrendData}
        blockTableData={blockTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel="Blocks"
        operatorsPerformanceTable={operatorsPerformanceTable}
        pumpOperatorsTotal={15}
      />
    )

    fireEvent.change(
      screen.getByRole('combobox', { name: 'District quantity performance view by' }),
      {
        target: { value: 'time' },
      }
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()
  })

  it('shows no data for regularity time mode when periodic analytics are empty', () => {
    renderWithProviders(
      <DistrictDashboardScreen
        data={data}
        quantityPerformanceData={blockTableData}
        quantityTimeTrendData={quantityTimeTrendData}
        regularityPerformanceData={blockTableData}
        regularityTimeTrendData={[]}
        blockTableData={blockTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel="Blocks"
        operatorsPerformanceTable={operatorsPerformanceTable}
        pumpOperatorsTotal={15}
      />
    )

    fireEvent.change(
      screen.getByRole('combobox', { name: 'District regularity performance view by' }),
      {
        target: { value: 'time' },
      }
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()
  })

  it('renders reading submission rate as a fixed geography chart', () => {
    renderDistrictDashboard()

    expect(
      screen.queryByRole('combobox', {
        name: 'District reading submission rate view by',
      })
    ).toBeNull()

    const submissionProps = mockReadingSubmissionRateChart.mock.calls[0]?.[0] as {
      entityLabel: string
      data: Array<{ name: string }>
    }
    expect(submissionProps.entityLabel).toBe('Blocks')
    expect(submissionProps.data[0]?.name).toBe('Block 1')
  })

  it('switches outage distribution chart to time mode with outage trend data', () => {
    renderDistrictDashboard()

    const outageSelect = screen.getByRole('combobox', {
      name: 'District supply outage distribution view by',
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

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
const mockPumpOperatorsChart = jest.fn((_props: unknown) => (
  <div data-testid="pump-operators-chart" />
))
const mockPumpOperatorsPerformanceTable = jest.fn((_props: unknown) => (
  <div data-testid="pump-operators-performance-table" />
))

jest.mock('../charts', () => ({
  MetricPerformanceChart: (props: unknown) => mockMetricPerformanceChart(props),
  MonthlyTrendChart: (props: unknown) => mockMonthlyTrendChart(props),
  SupplyOutageReasonsChart: (props: unknown) => mockSupplyOutageReasonsChart(props),
  SupplyOutageDistributionChart: (props: unknown) => mockSupplyOutageDistributionChart(props),
  ReadingSubmissionStatusChart: (props: unknown) => mockReadingSubmissionStatusChart(props),
  ReadingSubmissionRateChart: (props: unknown) => mockReadingSubmissionRateChart(props),
  PumpOperatorsChart: (props: unknown) => mockPumpOperatorsChart(props),
}))

jest.mock('../tables', () => ({
  PumpOperatorsPerformanceTable: (props: unknown) => mockPumpOperatorsPerformanceTable(props),
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
    mockPumpOperatorsChart.mockClear()
    mockPumpOperatorsPerformanceTable.mockClear()
  })

  it('renders all district view selectors with Select default option', () => {
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
    const readingSelect = screen.getByRole('combobox', {
      name: 'District reading submission rate view by',
    }) as HTMLSelectElement

    expect(quantitySelect.value).toBe('')
    expect(regularitySelect.value).toBe('')
    expect(outageSelect.value).toBe('')
    expect(readingSelect.value).toBe('')
    expect(screen.getAllByRole('option', { name: 'Select' })).toHaveLength(4)
  })

  it('renders geography charts by default and forwards full-height table prop', () => {
    renderDistrictDashboard()

    const metricCalls = mockMetricPerformanceChart.mock.calls as Array<[Record<string, unknown>]>
    expect(metricCalls).toHaveLength(2)
    expect(metricCalls[0]?.[0].metric).toBe('quantity')
    expect(metricCalls[1]?.[0].metric).toBe('regularity')
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

    const operatorsTableProps = mockPumpOperatorsPerformanceTable.mock.calls[0]?.[0] as {
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
    expect(quantityCall?.[0].data).toEqual([
      {
        period: 'Jan',
        value: 90,
      },
    ])
  })

  it('switches reading submission chart to time mode with reading submission trend data', () => {
    renderDistrictDashboard()

    const readingSelect = screen.getByRole('combobox', {
      name: 'District reading submission rate view by',
    })
    fireEvent.change(readingSelect, { target: { value: 'time' } })

    const monthlyCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    const readingSubmissionCall = monthlyCalls.find(
      (call) => call[0]?.seriesName === 'Reading submission'
    )
    expect(readingSubmissionCall).toBeDefined()
    expect(readingSubmissionCall?.[0].xAxisLabel).toBe('Month')
    expect(readingSubmissionCall?.[0].yAxisLabel).toBe('Percentage')
    expect(readingSubmissionCall?.[0].isPercent).toBe(true)
    expect(readingSubmissionCall?.[0].data).toEqual([
      {
        period: 'Jan',
        value: 77,
      },
    ])
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

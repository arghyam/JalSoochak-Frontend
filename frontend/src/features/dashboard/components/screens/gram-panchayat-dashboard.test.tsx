import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData, EntityPerformance, PumpOperatorPerformanceData } from '../../types'
import { GramPanchayatDashboardScreen } from './gram-panchayat-dashboard'

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

const villageQuantityData: EntityPerformance[] = [
  {
    id: 'quantity-v-1',
    name: 'Quantity Village',
    coverage: 64,
    regularity: 46,
    continuity: 0,
    quantity: 55,
    compositeScore: 69,
    status: 'good',
  },
]

const villageRegularityData: EntityPerformance[] = [
  {
    id: 'regularity-v-1',
    name: 'Regularity Village',
    coverage: 78,
    regularity: 91,
    continuity: 0,
    quantity: 39,
    compositeScore: 83,
    status: 'good',
  },
]

const villageTableData: EntityPerformance[] = [
  {
    id: 'table-v-1',
    name: 'Village 1',
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
    id: 'v-1',
    name: 'Village 1',
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
    label: 'Village 1',
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
    village: 'Village 1',
    block: 'Bibipur',
    reportingRate: 90,
    photoCompliance: 85,
    waterSupplied: 50,
  },
]

const quantityTimeTrendData = [{ period: '01 Mar', value: 90 }]
const regularityTimeTrendData = [{ period: '01 Mar', value: 72 }]

const data: DashboardData = {
  level: 'gram-panchayat',
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

function renderGramPanchayatDashboard() {
  return renderWithProviders(
    <GramPanchayatDashboardScreen
      data={data}
      quantityPerformanceData={villageQuantityData}
      quantityTimeTrendData={quantityTimeTrendData}
      regularityPerformanceData={villageRegularityData}
      regularityTimeTrendData={regularityTimeTrendData}
      villageTableData={villageTableData}
      supplySubmissionRateData={supplySubmissionRateData}
      supplySubmissionRateLabel="Villages"
      operatorsPerformanceTable={operatorsPerformanceTable}
      pumpOperatorsTotal={15}
    />
  )
}

describe('GramPanchayatDashboardScreen', () => {
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

  it('renders gram panchayat view selectors with Geography selected by default', () => {
    renderGramPanchayatDashboard()

    const quantitySelect = screen.getByRole('combobox', {
      name: 'Gram panchayat quantity performance view by',
    }) as HTMLSelectElement
    const regularitySelect = screen.getByRole('combobox', {
      name: 'Gram panchayat regularity performance view by',
    }) as HTMLSelectElement
    const outageSelect = screen.getByRole('combobox', {
      name: 'Gram panchayat supply outage distribution view by',
    }) as HTMLSelectElement

    expect(quantitySelect.value).toBe('geography')
    expect(regularitySelect.value).toBe('geography')
    expect(outageSelect.value).toBe('geography')
  })

  it('renders pump operators row and all 3 charts under it', () => {
    renderGramPanchayatDashboard()

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

  it('renders geography charts by default with village labels and reading compliance title', () => {
    renderGramPanchayatDashboard()

    const metricCalls = mockMetricPerformanceChart.mock.calls as Array<[Record<string, unknown>]>
    expect(metricCalls).toHaveLength(2)
    expect(metricCalls[0]?.[0].metric).toBe('quantity')
    expect(metricCalls[1]?.[0].metric).toBe('regularity')
    expect(metricCalls[0]?.[0].showAreaLine).toBe(true)
    expect(metricCalls[0]?.[0].entityLabel).toBe('Villages')
    expect(metricCalls[1]?.[0].entityLabel).toBe('Villages')
    expect(metricCalls[0]?.[0].data).toEqual(villageQuantityData)
    expect(metricCalls[1]?.[0].data).toEqual(villageRegularityData)
    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()

    const outagesProps = mockSupplyOutageDistributionChart.mock.calls[0]?.[0] as {
      xAxisLabel: string
      data: Array<{ label: string }>
    }
    expect(outagesProps.xAxisLabel).toBe('Villages')
    expect(outagesProps.data[0]?.label).toBe('Village 1')

    const submissionProps = mockReadingSubmissionRateChart.mock.calls[0]?.[0] as {
      entityLabel: string
    }
    expect(submissionProps.entityLabel).toBe('Villages')

    const complianceProps = mockReadingComplianceTable.mock.calls[0]?.[0] as {
      title: string
      fillHeight?: boolean
    }
    expect(complianceProps.title).toBe('Reading Compliance')
    expect(complianceProps.fillHeight).toBe(true)
  })

  it('switches quantity chart to time mode', () => {
    renderGramPanchayatDashboard()

    const quantitySelect = screen.getByRole('combobox', {
      name: 'Gram panchayat quantity performance view by',
    })
    fireEvent.change(quantitySelect, { target: { value: 'time' } })

    const monthlyCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    const quantityCall = monthlyCalls.find((call) => call[0]?.seriesName === 'Quantity')
    expect(quantityCall).toBeDefined()
    expect(quantityCall?.[0].xAxisLabel).toBe('Month')
    expect(quantityCall?.[0].yAxisLabel).toBe('Quantity')
    expect(quantityCall?.[0].data).toEqual(quantityTimeTrendData)
  })

  it('shows no data for regularity time mode when periodic analytics are empty', () => {
    renderWithProviders(
      <GramPanchayatDashboardScreen
        data={data}
        quantityPerformanceData={villageQuantityData}
        quantityTimeTrendData={quantityTimeTrendData}
        regularityPerformanceData={villageRegularityData}
        regularityTimeTrendData={[]}
        villageTableData={villageTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel="Villages"
        operatorsPerformanceTable={operatorsPerformanceTable}
        pumpOperatorsTotal={15}
      />
    )

    fireEvent.change(
      screen.getByRole('combobox', { name: 'Gram panchayat regularity performance view by' }),
      {
        target: { value: 'time' },
      }
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()
  })

  it('switches outage distribution chart to time mode with outage trend data', () => {
    renderGramPanchayatDashboard()

    const outageSelect = screen.getByRole('combobox', {
      name: 'Gram panchayat supply outage distribution view by',
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

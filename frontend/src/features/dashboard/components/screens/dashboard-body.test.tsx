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
const mockMonthlyTrendChart = jest.fn(
  (_props: {
    data: Array<{ period: string; value: number }>
    seriesName: string
    isPercent?: boolean
  }) => <div data-testid="monthly-trend-chart" />
)
const mockDistrictDashboardScreen = jest.fn((_props: unknown) => (
  <div data-testid="district-dashboard-screen" />
))

jest.mock('../charts', () => ({
  MetricPerformanceChart: (props: { data: EntityPerformance[]; metric: string }) =>
    mockMetricPerformanceChart(props),
  MonthlyTrendChart: (props: {
    data: Array<{ period: string; value: number }>
    seriesName: string
    isPercent?: boolean
  }) => mockMonthlyTrendChart(props),
  ReadingSubmissionRateChart: () => <div data-testid="reading-submission-rate-chart" />,
  SupplyOutageDistributionChart: () => <div data-testid="supply-outage-distribution-chart" />,
  SupplyOutageReasonsChart: () => <div data-testid="supply-outage-reasons-chart" />,
}))

jest.mock('./state-ut-dashboard', () => ({
  StateUtDashboardScreen: () => <div data-testid="state-ut-dashboard-screen" />,
}))

jest.mock('./district-dashboard', () => ({
  DistrictDashboardScreen: (props: unknown) => mockDistrictDashboardScreen(props),
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

jest.mock(
  '@/shared/components/common/view-by-select',
  () =>
    ({
      ViewBySelect: ({
        value,
        onChange,
        ariaLabel,
        color,
        borderColor,
      }: {
        value: 'geography' | 'time'
        onChange: (value: 'geography' | 'time') => void
        ariaLabel: string
        color?: string
        borderColor?: string
      }) => {
        const { useState } = jest.requireActual<typeof import('react')>('react')
        const [isOpen, setIsOpen] = useState(false)
        const label = value === 'geography' ? 'Geography' : 'Time'

        return (
          <div data-testid="view-by-select-mock">
            <button
              aria-label={ariaLabel}
              type="button"
              onClick={() => setIsOpen((open: boolean) => !open)}
              style={{ color, borderColor, borderStyle: 'solid', borderWidth: '1px' }}
            >
              {label}
            </button>
            {isOpen ? (
              <div role="menu">
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onChange('geography')
                    setIsOpen(false)
                  }}
                >
                  Geography
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onChange('time')
                    setIsOpen(false)
                  }}
                >
                  Time
                </button>
              </div>
            ) : null}
          </div>
        )
      },
    }) as unknown
)

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
  readingSubmissionStatus: [{ label: 'On time', value: 80 }],
  readingCompliance: [
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
      quantityPerformanceData={mockEntityData}
      regularityPerformanceData={mockEntityData}
      districtTableData={mockEntityData}
      blockTableData={mockEntityData}
      gramPanchayatTableData={mockEntityData}
      villageTableData={mockEntityData}
      supplySubmissionRateData={mockEntityData}
      supplySubmissionRateLabel="States/UTs"
      waterSupplyOutagesData={mockDashboardData.waterSupplyOutages}
      waterSupplyOutageDistributionData={mockDashboardData.waterSupplyOutages}
      pumpOperatorsTotal={12}
      operatorsPerformanceTable={mockOperatorsPerformanceTable}
      villagePhotoEvidenceRows={mockDashboardData.readingCompliance}
      villagePumpOperatorDetails={{
        name: 'Ajay Yadav',
        scheme: 'Rural Water Supply 001',
        stationLocation: 'Central Pumping Station',
        lastSubmission: '11-02-24, 1:00pm',
        reportingRate: '85%',
        missingSubmissionCount: '3',
        inactiveDays: '2',
      }}
      {...overrides}
    />
  )
}

describe('DashboardBody', () => {
  beforeEach(() => {
    mockMetricPerformanceChart.mockClear()
    mockMonthlyTrendChart.mockClear()
    mockDistrictDashboardScreen.mockClear()
  })

  it('renders independent geography/time selectors for both performance cards', () => {
    renderDashboardBody()

    const quantitySelect = screen.getByRole('button', {
      name: 'Quantity performance view by',
    })
    const regularitySelect = screen.getByRole('button', {
      name: 'Regularity performance view by',
    })

    expect(quantitySelect).toBeTruthy()
    expect(regularitySelect).toBeTruthy()
    expect(quantitySelect.textContent).toContain('Geography')
    expect(regularitySelect.textContent).toContain('Geography')
  })

  it('renders geography bar charts with full map data by default', () => {
    mockMetricPerformanceChart.mockClear()

    renderDashboardBody()

    const metricChartCalls = mockMetricPerformanceChart.mock.calls as Array<
      [{ data: EntityPerformance[]; metric: string; showAreaLine?: boolean }]
    >

    expect(metricChartCalls).toHaveLength(2)
    expect(metricChartCalls[0][0].data).toEqual(mockEntityData)
    expect(metricChartCalls[0][0].showAreaLine).toBeUndefined()
    expect(metricChartCalls[1][0].data).toEqual(mockEntityData)
    expect(metricChartCalls[1][0].showAreaLine).toBeUndefined()
    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()
  })

  it('switches each card to time chart independently', () => {
    renderDashboardBody()

    const quantitySelect = screen.getByRole('button', { name: 'Quantity performance view by' })
    const regularitySelect = screen.getByRole('button', {
      name: 'Regularity performance view by',
    })

    fireEvent.click(quantitySelect)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Time' }))
    expect(mockMonthlyTrendChart).toHaveBeenCalledTimes(1)
    expect(mockMonthlyTrendChart.mock.calls[0]?.[0].seriesName).toBe('Quantity')
    expect(mockMetricPerformanceChart).toHaveBeenCalledTimes(3)

    fireEvent.click(regularitySelect)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Time' }))
    expect(mockMonthlyTrendChart).toHaveBeenCalledTimes(3)
    expect(mockMonthlyTrendChart.mock.calls[2]?.[0].seriesName).toBe('Regularity')
    expect(mockMonthlyTrendChart.mock.calls[2]?.[0].isPercent).toBe(true)
  })

  it('renders outage reasons pie card and reading submission card in central default view', () => {
    renderDashboardBody()

    expect(screen.getByText('Supply Outage Reasons')).toBeTruthy()
    expect(screen.getByTestId('supply-outage-reasons-chart')).toBeTruthy()
    expect(screen.getByText('Reading Submission Rate')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-rate-chart')).toBeTruthy()
    expect(screen.queryByText('All States/UTs')).toBeNull()
  })

  it('renders village screen only when village is selected', () => {
    renderDashboardBody({ selectedVillage: 'Village 1' })

    expect(screen.getByTestId('village-dashboard-screen')).toBeTruthy()
    expect(screen.queryByText('Supply Outage Reasons')).toBeNull()
    expect(screen.queryByText('Reading Submission Rate')).toBeNull()
  })

  it('renders geography charts with district data and labels when state is selected', () => {
    mockMetricPerformanceChart.mockClear()

    renderDashboardBody({
      isStateSelected: true,
      isDistrictSelected: false,
      isBlockSelected: false,
      isGramPanchayatSelected: false,
      selectedVillage: '',
      quantityPerformanceData: [
        {
          id: 'qd1',
          name: 'District A',
          coverage: 60,
          regularity: 70,
          continuity: 0,
          quantity: 50,
          compositeScore: 65,
          status: 'needs-attention',
        },
      ],
      regularityPerformanceData: [
        {
          id: 'rd1',
          name: 'District A',
          coverage: 60,
          regularity: 70,
          continuity: 0,
          quantity: 50,
          compositeScore: 65,
          status: 'needs-attention',
        },
      ],
      districtTableData: [
        {
          id: 'd1',
          name: 'District A',
          coverage: 60,
          regularity: 70,
          continuity: 0,
          quantity: 50,
          compositeScore: 65,
          status: 'needs-attention',
        },
      ],
    })

    const metricChartCalls = mockMetricPerformanceChart.mock.calls as Array<
      [{ data: EntityPerformance[]; entityLabel?: string }]
    >

    expect(metricChartCalls).toHaveLength(2)
    expect(metricChartCalls[0][0].data[0]?.name).toBe('District A')
    expect(metricChartCalls[1][0].data[0]?.name).toBe('District A')
    expect(metricChartCalls[0][0].entityLabel).toBe('Districts')
    expect(metricChartCalls[1][0].entityLabel).toBe('Districts')
  })

  it('renders and switches the supply outage distribution selector on the state view', () => {
    mockMonthlyTrendChart.mockClear()

    renderDashboardBody({
      isStateSelected: true,
      isDistrictSelected: false,
      isBlockSelected: false,
      isGramPanchayatSelected: false,
      selectedVillage: '',
      data: {
        ...mockDashboardData,
        supplyOutageTrend: [{ period: 'FY25', value: 7 }],
      },
    })

    const outageSelect = screen.getByRole('button', {
      name: 'State supply outage distribution view by',
    })

    expect(outageSelect.textContent).toContain('Geography')
    expect(screen.getByTestId('supply-outage-distribution-chart')).toBeTruthy()

    fireEvent.click(outageSelect)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Time' }))

    expect(mockMonthlyTrendChart).toHaveBeenCalledTimes(1)
    expect(mockMonthlyTrendChart.mock.calls[0]?.[0].seriesName).toBe('Supply outage')
  })

  it('passes dashboard data to district screen as outage single source-of-truth', () => {
    renderDashboardBody({
      isDistrictSelected: true,
      isBlockSelected: false,
      isGramPanchayatSelected: false,
      selectedVillage: '',
      data: {
        ...mockDashboardData,
        waterSupplyOutages: [
          {
            label: 'Block 1',
            electricityFailure: 2,
            pipelineLeak: 3,
            pumpFailure: 4,
            valveIssue: 5,
            sourceDrying: 6,
          },
        ],
      },
    })

    const districtScreenProps = (mockDistrictDashboardScreen.mock.calls.at(-1)?.[0] ?? {}) as {
      data?: { waterSupplyOutages?: Array<{ label: string }> }
    }

    expect(districtScreenProps.data?.waterSupplyOutages?.[0]?.label).toBe('Block 1')
  })
})

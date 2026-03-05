import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData, WaterSupplyOutageData } from '../../types'
import { VillageDashboardScreen } from './village-dashboard'

const mockMetricPerformanceChart = jest.fn((_props: unknown) => (
  <div data-testid="metric-performance-chart" />
))
const mockIssueTypeBreakdownChart = jest.fn((_props: unknown) => (
  <div data-testid="issue-type-breakdown-chart" />
))
const mockImageSubmissionStatusChart = jest.fn((_props: unknown) => (
  <div data-testid="image-submission-status-chart" />
))
const mockPhotoEvidenceComplianceTable = jest.fn((_props: unknown) => (
  <div data-testid="photo-evidence-compliance-table" />
))

jest.mock('../charts', () => ({
  MetricPerformanceChart: (props: unknown) => mockMetricPerformanceChart(props),
  IssueTypeBreakdownChart: (props: unknown) => mockIssueTypeBreakdownChart(props),
  ImageSubmissionStatusChart: (props: unknown) => mockImageSubmissionStatusChart(props),
}))

jest.mock('../tables', () => ({
  PhotoEvidenceComplianceTable: (props: unknown) => mockPhotoEvidenceComplianceTable(props),
}))

const data: DashboardData = {
  level: 'village',
  kpis: {
    totalSchemes: 1,
    totalRuralHouseholds: 1,
    functionalTapConnections: 1,
  },
  mapData: [],
  demandSupply: [
    { period: 'FY20', demand: 60, supply: 67 },
    { period: 'FY21', demand: 82, supply: 74 },
    { period: 'FY22', demand: 99, supply: 109 },
  ],
  imageSubmissionStatus: [{ label: 'Complaint Submission', value: 62 }],
  photoEvidenceCompliance: [],
  pumpOperators: [],
  waterSupplyOutages: [],
  topPerformers: [],
  worstPerformers: [],
  regularityData: [],
  continuityData: [],
}

const waterSupplyOutagesData: WaterSupplyOutageData[] = [
  {
    label: 'Village 1',
    electricityFailure: 1,
    pipelineLeak: 2,
    pumpFailure: 3,
    valveIssue: 4,
    sourceDrying: 5,
  },
]

const villagePumpOperatorDetails = {
  name: 'Ajay Yadav',
  scheme: 'Rural Water Supply 001',
  stationLocation: 'Central Pumping Station',
  lastSubmission: '11-02-24, 1:00pm',
  reportingRate: '85%',
  missingSubmissionCount: '3',
  inactiveDays: '2',
}

const villagePumpOperators = [
  {
    ...villagePumpOperatorDetails,
    name: 'Vikash',
    lastSubmission: '09-08-2025, 3:00pm',
  },
  {
    ...villagePumpOperatorDetails,
    name: 'Arjun',
    lastSubmission: '11-02-2025, 1:00pm',
  },
  {
    ...villagePumpOperatorDetails,
    name: 'Shashwat',
    lastSubmission: '03-19-2025, 9:00am',
  },
]

function renderVillageDashboard(
  villagePhotoEvidenceRows: DashboardData['photoEvidenceCompliance'] = [
    {
      id: 'pe-1',
      name: 'Vikash',
      village: 'Asaihpura',
      lastSubmission: '09-08-2025, 3:00pm',
      readingValue: '017848',
    },
    {
      id: 'pe-2',
      name: 'Arjun',
      village: 'Bhedoura',
      lastSubmission: '11-02-2025, 1:00pm',
      readingValue: '026537',
    },
    {
      id: 'pe-3',
      name: 'Shashwat',
      village: 'Bispur',
      lastSubmission: '03-19-2025, 9:00am',
      readingValue: '034982',
    },
  ],
  operatorPages = villagePumpOperators
) {
  return renderWithProviders(
    <VillageDashboardScreen
      data={data}
      villagePhotoEvidenceRows={villagePhotoEvidenceRows}
      waterSupplyOutagesData={waterSupplyOutagesData}
      villagePumpOperatorDetails={villagePumpOperatorDetails}
      villagePumpOperators={operatorPages}
    />
  )
}

describe('VillageDashboardScreen', () => {
  beforeEach(() => {
    mockMetricPerformanceChart.mockClear()
    mockIssueTypeBreakdownChart.mockClear()
    mockImageSubmissionStatusChart.mockClear()
    mockPhotoEvidenceComplianceTable.mockClear()
  })

  it('renders quantity and regularity using metric performance charts', () => {
    renderVillageDashboard()

    const metricCalls = mockMetricPerformanceChart.mock.calls as Array<[Record<string, unknown>]>
    expect(metricCalls).toHaveLength(2)
    expect(metricCalls[0]?.[0].metric).toBe('quantity')
    expect(metricCalls[0]?.[0].showAreaLine).toBe(true)
    expect(metricCalls[0]?.[0].seriesName).toBe('Quantity')
    expect(metricCalls[1]?.[0].metric).toBe('regularity')
    expect(metricCalls[1]?.[0].seriesName).toBe('Regularity')

    expect(screen.getByTestId('issue-type-breakdown-chart')).toBeTruthy()
    expect(screen.getByTestId('image-submission-status-chart')).toBeTruthy()
    expect(screen.getByTestId('photo-evidence-compliance-table')).toBeTruthy()
  })

  it('paginates pump operator details with previous/next and page buttons', () => {
    renderVillageDashboard()

    expect(screen.getByText('Vikash')).toBeTruthy()
    expect(screen.getByText('09-08-2025, 3:00pm')).toBeTruthy()
    let complianceProps = mockPhotoEvidenceComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string }>
    }
    expect(complianceProps.data.every((row) => row.name === 'Vikash')).toBe(true)

    const previousButton = screen.getByRole('button', { name: 'Previous' })
    const nextButton = screen.getByRole('button', { name: 'Next' })
    expect((previousButton as HTMLButtonElement).disabled).toBe(true)
    expect((nextButton as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByText('Arjun')).toBeTruthy()
    expect(screen.getByText('11-02-2025, 1:00pm')).toBeTruthy()
    complianceProps = mockPhotoEvidenceComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string }>
    }
    expect(complianceProps.data.every((row) => row.name === 'Arjun')).toBe(true)

    fireEvent.click(nextButton)
    expect(screen.getByText('Shashwat')).toBeTruthy()
    expect(screen.getByText('03-19-2025, 9:00am')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('Arjun')).toBeTruthy()
  })

  it('hides pagination controls when only one operator row exists', () => {
    renderVillageDashboard(
      [
        {
          id: 'pe-1',
          name: 'Vikash',
          village: 'Asaihpura',
          lastSubmission: '09-08-2025, 3:00pm',
          readingValue: '017848',
        },
      ],
      [villagePumpOperatorDetails]
    )

    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  })
})

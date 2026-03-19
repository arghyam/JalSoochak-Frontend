import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData, WaterSupplyOutageData } from '../../types'
import { VillageDashboardScreen } from './village-dashboard'

const mockMetricPerformanceChart = jest.fn((_props: unknown) => (
  <div data-testid="metric-performance-chart" />
))
const mockSupplyOutageReasonsChart = jest.fn((_props: unknown) => (
  <div data-testid="supply-outage-reasons-chart" />
))
const mockReadingSubmissionStatusChart = jest.fn((_props: unknown) => (
  <div data-testid="reading-submission-status-chart" />
))
const mockReadingComplianceTable = jest.fn((_props: unknown) => (
  <div data-testid="reading-compliance-table" />
))
const mockUsePumpOperatorsBySchemeQuery = jest.fn<(options: unknown) => { data: unknown }>(
  (_options: unknown) => ({ data: undefined })
)
const mockUsePumpOperatorDetailsQuery = jest.fn<(options: unknown) => { data: unknown }>(
  (_options: unknown) => ({ data: undefined })
)
const mockUseReadingComplianceQuery = jest.fn<(options: unknown) => { data: unknown }>(
  (_options: unknown) => ({ data: undefined })
)

jest.mock('../charts', () => ({
  MetricPerformanceChart: (props: unknown) => mockMetricPerformanceChart(props),
  SupplyOutageReasonsChart: (props: unknown) => mockSupplyOutageReasonsChart(props),
  ReadingSubmissionStatusChart: (props: unknown) => mockReadingSubmissionStatusChart(props),
}))

jest.mock('../tables', () => ({
  ReadingComplianceTable: (props: unknown) => mockReadingComplianceTable(props),
}))

jest.mock('../../services/query/use-pump-operators-by-scheme-query', () => ({
  usePumpOperatorsBySchemeQuery: (options: unknown) => mockUsePumpOperatorsBySchemeQuery(options),
}))

jest.mock('../../services/query/use-pump-operator-details-query', () => ({
  usePumpOperatorDetailsQuery: (options: unknown) => mockUsePumpOperatorDetailsQuery(options),
}))

jest.mock('../../services/query/use-reading-compliance-query', () => ({
  useReadingComplianceQuery: (options: unknown) => mockUseReadingComplianceQuery(options),
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
  readingSubmissionStatus: [{ label: 'Complaint Submission', value: 62 }],
  readingCompliance: [],
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
  id: 4,
  schemeId: 3,
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
    name: 'Ajay Yadav',
    lastSubmission: '11-02-24, 1:00pm',
  },
  {
    ...villagePumpOperatorDetails,
    name: 'Vikram Singh',
    lastSubmission: '13-02-24, 10:30am',
  },
  {
    ...villagePumpOperatorDetails,
    name: 'Neha Kumari',
    lastSubmission: '17-02-24, 3:45pm',
  },
]

function renderVillageDashboard(
  villagePhotoEvidenceRows: DashboardData['readingCompliance'] = [
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
      tenantCode="as"
      schemeId={3}
    />
  )
}

describe('VillageDashboardScreen', () => {
  beforeEach(() => {
    mockMetricPerformanceChart.mockClear()
    mockSupplyOutageReasonsChart.mockClear()
    mockReadingSubmissionStatusChart.mockClear()
    mockReadingComplianceTable.mockClear()
    mockUsePumpOperatorsBySchemeQuery.mockReset()
    mockUsePumpOperatorDetailsQuery.mockReset()
    mockUseReadingComplianceQuery.mockReset()
    mockUsePumpOperatorsBySchemeQuery.mockReturnValue({ data: undefined })
    mockUsePumpOperatorDetailsQuery.mockReturnValue({ data: undefined })
    mockUseReadingComplianceQuery.mockReturnValue({ data: undefined })
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

    expect(screen.getByTestId('supply-outage-reasons-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-status-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-compliance-table')).toBeTruthy()
  })

  it('paginates pump operator details with previous/next and page buttons', () => {
    renderVillageDashboard()

    expect(screen.getByText('Ajay Yadav')).toBeTruthy()
    expect(screen.getByText('11-02-24, 1:00pm')).toBeTruthy()
    let complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: 'operator-4',
        name: 'Ajay Yadav',
        village: 'N/A',
        lastSubmission: '11-02-24, 1:00pm',
        readingValue: 'N/A',
      },
    ])

    const previousButton = screen.getByRole('button', { name: 'Previous' })
    const nextButton = screen.getByRole('button', { name: 'Next' })
    expect((previousButton as HTMLButtonElement).disabled).toBe(true)
    expect((nextButton as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByText('Vikram Singh')).toBeTruthy()
    expect(screen.getByText('13-02-24, 10:30am')).toBeTruthy()
    complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: 'operator-4',
        name: 'Vikram Singh',
        village: 'N/A',
        lastSubmission: '13-02-24, 10:30am',
        readingValue: 'N/A',
      },
    ])

    fireEvent.click(nextButton)
    expect(screen.getByText('Neha Kumari')).toBeTruthy()
    expect(screen.getByText('17-02-24, 3:45pm')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('Vikram Singh')).toBeTruthy()
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

  it('renders all scheme submission rows from the reading compliance api', () => {
    mockUseReadingComplianceQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operators retrieved',
        data: {
          content: [
            {
              id: 4,
              uuid: 'uuid-1',
              name: 'Ajay Yadav',
              schemeId: 3,
              readingAt: '2026-03-17T15:06:10.896445',
              lastSubmissionAt: '2026-03-17T15:06:10.896445',
              confirmedReading: 104958.72,
            },
            {
              id: 4,
              uuid: 'uuid-1',
              name: 'Ajay Yadav',
              schemeId: 3,
              readingAt: '2026-03-17T15:06:20.896445',
              lastSubmissionAt: '2026-03-17T15:06:20.896445',
              confirmedReading: 104602.8,
            },
            {
              id: 9001,
              uuid: 'uuid-9001',
              name: 'Someone Else',
              schemeId: 3,
              readingAt: '2026-03-17T15:06:30.896445',
              lastSubmissionAt: '2026-03-17T15:06:30.896445',
              confirmedReading: 101419.13,
            },
          ],
        },
      },
    })

    renderVillageDashboard()

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ id: string; name: string; readingValue: string }>
    }

    expect(mockUseReadingComplianceQuery).toHaveBeenCalledWith({
      params: {
        tenant_code: 'as',
        scheme_id: 3,
        page: 0,
        size: 50,
      },
      enabled: true,
    })
    expect(complianceProps.data).toHaveLength(2)
    expect(complianceProps.data.map((row) => row.name)).toEqual(['Ajay Yadav', 'Ajay Yadav'])
    expect(new Set(complianceProps.data.map((row) => row.id)).size).toBe(2)
    expect(complianceProps.data[0]?.readingValue).toBe('104958.72')
  })

  it('switches reading compliance rows when the selected operator page changes', () => {
    mockUsePumpOperatorsBySchemeQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operators retrieved',
        data: [
          {
            schemeId: 3,
            schemeName: 'Rural Water Supply 001',
            pumpOperators: [
              {
                id: 4,
                uuid: 'uuid-1',
                name: 'Ajay Yadav',
                email: 'ajay@example.com',
                phoneNumber: '910000000001',
                status: 0,
              },
              {
                id: 5,
                uuid: 'uuid-2',
                name: 'Vikram Singh',
                email: 'vikram@example.com',
                phoneNumber: '910000000002',
                status: 0,
              },
            ],
          },
        ],
      },
    })
    mockUseReadingComplianceQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operators retrieved',
        data: {
          content: [
            {
              id: 4,
              uuid: 'uuid-1',
              name: 'Ajay Yadav',
              schemeId: 3,
              readingAt: '2026-03-17T15:06:10.896445',
              lastSubmissionAt: '2026-03-17T15:06:10.896445',
              confirmedReading: 104958.72,
            },
            {
              id: 5,
              uuid: 'uuid-2',
              name: 'Vikram Singh',
              schemeId: 3,
              readingAt: '2026-03-18T10:00:00.000000',
              lastSubmissionAt: '2026-03-18T10:00:00.000000',
              confirmedReading: 103361.57,
            },
            {
              id: 5,
              uuid: 'uuid-2',
              name: 'Vikram Singh',
              schemeId: 3,
              readingAt: '2026-03-19T10:00:00.000000',
              lastSubmissionAt: '2026-03-19T10:00:00.000000',
              confirmedReading: 103400,
            },
          ],
        },
      },
    })

    renderVillageDashboard([], [villagePumpOperatorDetails])

    let complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '3-4-2026-03-17T15:06:10.896445',
        name: 'Ajay Yadav',
        village: 'N/A',
        lastSubmission: '17-03-26, 3:06pm',
        readingValue: '104958.72',
      },
    ])

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '3-5-2026-03-18T10:00:00.000000',
        name: 'Vikram Singh',
        village: 'N/A',
        lastSubmission: '18-03-26, 10:00am',
        readingValue: '103361.57',
      },
      {
        id: '3-5-2026-03-19T10:00:00.000000',
        name: 'Vikram Singh',
        village: 'N/A',
        lastSubmission: '19-03-26, 10:00am',
        readingValue: '103400',
      },
    ])
  })

  it('uses live operators from the by-scheme api without copying fallback details to other operators', () => {
    mockUsePumpOperatorsBySchemeQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operators retrieved',
        data: [
          {
            schemeId: 3,
            schemeName: 'CORRAMORE PWSS (Point-III) 18294',
            pumpOperators: [
              {
                id: 4,
                uuid: 'uuid-1',
                name: 'Ajay Yadav',
                email: 'ajay@example.com',
                phoneNumber: '910000000001',
                status: 0,
              },
              {
                id: 5,
                uuid: 'uuid-2',
                name: 'Anil Gogi',
                email: 'anil@example.com',
                phoneNumber: '910000000004',
                status: 0,
              },
            ],
          },
        ],
      },
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        tenantCode="as"
      />
    )

    expect(mockUsePumpOperatorsBySchemeQuery).toHaveBeenCalledWith({
      params: {
        tenant_code: 'as',
        scheme_id: 3,
      },
      enabled: true,
    })

    expect(screen.getByText('Ajay Yadav')).toBeTruthy()
    expect(screen.getByText('CORRAMORE PWSS (Point-III) 18294 / 3')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByText('Anil Gogi')).toBeTruthy()
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
  })

  it('keeps scheme-specific pagination when the same operator is mapped to multiple schemes', () => {
    mockUsePumpOperatorsBySchemeQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operators retrieved',
        data: [
          {
            schemeId: 3,
            schemeName: 'CORRAMORE PWSS (Point-III) 18294',
            pumpOperators: [
              {
                id: 4,
                uuid: 'uuid-1',
                name: 'Ajay Yadav',
                email: 'ajay@example.com',
                phoneNumber: '910000000001',
                status: 0,
              },
            ],
          },
          {
            schemeId: 8,
            schemeName: 'GELABIL PWSS',
            pumpOperators: [
              {
                id: 4,
                uuid: 'uuid-1',
                name: 'Ajay Yadav',
                email: 'ajay@example.com',
                phoneNumber: '910000000001',
                status: 0,
              },
            ],
          },
        ],
      },
    })
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operator retrieved',
        data: {
          id: 4,
          uuid: 'uuid-1',
          name: 'Ajay Yadav',
          email: 'ajay@example.com',
          phoneNumber: '910000000001',
          status: 0,
          schemeId: 99,
          schemeName: 'SHOULD NOT OVERRIDE SUMMARY',
          schemeLatitude: null,
          schemeLongitude: null,
          lastSubmissionAt: '2024-02-11T13:00:00Z',
          firstSubmissionDate: null,
          totalDaysSinceFirstSubmission: null,
          submittedDays: 0,
          reportingRatePercent: 88,
          missedSubmissionDays: 1,
          inactiveDays: 0,
        },
      },
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        tenantCode="as"
        schemeId={3}
      />
    )

    expect(screen.getByText('CORRAMORE PWSS (Point-III) 18294 / 3')).toBeTruthy()

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ id: string }>
    }
    expect(complianceProps.data[0]?.id).toBe('operator-3-4')

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByText('GELABIL PWSS / 8')).toBeTruthy()
  })

  it('shows missing submission count when the details api returns missed submission dates', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operator retrieved',
        data: {
          id: 4,
          uuid: 'uuid-1',
          name: 'Ajay Yadav',
          email: 'ajay@example.com',
          phoneNumber: '910000000001',
          status: 0,
          schemeId: 3,
          schemeName: 'Rural Water Supply 001',
          schemeLatitude: null,
          schemeLongitude: null,
          lastSubmissionAt: '2024-02-11T13:00:00Z',
          firstSubmissionDate: null,
          totalDaysSinceFirstSubmission: 40,
          submittedDays: 31,
          reportingRatePercent: 77.5,
          missedSubmissionDays: [
            '2026-02-25',
            '2026-03-11',
            '2026-03-12',
            '2026-03-13',
            '2026-03-14',
            '2026-03-15',
            '2026-03-16',
            '2026-03-18',
            '2026-03-19',
          ],
          inactiveDays: 0,
        },
      },
    })

    renderVillageDashboard([], [villagePumpOperatorDetails])

    expect(screen.getByText('9')).toBeTruthy()
  })
})

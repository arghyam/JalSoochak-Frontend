import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen, waitFor } from '@testing-library/react'
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
const mockReadingComplianceTable = jest.fn((props: { onReachEnd?: () => void }) => (
  <div>
    <div data-testid="reading-compliance-table" />
    {props.onReachEnd ? (
      <button onClick={props.onReachEnd} type="button">
        Load more compliance
      </button>
    ) : null}
  </div>
))
const mockUsePumpOperatorsBySchemeQuery = jest.fn<(options: unknown) => { data: unknown }>(
  (_options: unknown) => ({ data: undefined })
)
const mockUsePumpOperatorDetailsQuery = jest.fn<(options: unknown) => { data: unknown }>(
  (_options: unknown) => ({ data: undefined })
)
const mockUseReadingComplianceQuery = jest.fn<
  (options: unknown) => { data: unknown; isFetching?: boolean }
>((_options: unknown) => ({ data: undefined, isFetching: false }))

jest.mock('../charts', () => ({
  MetricPerformanceChart: (props: unknown) => mockMetricPerformanceChart(props),
  SupplyOutageReasonsChart: (props: unknown) => mockSupplyOutageReasonsChart(props),
  ReadingSubmissionStatusChart: (props: unknown) => mockReadingSubmissionStatusChart(props),
}))

jest.mock('../tables', () => ({
  ReadingComplianceTable: (props: unknown) =>
    mockReadingComplianceTable(props as { onReachEnd?: () => void }),
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

const secondVillagePumpOperatorDetails = {
  id: 7,
  uuid: 'uuid-7',
  schemeId: 9,
  name: 'Sanjay Roy',
  scheme: 'Haluwating Bazar PWSS / 7714',
  stationLocation: '26.7783233, 94.5703217',
  lastSubmission: '17-03-26, 3:06pm',
  reportingRate: '68.75%',
  missingSubmissionCount: '10',
  inactiveDays: 'N/A',
}

const quantityTimeTrendData = [
  { period: '12 Mar', value: 87 },
  { period: '13 Mar', value: 91 },
]

const regularityTimeTrendData = [
  { period: '12 Mar', value: 65 },
  { period: '13 Mar', value: 72 },
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
      quantityTimeTrendData={quantityTimeTrendData}
      regularityTimeTrendData={regularityTimeTrendData}
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
    mockUseReadingComplianceQuery.mockReturnValue({ data: undefined, isFetching: false })
  })

  it('renders quantity and regularity using metric performance charts', () => {
    renderVillageDashboard()

    const metricCalls = mockMetricPerformanceChart.mock.calls as Array<[Record<string, unknown>]>
    expect(metricCalls.length).toBeGreaterThanOrEqual(2)
    const latestMetricCalls = metricCalls.slice(-2)
    expect(latestMetricCalls[0]?.[0].metric).toBe('quantity')
    expect(latestMetricCalls[0]?.[0].seriesName).toBe('Quantity')
    expect(latestMetricCalls[1]?.[0].metric).toBe('regularity')
    expect(latestMetricCalls[1]?.[0].seriesName).toBe('Regularity')

    expect(screen.getByTestId('supply-outage-reasons-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-status-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-compliance-table')).toBeTruthy()
  })

  it('prefers analytics trend props over legacy demandSupply data for village charts', () => {
    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={data.readingCompliance}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={villagePumpOperators}
        tenantCode="as"
        schemeId={3}
        quantityTimeTrendData={quantityTimeTrendData}
        regularityTimeTrendData={regularityTimeTrendData}
      />
    )

    const metricCalls = mockMetricPerformanceChart.mock.calls as Array<[Record<string, unknown>]>
    expect(metricCalls.length).toBeGreaterThanOrEqual(2)
    const latestMetricCalls = metricCalls.slice(-2)
    expect(latestMetricCalls[0]?.[0].data).toEqual([
      expect.objectContaining({ name: '12 Mar', quantity: 87 }),
      expect.objectContaining({ name: '13 Mar', quantity: 91 }),
    ])
    expect(latestMetricCalls[1]?.[0].data).toEqual([
      expect.objectContaining({ name: '12 Mar', regularity: 65 }),
      expect.objectContaining({ name: '13 Mar', regularity: 72 }),
    ])
  })

  it('shows empty chart states when analytics trend props are absent', () => {
    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={data.readingCompliance}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={villagePumpOperators}
        tenantCode="as"
        schemeId={3}
      />
    )

    expect(mockMetricPerformanceChart).not.toHaveBeenCalled()
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
        id: 'operator-3-4',
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
        id: 'operator-3-4',
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
    expect(complianceProps.data[0]?.readingValue).toBe('104602.8')
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
                status: 1,
              },
              {
                id: 5,
                uuid: 'uuid-2',
                name: 'Vikram Singh',
                email: 'vikram@example.com',
                phoneNumber: '910000000002',
                status: 1,
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
              schemeName: 'Rural Water Supply 001',
              reportingRatePercent: 85,
              missingSubmissionCount: 3,
              inactiveDays: 2,
              readingAt: '2026-03-17T15:06:10.896445',
              lastSubmissionAt: '2026-03-17T15:06:10.896445',
              confirmedReading: 104958.72,
            },
            {
              id: 5,
              uuid: 'uuid-2',
              name: 'Vikram Singh',
              schemeId: 3,
              schemeName: 'Rural Water Supply 001',
              reportingRatePercent: 92,
              missingSubmissionCount: 1,
              inactiveDays: 0,
              readingAt: '2026-03-18T10:00:00.000000',
              lastSubmissionAt: '2026-03-18T10:00:00.000000',
              confirmedReading: 103361.57,
            },
            {
              id: 5,
              uuid: 'uuid-2',
              name: 'Vikram Singh',
              schemeId: 3,
              schemeName: 'Rural Water Supply 001',
              reportingRatePercent: 92,
              missingSubmissionCount: 1,
              inactiveDays: 0,
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
        id: '3-4-2026-03-17T15:06:10.896445-104958.72-0',
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
        id: '3-5-2026-03-19T10:00:00.000000-103400-0',
        name: 'Vikram Singh',
        village: 'N/A',
        lastSubmission: '19-03-26, 10:00am',
        readingValue: '103400',
      },
      {
        id: '3-5-2026-03-18T10:00:00.000000-103361.57-1',
        name: 'Vikram Singh',
        village: 'N/A',
        lastSubmission: '18-03-26, 10:00am',
        readingValue: '103361.57',
      },
    ])
  })

  it('normalizes uppercase scheme labels in pump operator details', async () => {
    mockUseReadingComplianceQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operators retrieved',
        data: {
          content: [
            {
              id: 6040,
              uuid: 'uuid-sanjay',
              name: 'Sanjay Das',
              status: 'INACTIVE',
              schemeId: 1461,
              schemeName: 'BAMPARA PWSS',
              reportingRatePercent: 9.09,
              missingSubmissionCount: 10,
              inactiveDays: 10,
              readingAt: '2026-03-17T15:06:10.896445',
              lastSubmissionAt: '2026-03-17T15:06:10.896445',
              confirmedReading: 104958.72,
            },
          ],
        },
      },
      isFetching: false,
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={secondVillagePumpOperatorDetails}
        villagePumpOperators={[secondVillagePumpOperatorDetails]}
        tenantCode="as"
        schemeId={1461}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Bampara Pwss / 1461')).toBeTruthy()
    })
  })

  it('uses by-scheme operator identities to avoid combining history across paginated operators', () => {
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
                status: 1,
              },
              {
                id: 5,
                uuid: 'uuid-2',
                name: 'Vikram Singh',
                email: 'vikram@example.com',
                phoneNumber: '910000000002',
                status: 1,
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
              schemeName: 'Rural Water Supply 001',
              readingAt: '2026-03-17T15:06:10.896445',
              lastSubmissionAt: '2026-03-17T15:06:10.896445',
              confirmedReading: 104958.72,
            },
            {
              id: 4,
              uuid: 'uuid-1',
              name: 'Ajay Yadav',
              schemeId: 3,
              schemeName: 'Rural Water Supply 001',
              readingAt: '2026-03-17T15:05:10.896445',
              lastSubmissionAt: '2026-03-17T15:05:10.896445',
              confirmedReading: 104602.8,
            },
            {
              id: 5,
              uuid: 'uuid-2',
              name: 'Vikram Singh',
              schemeId: 3,
              schemeName: 'Rural Water Supply 001',
              readingAt: '2026-03-18T10:00:00.000000',
              lastSubmissionAt: '2026-03-18T10:00:00.000000',
              confirmedReading: 103361.57,
            },
            {
              id: 5,
              uuid: 'uuid-2',
              name: 'Vikram Singh',
              schemeId: 3,
              schemeName: 'Rural Water Supply 001',
              readingAt: '2026-03-19T10:00:00.000000',
              lastSubmissionAt: '2026-03-19T10:00:00.000000',
              confirmedReading: 103400,
            },
          ],
        },
      },
    })

    renderVillageDashboard(
      [],
      [
        villagePumpOperatorDetails,
        {
          ...villagePumpOperatorDetails,
          name: 'Vikram Singh',
        },
      ]
    )

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '3-5-2026-03-19T10:00:00.000000-103400-0',
        name: 'Vikram Singh',
        village: 'N/A',
        lastSubmission: '19-03-26, 10:00am',
        readingValue: '103400',
      },
      {
        id: '3-5-2026-03-18T10:00:00.000000-103361.57-1',
        name: 'Vikram Singh',
        village: 'N/A',
        lastSubmission: '18-03-26, 10:00am',
        readingValue: '103361.57',
      },
    ])
  })

  it('clears old operator compliance rows when the village props change without a refresh', () => {
    mockUseReadingComplianceQuery.mockImplementation((options) => {
      const params = (options as { params?: { scheme_id?: number } | null }).params

      if (params?.scheme_id === 3) {
        return {
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
                  readingAt: '2026-03-17T15:06:20.896445',
                  lastSubmissionAt: '2026-03-17T15:06:20.896445',
                  confirmedReading: 104602.8,
                },
              ],
            },
          },
        }
      }

      if (params?.scheme_id === 9) {
        return {
          data: {
            status: 200,
            message: 'Pump operators retrieved',
            data: {
              content: [
                {
                  id: 7,
                  uuid: 'uuid-7',
                  name: 'Sanjay Roy',
                  schemeId: 9,
                  readingAt: '2026-03-17T15:06:10.896445',
                  lastSubmissionAt: '2026-03-17T15:06:10.896445',
                  confirmedReading: 103985.13,
                },
              ],
            },
          },
        }
      }

      return { data: undefined }
    })

    const view = renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={[villagePumpOperatorDetails]}
        tenantCode="as"
        schemeId={3}
      />
    )

    let complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '3-4-2026-03-17T15:06:20.896445-104602.8-0',
        name: 'Ajay Yadav',
        village: 'N/A',
        lastSubmission: '17-03-26, 3:06pm',
        readingValue: '104602.8',
      },
    ])

    view.rerender(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={secondVillagePumpOperatorDetails}
        villagePumpOperators={[secondVillagePumpOperatorDetails]}
        tenantCode="as"
        schemeId={9}
      />
    )

    complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '9-7-2026-03-17T15:06:10.896445-103985.13-0',
        name: 'Sanjay Roy',
        village: 'N/A',
        lastSubmission: '17-03-26, 3:06pm',
        readingValue: '103985.13',
      },
    ])
  })

  it('uses live operators from the by-scheme api without copying fallback details to other operators', () => {
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
              email: 'ajay@example.com',
              phoneNumber: '910000000001',
              status: 'ACTIVE',
              schemeId: 3,
              schemeName: 'CORRAMORE PWSS (Point-III) 18294',
              reportingRatePercent: 77.5,
              missingSubmissionCount: 2,
              inactiveDays: 0,
              readingAt: '2026-03-17T15:06:10.896445',
              lastSubmissionAt: '2026-03-17T15:06:10.896445',
              confirmedReading: 104958.72,
            },
            {
              id: 5,
              uuid: 'uuid-2',
              name: 'Anil Gogi',
              email: 'anil@example.com',
              phoneNumber: '910000000004',
              status: 'INACTIVE',
              schemeId: 3,
              schemeName: 'CORRAMORE PWSS (Point-III) 18294',
              reportingRatePercent: 66.67,
              missingSubmissionCount: 5,
              inactiveDays: 4,
              readingAt: '2026-03-18T10:00:00.000000',
              lastSubmissionAt: '2026-03-18T10:00:00.000000',
              confirmedReading: 103361.57,
            },
          ],
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
      />
    )

    expect(mockUseReadingComplianceQuery).toHaveBeenCalledWith({
      params: {
        tenant_code: 'as',
        scheme_id: 3,
        page: 0,
        size: 50,
      },
      enabled: true,
    })

    expect(screen.getByText('Ajay Yadav')).toBeTruthy()
    expect(screen.getByText('Corramore Pwss (Point-Iii) 18294 / 3')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByText('Anil Gogi')).toBeTruthy()
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
  })

  it('keeps scheme-specific pagination when the same operator is mapped to multiple schemes', () => {
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
              email: 'ajay@example.com',
              phoneNumber: '910000000001',
              status: 'ACTIVE',
              schemeId: 3,
              schemeName: 'CORRAMORE PWSS (Point-III) 18294',
              reportingRatePercent: 88,
              missedSubmissionDays: 1,
              inactiveDays: 0,
              lastSubmissionAt: '2024-02-11T13:00:00Z',
              readingAt: '2024-02-11T13:00:00Z',
              confirmedReading: 100,
            },
            {
              id: 4,
              uuid: 'uuid-1',
              name: 'Ajay Yadav',
              email: 'ajay@example.com',
              phoneNumber: '910000000001',
              status: 'ACTIVE',
              schemeId: 8,
              schemeName: 'GELABIL PWSS',
              reportingRatePercent: 91,
              missedSubmissionDays: 0,
              inactiveDays: 0,
              lastSubmissionAt: '2024-02-12T13:00:00Z',
              readingAt: '2024-02-12T13:00:00Z',
              confirmedReading: 101,
            },
          ],
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

    expect(screen.getByText('Corramore Pwss (Point-Iii) 18294 / 3')).toBeTruthy()

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ id: string }>
    }
    expect(complianceProps.data[0]?.id).toBe('3-4-2024-02-11T13:00:00Z-100-0')

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByText('Gelabil Pwss / 8')).toBeTruthy()
    expect(screen.queryByText('Central Pumping Station')).toBeNull()
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
  })

  it('shows missing submission count from the reading compliance api when missed submission dates are returned', () => {
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
              email: 'ajay@example.com',
              phoneNumber: '910000000001',
              status: 'ACTIVE',
              schemeId: 3,
              schemeName: 'Rural Water Supply 001',
              lastSubmissionAt: '2024-02-11T13:00:00Z',
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
              confirmedReading: 100,
            },
          ],
        },
      },
    })

    renderVillageDashboard([], [villagePumpOperatorDetails])

    expect(screen.getByText('9')).toBeTruthy()
  })

  it('shows only the selected pump operator history in reading compliance', () => {
    mockUseReadingComplianceQuery.mockReturnValue({
      data: {
        status: 200,
        message: 'Pump operators retrieved',
        data: {
          content: [
            {
              id: 6040,
              uuid: 'uuid-sanjay',
              name: 'Sanjay Das',
              status: 'INACTIVE',
              schemeId: 4500,
              schemeName: 'CHARBARI STATION WEST PWSS',
              reportingRatePercent: 14.29,
              missingSubmissionCount: 6,
              inactiveDays: 6,
              readingAt: '2026-03-17T15:06:10.896445',
              lastSubmissionAt: '2026-03-17T15:06:10.896445',
              confirmedReading: 104958.72,
            },
            {
              id: 6040,
              uuid: 'uuid-sanjay',
              name: 'Sanjay Das',
              status: 'INACTIVE',
              schemeId: 4500,
              schemeName: 'CHARBARI STATION WEST PWSS',
              reportingRatePercent: 14.29,
              missingSubmissionCount: 6,
              inactiveDays: 6,
              readingAt: '2026-03-17T15:05:10.896445',
              lastSubmissionAt: '2026-03-17T15:05:10.896445',
              confirmedReading: 101419.13,
            },
            {
              id: 8877,
              uuid: 'uuid-anil',
              name: 'Anil Roy',
              status: 'INACTIVE',
              schemeId: 4500,
              schemeName: 'CHARBARI STATION WEST PWSS',
              reportingRatePercent: 14.29,
              missingSubmissionCount: 6,
              inactiveDays: 6,
              readingAt: '2026-03-17T15:06:10.896445',
              lastSubmissionAt: '2026-03-17T15:06:10.896445',
              confirmedReading: 104602.8,
            },
          ],
        },
      },
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={[villagePumpOperatorDetails]}
        tenantCode="as"
        schemeId={4500}
      />
    )

    let complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '4500-6040-2026-03-17T15:06:10.896445-104958.72-0',
        name: 'Sanjay Das',
        village: 'N/A',
        lastSubmission: '17-03-26, 3:06pm',
        readingValue: '104958.72',
      },
      {
        id: '4500-6040-2026-03-17T15:05:10.896445-101419.13-1',
        name: 'Sanjay Das',
        village: 'N/A',
        lastSubmission: '17-03-26, 3:05pm',
        readingValue: '101419.13',
      },
    ])

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '4500-8877-2026-03-17T15:06:10.896445-104602.8-0',
        name: 'Anil Roy',
        village: 'N/A',
        lastSubmission: '17-03-26, 3:06pm',
        readingValue: '104602.8',
      },
    ])
  })

  it('auto-loads older compliance pages until the selected operator history is available', async () => {
    mockUseReadingComplianceQuery.mockImplementation((options) => {
      const params = (options as { params?: { page?: number } | null }).params

      if (params?.page === 1) {
        return {
          data: {
            status: 200,
            message: 'Pump operators retrieved',
            data: {
              content: [
                {
                  id: 6040,
                  uuid: 'uuid-sanjay',
                  name: 'Sanjay Das',
                  status: 'INACTIVE',
                  schemeId: 4500,
                  schemeName: 'CHARBARI STATION WEST PWSS',
                  reportingRatePercent: 14.29,
                  missingSubmissionCount: 6,
                  inactiveDays: 6,
                  readingAt: '2026-03-17T15:05:10.896445',
                  lastSubmissionAt: '2026-03-17T15:05:10.896445',
                  confirmedReading: 101419.13,
                },
              ],
              totalPages: 2,
              number: 1,
            },
          },
          isFetching: false,
        }
      }

      return {
        data: {
          status: 200,
          message: 'Pump operators retrieved',
          data: {
            content: [
              {
                id: 6040,
                uuid: 'uuid-sanjay',
                name: 'Sanjay Das',
                status: 'INACTIVE',
                schemeId: 4500,
                schemeName: 'CHARBARI STATION WEST PWSS',
                reportingRatePercent: 14.29,
                missingSubmissionCount: 6,
                inactiveDays: 6,
                readingAt: '2026-03-17T15:06:10.896445',
                lastSubmissionAt: '2026-03-17T15:06:10.896445',
                confirmedReading: 104958.72,
              },
              {
                id: 8877,
                uuid: 'uuid-anil',
                name: 'Anil Roy',
                status: 'INACTIVE',
                schemeId: 4500,
                schemeName: 'CHARBARI STATION WEST PWSS',
                reportingRatePercent: 14.29,
                missingSubmissionCount: 6,
                inactiveDays: 6,
                readingAt: '2026-03-17T15:06:00.896445',
                lastSubmissionAt: '2026-03-17T15:06:00.896445',
                confirmedReading: 104602.8,
              },
            ],
            totalPages: 2,
            number: 0,
          },
        },
        isFetching: false,
      }
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={[villagePumpOperatorDetails]}
        tenantCode="as"
        schemeId={4500}
      />
    )

    await waitFor(() =>
      expect(mockUseReadingComplianceQuery).toHaveBeenCalledWith({
        params: {
          tenant_code: 'as',
          scheme_id: 4500,
          page: 1,
          size: 50,
        },
        enabled: true,
      })
    )

    await waitFor(() => {
      const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
        data: Array<{ name: string; readingValue: string }>
      }

      expect(complianceProps.data).toEqual([
        {
          id: '4500-6040-2026-03-17T15:06:10.896445-104958.72-0',
          name: 'Sanjay Das',
          village: 'N/A',
          lastSubmission: '17-03-26, 3:06pm',
          readingValue: '104958.72',
        },
        {
          id: '4500-6040-2026-03-17T15:05:10.896445-101419.13-1',
          name: 'Sanjay Das',
          village: 'N/A',
          lastSubmission: '17-03-26, 3:05pm',
          readingValue: '101419.13',
        },
      ])
    })
  })

  it('stops auto-loading when the next page does not contain the selected operator', async () => {
    mockUseReadingComplianceQuery.mockImplementation((options) => {
      const params = (options as { params?: { page?: number } | null }).params

      if (params?.page === 1) {
        return {
          data: {
            status: 200,
            message: 'Pump operators retrieved',
            data: {
              content: [
                {
                  id: 8877,
                  uuid: 'uuid-anil',
                  name: 'Anil Roy',
                  status: 'INACTIVE',
                  schemeId: 4500,
                  schemeName: 'CHARBARI STATION WEST PWSS',
                  reportingRatePercent: 14.29,
                  missingSubmissionCount: 6,
                  inactiveDays: 6,
                  readingAt: '2026-03-17T15:05:10.896445',
                  lastSubmissionAt: '2026-03-17T15:05:10.896445',
                  confirmedReading: 101419.13,
                },
              ],
              totalPages: 5,
              number: 1,
            },
          },
          isFetching: false,
        }
      }

      if ((params?.page ?? 0) > 1) {
        throw new Error(`unexpected auto-load for page ${params?.page}`)
      }

      return {
        data: {
          status: 200,
          message: 'Pump operators retrieved',
          data: {
            content: [
              {
                id: 6040,
                uuid: 'uuid-sanjay',
                name: 'Sanjay Das',
                status: 'INACTIVE',
                schemeId: 4500,
                schemeName: 'CHARBARI STATION WEST PWSS',
                reportingRatePercent: 14.29,
                missingSubmissionCount: 6,
                inactiveDays: 6,
                readingAt: '2026-03-17T15:06:10.896445',
                lastSubmissionAt: '2026-03-17T15:06:10.896445',
                confirmedReading: 104958.72,
              },
            ],
            totalPages: 5,
            number: 0,
          },
        },
        isFetching: false,
      }
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={[villagePumpOperatorDetails]}
        tenantCode="as"
        schemeId={4500}
      />
    )

    await waitFor(() =>
      expect(mockUseReadingComplianceQuery).toHaveBeenCalledWith({
        params: {
          tenant_code: 'as',
          scheme_id: 4500,
          page: 1,
          size: 50,
        },
        enabled: true,
      })
    )

    expect(mockUseReadingComplianceQuery).not.toHaveBeenCalledWith({
      params: {
        tenant_code: 'as',
        scheme_id: 4500,
        page: 2,
        size: 50,
      },
      enabled: true,
    })
  })

  it('loads the next scheme compliance page when the table reaches the bottom', () => {
    const firstPageResponse = {
      status: 200,
      message: 'Pump operators retrieved',
      data: {
        content: Array.from({ length: 50 }, (_, index) => ({
          id: 4,
          uuid: 'uuid-1',
          name: 'Ajay Yadav',
          schemeId: 3,
          schemeName: 'Rural Water Supply 001',
          readingAt: `2026-03-17T15:${String(59 - index).padStart(2, '0')}:10.896445`,
          lastSubmissionAt: `2026-03-17T15:${String(59 - index).padStart(2, '0')}:10.896445`,
          confirmedReading: 104958.72 - index,
        })),
        totalPages: 2,
        number: 0,
      },
    }
    const secondPageResponse = {
      status: 200,
      message: 'Pump operators retrieved',
      data: {
        content: [
          {
            id: 4,
            uuid: 'uuid-1',
            name: 'Ajay Yadav',
            schemeId: 3,
            schemeName: 'Rural Water Supply 001',
            readingAt: '2026-03-17T15:04:10.896445',
            lastSubmissionAt: '2026-03-17T15:04:10.896445',
            confirmedReading: 104500.12,
          },
        ],
        totalPages: 2,
        number: 1,
      },
    }

    mockUseReadingComplianceQuery.mockImplementation((options) => {
      const params = (options as { params?: { page?: number } | null }).params

      if (params?.page === 1) {
        return {
          data: secondPageResponse,
          isFetching: false,
        }
      }

      return {
        data: firstPageResponse,
        isFetching: false,
      }
    })

    renderVillageDashboard([], [villagePumpOperatorDetails])

    fireEvent.click(screen.getByRole('button', { name: 'Load more compliance' }))

    expect(mockUseReadingComplianceQuery).toHaveBeenCalledWith({
      params: {
        tenant_code: 'as',
        scheme_id: 3,
        page: 1,
        size: 50,
      },
      enabled: true,
    })

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ lastSubmission: string }>
    }
    expect(complianceProps.data).toHaveLength(51)
    expect(complianceProps.data.at(-1)?.lastSubmission).toBe('17-03-26, 3:04pm')
  })

  it('uses pagination metadata instead of only content length to continue loading pages', () => {
    mockUseReadingComplianceQuery.mockImplementation((options) => {
      const params = (options as { params?: { page?: number } | null }).params

      if (params?.page === 1) {
        return {
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
                  schemeName: 'Rural Water Supply 001',
                  readingAt: '2026-03-17T15:04:10.896445',
                  lastSubmissionAt: '2026-03-17T15:04:10.896445',
                  confirmedReading: 104500.12,
                },
              ],
              totalPages: 3,
              number: 1,
            },
          },
          isFetching: false,
        }
      }

      if (params?.page === 2) {
        return {
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
                  schemeName: 'Rural Water Supply 001',
                  readingAt: '2026-03-17T15:03:10.896445',
                  lastSubmissionAt: '2026-03-17T15:03:10.896445',
                  confirmedReading: 104400.12,
                },
              ],
              totalPages: 3,
              number: 2,
            },
          },
          isFetching: false,
        }
      }

      return {
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
                schemeName: 'Rural Water Supply 001',
                readingAt: '2026-03-17T15:06:10.896445',
                lastSubmissionAt: '2026-03-17T15:06:10.896445',
                confirmedReading: 104958.72,
              },
            ],
            totalPages: 3,
            number: 0,
          },
        },
        isFetching: false,
      }
    })

    renderVillageDashboard([], [villagePumpOperatorDetails])

    fireEvent.click(screen.getByRole('button', { name: 'Load more compliance' }))
    fireEvent.click(screen.getByRole('button', { name: 'Load more compliance' }))

    expect(mockUseReadingComplianceQuery).toHaveBeenCalledWith({
      params: {
        tenant_code: 'as',
        scheme_id: 3,
        page: 2,
        size: 50,
      },
      enabled: true,
    })
  })
})

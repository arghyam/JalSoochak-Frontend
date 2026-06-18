import React from 'react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData, WaterSupplyOutageData } from '../../types'
import { VillageDashboardScreen } from './village-dashboard'

const mockMonthlyTrendChart = jest.fn((_props: unknown) => (
  <div data-testid="monthly-trend-chart" />
))
const mockSupplyOutageReasonsChart = jest.fn((_props: unknown) => (
  <div data-testid="supply-outage-reasons-chart" />
))
const mockReadingSubmissionStatusChart = jest.fn((_props: unknown) => (
  <div data-testid="reading-submission-status-chart" />
))
const mockReadingComplianceTable = jest.fn(
  (props: {
    onReachEnd?: () => void
    data?: Array<unknown>
    dateFormat?: string
    headerRight?: React.ReactNode
  }) => (
    <div>
      {props.headerRight ?? null}
      {props.data?.length ? (
        <div data-testid="reading-compliance-table" />
      ) : (
        <div>No data available</div>
      )}
      {props.onReachEnd ? (
        <button onClick={props.onReachEnd} type="button">
          Load more compliance
        </button>
      ) : null}
    </div>
  )
)
let mockUseQueriesData: Array<{ data: unknown }> = []
const mockUsePumpOperatorDetailsQuery = jest.fn<(options: unknown) => { data: unknown }>(
  (_options: unknown) => ({ data: undefined })
)
const mockUseReadingComplianceQuery = jest.fn<
  (options: unknown) => { data: unknown; isFetching?: boolean }
>((_options: unknown) => ({ data: undefined, isFetching: false }))

jest.mock('../charts', () => ({
  MonthlyTrendChart: (props: unknown) => mockMonthlyTrendChart(props),
  SupplyOutageReasonsChart: (props: unknown) => mockSupplyOutageReasonsChart(props),
  ReadingSubmissionStatusChart: (props: unknown) => mockReadingSubmissionStatusChart(props),
}))

jest.mock('../tables', () => ({
  ReadingComplianceTable: (props: unknown) =>
    mockReadingComplianceTable(
      props as {
        onReachEnd?: () => void
        data?: Array<unknown>
        dateFormat?: string
        headerRight?: React.ReactNode
      }
    ),
}))

jest.mock('@tanstack/react-query', () => ({
  ...(jest.requireActual('@tanstack/react-query') as object),
  useQueries: () => mockUseQueriesData,
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
  schemeName: 'Rural Water Supply 001',
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
  schemeName: 'Haluwating Bazar PWSS',
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
      readingAt: '09-08-2025, 3:00pm',
      readingValue: '017848',
    },
    {
      id: 'pe-2',
      name: 'Arjun',
      village: 'Bhedoura',
      lastSubmission: '11-02-2025, 1:00pm',
      readingAt: '11-02-2025, 1:00pm',
      readingValue: '026537',
    },
    {
      id: 'pe-3',
      name: 'Shashwat',
      village: 'Bispur',
      lastSubmission: '03-19-2025, 9:00am',
      readingAt: '03-19-2025, 9:00am',
      readingValue: '034982',
    },
  ],
  operatorPages = villagePumpOperators,
  {
    isQuantityTimeTrendLoading = false,
    isRegularityTimeTrendLoading = false,
    tableDateFormat,
  }: {
    isQuantityTimeTrendLoading?: boolean
    isRegularityTimeTrendLoading?: boolean
    tableDateFormat?: string
  } = {}
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
      allSchemeIds={[3]}
      quantityTimeTrendData={quantityTimeTrendData}
      regularityTimeTrendData={regularityTimeTrendData}
      isQuantityTimeTrendLoading={isQuantityTimeTrendLoading}
      isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
      tableDateFormat={tableDateFormat}
    />
  )
}

describe('VillageDashboardScreen', () => {
  beforeEach(() => {
    mockMonthlyTrendChart.mockClear()
    mockSupplyOutageReasonsChart.mockClear()
    mockReadingSubmissionStatusChart.mockClear()
    mockReadingComplianceTable.mockClear()
    mockUseQueriesData = []
    mockUsePumpOperatorDetailsQuery.mockReset()
    mockUseReadingComplianceQuery.mockReset()
    mockUsePumpOperatorDetailsQuery.mockReturnValue({ data: undefined })
    mockUseReadingComplianceQuery.mockReturnValue({ data: undefined, isFetching: false })
  })

  it('renders quantity and regularity using monthly trend charts', () => {
    renderVillageDashboard()

    const trendCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    expect(trendCalls.length).toBeGreaterThanOrEqual(2)
    const trendProps = trendCalls.map(([props]) => props)
    const quantityTrend = trendProps.find((props) => props.seriesName === 'Quantity')
    const regularityTrend = trendProps.find((props) => props.seriesName === 'Regularity')
    expect(quantityTrend?.isPercent).toBeFalsy()
    expect(regularityTrend?.isPercent).toBe(true)

    expect(screen.getByTestId('supply-outage-reasons-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-status-chart')).toBeTruthy()
    expect(screen.getByTestId('reading-compliance-table')).toBeTruthy()
  })

  it('passes tableDateFormat to reading compliance and formats village timestamps accordingly', () => {
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
          ],
        },
      },
    })

    renderVillageDashboard([], [villagePumpOperatorDetails], {
      tableDateFormat: 'MM/DD/YYYY',
    })

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      dateFormat?: string
      data: Array<{ readingAt: string }>
    }

    expect(complianceProps.dateFormat).toBe('MM/DD/YYYY')
    expect(complianceProps.data[0]?.readingAt).toBe('2026-03-17T15:06:10.896445')
    expect(screen.getByText('03/17/2026, 3:06pm')).toBeTruthy()
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

    const trendCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    expect(trendCalls.length).toBeGreaterThanOrEqual(2)
    const trendProps = trendCalls.map(([props]) => props)
    const quantityTrend = trendProps.find((props) => props.seriesName === 'Quantity')
    const regularityTrend = trendProps.find((props) => props.seriesName === 'Regularity')
    expect(quantityTrend?.data).toEqual([
      expect.objectContaining({ period: '12 Mar', value: 87 }),
      expect.objectContaining({ period: '13 Mar', value: 91 }),
    ])
    expect(regularityTrend?.data).toEqual([
      expect.objectContaining({ period: '12 Mar', value: 65 }),
      expect.objectContaining({ period: '13 Mar', value: 72 }),
    ])
  })

  it('shows time scale controls for village quantity and regularity charts', () => {
    const onQuantityTimeScaleTabChange = jest.fn()
    const onRegularityTimeScaleTabChange = jest.fn()

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
        quantityTimeScaleTab="day"
        onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
        regularityTimeScaleTab="day"
        onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
        enableExtendedTimeScales
      />
    )

    expect(screen.getAllByText('D')).toHaveLength(2)
    expect(screen.getAllByText('W')).toHaveLength(2)
    expect(screen.getAllByText('M')).toHaveLength(2)
    expect(screen.getAllByText('Q')).toHaveLength(2)
    expect(screen.getAllByText('Y')).toHaveLength(2)
    expect(
      screen.queryByRole('button', { name: 'Village regularity performance view by' })
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Village quantity performance view by' })
    ).toBeNull()

    fireEvent.click(screen.getAllByText('Q')[0])
    fireEvent.click(screen.getAllByText('Y')[1])

    expect(onRegularityTimeScaleTabChange).toHaveBeenCalledWith('quarter')
    expect(onQuantityTimeScaleTabChange).toHaveBeenCalledWith('year')
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

    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()
    expect(screen.getAllByText('No data available')).toHaveLength(2)
  })

  it('shows loading spinners instead of monthly trend charts while both trends are loading', () => {
    renderVillageDashboard(undefined, undefined, {
      isQuantityTimeTrendLoading: true,
      isRegularityTimeTrendLoading: true,
    })

    expect(mockMonthlyTrendChart).not.toHaveBeenCalled()
    expect(screen.getAllByText('Loading...')).toHaveLength(2)
  })

  it('shows quantity loading state while regularity still renders chart data', () => {
    renderVillageDashboard(undefined, undefined, {
      isQuantityTimeTrendLoading: true,
    })

    const trendCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    expect(trendCalls).toHaveLength(1)
    expect(trendCalls[0]?.[0].seriesName).toBe('Regularity')
    expect(screen.getByText('Loading...')).toBeTruthy()
  })

  it('shows regularity loading state while quantity still renders chart data', () => {
    renderVillageDashboard(undefined, undefined, {
      isRegularityTimeTrendLoading: true,
    })

    const trendCalls = mockMonthlyTrendChart.mock.calls as Array<[Record<string, unknown>]>
    expect(trendCalls).toHaveLength(1)
    expect(trendCalls[0]?.[0].seriesName).toBe('Quantity')
    expect(screen.getByText('Loading...')).toBeTruthy()
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
        readingAt: '11-02-24, 1:00pm',
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
        readingAt: '13-02-24, 10:30am',
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
          readingAt: '09-08-2025, 3:00pm',
          readingValue: '017848',
        },
      ],
      [villagePumpOperatorDetails]
    )

    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  })

  it('shows no data available when pump operator details and compliance rows are all N/A', () => {
    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={data.readingCompliance}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={{
          name: 'N/A',
          scheme: 'N/A',
          stationLocation: 'N/A',
          lastSubmission: 'N/A',
          reportingRate: 'N/A',
          missingSubmissionCount: 'N/A',
          inactiveDays: 'N/A',
        }}
        villagePumpOperators={[
          {
            name: 'N/A',
            scheme: 'N/A',
            stationLocation: 'N/A',
            lastSubmission: 'N/A',
            reportingRate: 'N/A',
            missingSubmissionCount: 'N/A',
            inactiveDays: 'N/A',
          },
        ]}
        tenantCode="as"
        schemeId={3}
        quantityTimeTrendData={quantityTimeTrendData}
        regularityTimeTrendData={regularityTimeTrendData}
      />
    )

    expect(screen.getAllByText('No data available').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('Pump Operator Details')).toBeTruthy()
    expect(screen.queryByTestId('reading-compliance-table')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  })

  it('renders state scheme id and center scheme id rows without station location', () => {
    renderVillageDashboard()

    expect(screen.getByText('State Scheme ID')).toBeTruthy()
    expect(screen.getByText('Center Scheme ID')).toBeTruthy()
    expect(screen.queryByText('Scheme ID')).toBeNull()
    expect(screen.getByText('Scheme name')).toBeTruthy()
    expect(screen.getByText('Rural Water Supply 001')).toBeTruthy()
    expect(screen.queryByText('Station location')).toBeNull()
    expect(screen.queryByText('Central Pumping Station')).toBeNull()
    expect(screen.queryByText('Inactive days')).toBeNull()
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

  it('keeps scheme-level compliance unchanged when switching between operator pages', () => {
    mockUseQueriesData = [
      {
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
      },
    ]
    // Compliance is now scheme-level — same rows regardless of which operator is shown
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
                  schemeName: 'Rural Water Supply 001',
                  readingAt: '2026-03-17T15:06:10.896445',
                  lastSubmissionAt: '2026-03-17T15:06:10.896445',
                  confirmedReading: 104958.72,
                },
              ],
            },
          },
        }
      }

      return { data: undefined }
    })

    renderVillageDashboard([], [villagePumpOperatorDetails])

    // Verify initial state: scheme-level compliance rows shown
    let complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '3-4-2026-03-17T15:06:10.896445-104958.72-0',
        name: 'Ajay Yadav',
        village: 'N/A',
        lastSubmission: '17/03/26, 3:06pm',
        readingAt: '2026-03-17T15:06:10.896445',
        readingValue: '104958.72',
      },
    ])

    // Switch to page 2 — compliance table remains unchanged (scheme-level, not operator-level)
    fireEvent.click(screen.getByRole('button', { name: '2' }))

    complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '3-4-2026-03-17T15:06:10.896445-104958.72-0',
        name: 'Ajay Yadav',
        village: 'N/A',
        lastSubmission: '17/03/26, 3:06pm',
        readingAt: '2026-03-17T15:06:10.896445',
        readingValue: '104958.72',
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
      expect(screen.getByText('Bampara Pwss')).toBeTruthy()
    })
  })

  it('fetches reading compliance by scheme_id and not by pump_operator_id', () => {
    mockUseQueriesData = [
      {
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
      },
    ]
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
              ],
            },
          },
        }
      }

      return { data: undefined }
    })

    renderVillageDashboard([], [villagePumpOperatorDetails])

    // Compliance is fetched with scheme_id only — no pump_operator_id
    expect(mockUseReadingComplianceQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          scheme_id: 3,
        }),
      })
    )
    expect(mockUseReadingComplianceQuery).not.toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          pump_operator_id: expect.anything(),
        }),
      })
    )

    // Switching operators does not change compliance rows
    fireEvent.click(screen.getByRole('button', { name: '2' }))

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '3-4-2026-03-17T15:06:10.896445-104958.72-0',
        name: 'Ajay Yadav',
        village: 'N/A',
        lastSubmission: '17/03/26, 3:06pm',
        readingAt: '2026-03-17T15:06:10.896445',
        readingValue: '104958.72',
      },
      {
        id: '3-4-2026-03-17T15:05:10.896445-104602.8-1',
        name: 'Ajay Yadav',
        village: 'N/A',
        lastSubmission: '17/03/26, 3:05pm',
        readingAt: '2026-03-17T15:05:10.896445',
        readingValue: '104602.8',
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
        lastSubmission: '17/03/26, 3:06pm',
        readingAt: '2026-03-17T15:06:20.896445',
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
        lastSubmission: '17/03/26, 3:06pm',
        readingAt: '2026-03-17T15:06:10.896445',
        readingValue: '103985.13',
      },
    ])
  })

  it('uses live operators from the by-scheme api without copying fallback details to other operators', () => {
    mockUseQueriesData = [
      {
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
                  status: 'ACTIVE',
                },
                {
                  id: 5,
                  uuid: 'uuid-2',
                  name: 'Anil Gogi',
                  email: 'anil@example.com',
                  phoneNumber: '910000000004',
                  status: 'INACTIVE',
                },
              ],
            },
          ],
        },
      },
    ]
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
                  email: 'ajay@example.com',
                  phoneNumber: '910000000001',
                  status: 'ACTIVE',
                  schemeId: 3,
                  schemeName: 'CORRAMORE PWSS (Point-III) 18294',
                  reportingRatePercent: 77.5,
                  missingSubmissionCount: 2,
                  readingAt: '2026-03-17T15:06:10.896445',
                  lastSubmissionAt: '2026-03-17T15:06:10.896445',
                  confirmedReading: 104958.72,
                },
              ],
            },
          },
        }
      }

      return { data: undefined }
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        tenantCode="as"
        allSchemeIds={[3]}
      />
    )

    // Compliance params must use scheme_id only — no pump_operator_id
    expect(mockUseReadingComplianceQuery).toHaveBeenCalledWith({
      params: {
        tenant_code: 'as',
        scheme_id: 3,
        page: 0,
        size: 50,
      },
      enabled: true,
    })

    // State Scheme ID and Center Scheme ID labels should be present; Scheme ID numeric display is gone
    expect(screen.getByText('State Scheme ID')).toBeTruthy()
    expect(screen.getByText('Center Scheme ID')).toBeTruthy()
    expect(screen.queryByText('Scheme ID')).toBeNull()
    expect(screen.getByText('Corramore Pwss (Point-Iii) 18294')).toBeTruthy()
    // Left panel is driven by the first compliance row (Ajay), not by the paginated operator
    expect(screen.getByText('Ajay Yadav')).toBeTruthy()
  })

  it('switches compliance to the selected scheme when the scheme dropdown is used', () => {
    mockUseQueriesData = [
      {
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
                  status: 'ACTIVE',
                },
              ],
            },
          ],
        },
      },
      {
        data: {
          status: 200,
          message: 'Pump operators retrieved',
          data: [
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
                  status: 'ACTIVE',
                },
              ],
            },
          ],
        },
      },
    ]
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
                  schemeName: 'CORRAMORE PWSS (Point-III) 18294',
                  reportingRatePercent: 88,
                  lastSubmissionAt: '2024-02-11T13:00:00Z',
                  readingAt: '2024-02-11T13:00:00Z',
                  confirmedReading: 100,
                },
              ],
            },
          },
        }
      }

      if (params?.scheme_id === 8) {
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
                  schemeId: 8,
                  schemeName: 'GELABIL PWSS',
                  reportingRatePercent: 91,
                  lastSubmissionAt: '2024-02-12T13:00:00Z',
                  readingAt: '2024-02-12T13:00:00Z',
                  confirmedReading: 101,
                },
              ],
            },
          },
        }
      }

      return { data: undefined }
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        tenantCode="as"
        schemeId={3}
        allSchemeIds={[3, 8]}
      />
    )

    // Default: scheme 3 shown
    expect(screen.getAllByText('Corramore Pwss (Point-Iii) 18294').length).toBeGreaterThan(0)
    let complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ id: string }>
    }
    expect(complianceProps.data[0]?.id).toBe('3-4-2024-02-11T13:00:00Z-100-0')

    // Switch to scheme 8 via dropdown
    fireEvent.click(screen.getByRole('button', { name: 'Select scheme' }))
    fireEvent.click(screen.getByText('Gelabil Pwss'))

    expect(screen.getAllByText('Gelabil Pwss').length).toBeGreaterThan(0)
    complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ id: string }>
    }
    expect(complianceProps.data[0]?.id).toBe('8-4-2024-02-12T13:00:00Z-101-0')
    expect(screen.queryByText('Central Pumping Station')).toBeNull()
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

  it('shows scheme-level reading compliance rows for all operators in the scheme', () => {
    mockUseQueriesData = [
      {
        data: {
          status: 200,
          message: 'Pump operators retrieved',
          data: [
            {
              schemeId: 4500,
              schemeName: 'CHARBARI STATION WEST PWSS',
              pumpOperators: [
                { id: 6040, uuid: 'uuid-sanjay', name: 'Sanjay Das', status: 'INACTIVE' },
                { id: 8877, uuid: 'uuid-anil', name: 'Anil Roy', status: 'INACTIVE' },
              ],
            },
          ],
        },
      },
    ]
    mockUseReadingComplianceQuery.mockImplementation((options) => {
      const params = (options as { params?: { scheme_id?: number } | null }).params

      if (params?.scheme_id === 4500) {
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
                  readingAt: '2026-03-17T15:05:10.896445',
                  lastSubmissionAt: '2026-03-17T15:05:10.896445',
                  confirmedReading: 101419.13,
                },
              ],
            },
          },
        }
      }

      return { data: undefined }
    })

    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        villagePhotoEvidenceRows={[]}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        tenantCode="as"
        schemeId={4500}
        allSchemeIds={[4500]}
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
        lastSubmission: '17/03/26, 3:06pm',
        readingAt: '2026-03-17T15:06:10.896445',
        readingValue: '104958.72',
      },
      {
        id: '4500-6040-2026-03-17T15:05:10.896445-101419.13-1',
        name: 'Sanjay Das',
        village: 'N/A',
        lastSubmission: '17/03/26, 3:05pm',
        readingAt: '2026-03-17T15:05:10.896445',
        readingValue: '101419.13',
      },
    ])

    // Switching to page 2 does not change compliance (scheme-level, not operator-level)
    fireEvent.click(screen.getByRole('button', { name: '2' }))

    complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; readingValue: string }>
    }
    expect(complianceProps.data).toEqual([
      {
        id: '4500-6040-2026-03-17T15:06:10.896445-104958.72-0',
        name: 'Sanjay Das',
        village: 'N/A',
        lastSubmission: '17/03/26, 3:06pm',
        readingAt: '2026-03-17T15:06:10.896445',
        readingValue: '104958.72',
      },
      {
        id: '4500-6040-2026-03-17T15:05:10.896445-101419.13-1',
        name: 'Sanjay Das',
        village: 'N/A',
        lastSubmission: '17/03/26, 3:05pm',
        readingAt: '2026-03-17T15:05:10.896445',
        readingValue: '101419.13',
      },
    ])
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
        startDate: undefined,
        endDate: undefined,
        page: 1,
        size: 50,
      },
      enabled: true,
    })

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      data: Array<{ readingAt: string }>
    }
    expect(complianceProps.data).toHaveLength(51)
    expect(complianceProps.data.at(-1)?.readingAt).toBe('2026-03-17T15:04:10.896445')
  })

  it('passes fillHeight to reading compliance so the empty state stays centered', () => {
    renderWithProviders(
      <VillageDashboardScreen
        data={data}
        waterSupplyOutagesData={waterSupplyOutagesData}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={villagePumpOperators}
        villagePhotoEvidenceRows={[]}
      />
    )

    const complianceProps = mockReadingComplianceTable.mock.calls.at(-1)?.[0] as {
      fillHeight?: boolean
    }

    expect(complianceProps.fillHeight).toBe(true)
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
        startDate: undefined,
        endDate: undefined,
        page: 2,
        size: 50,
      },
      enabled: true,
    })
  })
})

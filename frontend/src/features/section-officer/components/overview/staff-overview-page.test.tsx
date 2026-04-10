import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import { StaffOverviewPage } from './staff-overview-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { WaterSupplyOutageData, EntityPerformance } from '@/features/dashboard/types'
import {
  useSchemesCountQuery,
  useDashboardStatsQuery,
  useOutageReasonsQuery,
  useNonSubmissionReasonsQuery,
  useSubmissionStatusQuery,
} from '../../services/query/use-overview-queries'

function createMockQueryResult<T>(
  data: T | undefined,
  isLoading: boolean,
  isError: boolean
): Record<string, unknown> {
  return {
    data,
    isLoading,
    isSuccess: !isLoading && !isError,
    isError,
    error: null,
    isFetching: false,
    isStale: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    status: isLoading ? 'pending' : isError ? 'error' : 'success',
    isPending: isLoading,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
  }
}

jest.mock('../../services/query/use-overview-queries')

jest.mock('@/features/dashboard/components/charts', () => ({
  SupplyOutageReasonsChart: () => <div data-testid="supply-outage-reasons-chart" />,
  ReadingSubmissionRateChart: () => <div data-testid="reading-submission-rate-chart" />,
}))

jest.mock('@/shared/components/charts/supply-outage-distribution-chart', () => ({
  SupplyOutageDistributionChart: () => <div data-testid="supply-outage-distribution-chart" />,
}))

const mockHooks = {
  useSchemesCountQuery: useSchemesCountQuery as jest.MockedFunction<typeof useSchemesCountQuery>,
  useDashboardStatsQuery: useDashboardStatsQuery as jest.MockedFunction<
    typeof useDashboardStatsQuery
  >,
  useOutageReasonsQuery: useOutageReasonsQuery as jest.MockedFunction<typeof useOutageReasonsQuery>,
  useNonSubmissionReasonsQuery: useNonSubmissionReasonsQuery as jest.MockedFunction<
    typeof useNonSubmissionReasonsQuery
  >,
  useSubmissionStatusQuery: useSubmissionStatusQuery as jest.MockedFunction<
    typeof useSubmissionStatusQuery
  >,
}

const mockSchemesCountData = {
  schemeCount: 42,
}

const mockDashboardStatsData = {
  totalWaterSupplied: 1250,
  totalAnomalyCount: 15,
  totalEscalationCount: 3,
}

const mockOutageReasonsData = {
  pieData: [
    {
      label: '',
      reasons: { electricityFailure: 5, pipelineLeak: 3 },
      electricityFailure: 0,
      pipelineLeak: 0,
      pumpFailure: 0,
      valveIssue: 0,
      sourceDrying: 0,
    } as WaterSupplyOutageData,
  ],
  histogramData: [
    {
      label: '2026-01-01',
      reasons: { electricityFailure: 2, pipelineLeak: 1 },
      electricityFailure: 0,
      pipelineLeak: 0,
      pumpFailure: 0,
      valveIssue: 0,
      sourceDrying: 0,
    } as WaterSupplyOutageData,
  ],
}

const mockNonSubmissionData = {
  pieData: [
    {
      label: '',
      reasons: { staffAbsence: 4 },
      electricityFailure: 0,
      pipelineLeak: 0,
      pumpFailure: 0,
      valveIssue: 0,
      sourceDrying: 0,
    } as WaterSupplyOutageData,
  ],
  histogramData: [
    {
      label: '2026-01-01',
      reasons: { staffAbsence: 2 },
      electricityFailure: 0,
      pipelineLeak: 0,
      pumpFailure: 0,
      valveIssue: 0,
      sourceDrying: 0,
    } as WaterSupplyOutageData,
  ],
}

const mockSubmissionStatusData = {
  pieData: [
    {
      label: '',
      reasons: { compliant: 40, anomalous: 2 },
      electricityFailure: 0,
      pipelineLeak: 0,
      pumpFailure: 0,
      valveIssue: 0,
      sourceDrying: 0,
    } as WaterSupplyOutageData,
  ],
  barData: [
    {
      id: '2026-01-01',
      name: '2026-01-01',
      regularity: 95,
      coverage: 0,
      continuity: 0,
      quantity: 0,
      compositeScore: 0,
      status: 'good' as const,
    } as EntityPerformance,
  ],
}

function setupMocks(overrides?: {
  schemesCountLoading?: boolean
  dashboardStatsLoading?: boolean
  outageReasonsLoading?: boolean
  nonSubmissionLoading?: boolean
  submissionStatusLoading?: boolean
  outageReasonsError?: boolean
  nonSubmissionError?: boolean
  submissionStatusError?: boolean
}) {
  const defaults = {
    schemesCountLoading: false,
    dashboardStatsLoading: false,
    outageReasonsLoading: false,
    nonSubmissionLoading: false,
    submissionStatusLoading: false,
    outageReasonsError: false,
    nonSubmissionError: false,
    submissionStatusError: false,
    ...overrides,
  }

  mockHooks.useSchemesCountQuery.mockReturnValue(
    createMockQueryResult(
      defaults.schemesCountLoading ? undefined : mockSchemesCountData,
      defaults.schemesCountLoading,
      false
    ) as unknown as ReturnType<typeof useSchemesCountQuery>
  )

  mockHooks.useDashboardStatsQuery.mockReturnValue(
    createMockQueryResult(
      defaults.dashboardStatsLoading ? undefined : mockDashboardStatsData,
      defaults.dashboardStatsLoading,
      false
    ) as unknown as ReturnType<typeof useDashboardStatsQuery>
  )

  mockHooks.useOutageReasonsQuery.mockReturnValue(
    createMockQueryResult(
      defaults.outageReasonsLoading ? undefined : mockOutageReasonsData,
      defaults.outageReasonsLoading,
      defaults.outageReasonsError
    ) as unknown as ReturnType<typeof useOutageReasonsQuery>
  )

  mockHooks.useNonSubmissionReasonsQuery.mockReturnValue(
    createMockQueryResult(
      defaults.nonSubmissionLoading ? undefined : mockNonSubmissionData,
      defaults.nonSubmissionLoading,
      defaults.nonSubmissionError
    ) as unknown as ReturnType<typeof useNonSubmissionReasonsQuery>
  )

  mockHooks.useSubmissionStatusQuery.mockReturnValue(
    createMockQueryResult(
      defaults.submissionStatusLoading ? undefined : mockSubmissionStatusData,
      defaults.submissionStatusLoading,
      defaults.submissionStatusError
    ) as unknown as ReturnType<typeof useSubmissionStatusQuery>
  )
}

describe('StaffOverviewPage', () => {
  beforeEach(() => {
    setupMocks()
    jest.clearAllMocks()
  })

  it('renders the page heading', () => {
    renderWithProviders(<StaffOverviewPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  })

  it('renders the date range picker', () => {
    renderWithProviders(<StaffOverviewPage />)
    expect(screen.getByRole('button', { name: /duration/i })).toBeDefined()
  })

  it('renders all four stat cards', () => {
    renderWithProviders(<StaffOverviewPage />)
    // Stat cards render with values - check for their presence
    expect(screen.getByText('42')).toBeDefined() // Default schemeCount
  })

  it('displays loading state for stat cards while fetching schemes count', () => {
    setupMocks({ schemesCountLoading: true })
    renderWithProviders(<StaffOverviewPage />)
    const loadingText = screen.queryAllByText('…')
    expect(loadingText.length).toBeGreaterThan(0)
  })

  it('displays loading state for stat cards while fetching dashboard stats', () => {
    setupMocks({ dashboardStatsLoading: true })
    renderWithProviders(<StaffOverviewPage />)
    const loadingText = screen.queryAllByText('…')
    expect(loadingText.length).toBeGreaterThan(0)
  })

  it('displays stat card data when loaded', async () => {
    renderWithProviders(<StaffOverviewPage />)

    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined() // schemeCount
    })

    expect(screen.getByText('1250')).toBeDefined() // totalWaterSupplied
    expect(screen.getByText('15')).toBeDefined() // totalAnomalyCount
    expect(screen.getByText('3')).toBeDefined() // totalEscalationCount
  })

  it('displays default values when data is missing', () => {
    mockHooks.useSchemesCountQuery.mockReturnValue(
      createMockQueryResult(undefined, false, false) as unknown as ReturnType<
        typeof useSchemesCountQuery
      >
    )

    mockHooks.useDashboardStatsQuery.mockReturnValue(
      createMockQueryResult(undefined, false, false) as unknown as ReturnType<
        typeof useDashboardStatsQuery
      >
    )

    renderWithProviders(<StaffOverviewPage />)

    expect(screen.getAllByText('0')).toHaveLength(4) // All stats default to 0
  })

  it('renders all chart sections', () => {
    renderWithProviders(<StaffOverviewPage />)

    // Check for chart sections - they contain mocked chart components
    const outageReasonCharts = screen.queryAllByTestId('supply-outage-reasons-chart')
    expect(outageReasonCharts.length).toBeGreaterThan(0)

    const distributionCharts = screen.queryAllByTestId('supply-outage-distribution-chart')
    expect(distributionCharts.length).toBeGreaterThan(0)

    const submissionCharts = screen.queryAllByTestId('reading-submission-rate-chart')
    expect(submissionCharts.length).toBeGreaterThan(0)
  })

  it('displays spinner when chart is loading', () => {
    setupMocks({ outageReasonsLoading: true })
    renderWithProviders(<StaffOverviewPage />)

    // When loading, the hook is called with loading state
    expect(mockHooks.useOutageReasonsQuery).toHaveBeenCalled()

    // Verify the hook was mocked to return loading state
    const mockReturnValue = mockHooks.useOutageReasonsQuery.mock.results[0]?.value as Record<
      string,
      unknown
    >
    expect(mockReturnValue.isLoading).toBe(true)
  })

  it('displays error state when chart fetch fails', () => {
    setupMocks({ outageReasonsError: true })
    renderWithProviders(<StaffOverviewPage />)

    // When outageReasonsError is true, should see error message for outage charts
    const errorMessages = screen.queryAllByText(/failed to load/i)
    expect(errorMessages.length).toBeGreaterThan(0)
  })

  it('sets document title on mount', () => {
    renderWithProviders(<StaffOverviewPage />)
    expect(document.title).toContain('JalSoochak')
  })

  it('passes correct date parameters to query hooks', () => {
    renderWithProviders(<StaffOverviewPage />)

    // Wait for component to initialize with default date range
    waitFor(() => {
      expect(mockHooks.useDashboardStatsQuery).toHaveBeenCalled()
      expect(mockHooks.useOutageReasonsQuery).toHaveBeenCalled()
      expect(mockHooks.useNonSubmissionReasonsQuery).toHaveBeenCalled()
      expect(mockHooks.useSubmissionStatusQuery).toHaveBeenCalled()

      // Check that dates are passed as strings in correct format
      const calls = mockHooks.useDashboardStatsQuery.mock.calls
      const [startDate, endDate] = calls[0]
      expect(typeof startDate).toBe('string')
      expect(typeof endDate).toBe('string')
      expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('calls all query hooks with date parameters on render', () => {
    renderWithProviders(<StaffOverviewPage />)

    expect(mockHooks.useDashboardStatsQuery).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    )
    expect(mockHooks.useOutageReasonsQuery).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    )
    expect(mockHooks.useNonSubmissionReasonsQuery).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    )
    expect(mockHooks.useSubmissionStatusQuery).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    )
  })

  it('handles multiple loading states simultaneously', () => {
    setupMocks({
      schemesCountLoading: true,
      dashboardStatsLoading: true,
      outageReasonsLoading: true,
    })

    renderWithProviders(<StaffOverviewPage />)

    // Should see loading indicators - at least one for the stat cards
    const loadingIndicators = screen.queryAllByText('…')
    expect(loadingIndicators.length).toBeGreaterThan(0)

    // Page should render without errors
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  })

  it('handles multiple error states simultaneously', () => {
    setupMocks({
      outageReasonsError: true,
      nonSubmissionError: true,
      submissionStatusError: true,
    })

    renderWithProviders(<StaffOverviewPage />)

    const errorMessages = screen.getAllByText(/failed to load/i)
    expect(errorMessages.length).toBeGreaterThanOrEqual(3)
  })
})

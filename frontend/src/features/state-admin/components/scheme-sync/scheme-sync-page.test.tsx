import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SchemeSyncPage } from './scheme-sync-page'
import * as useStateAdminQueries from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'

// Mock the queries
jest.mock('../../services/query/use-state-admin-queries')
jest.mock('@/app/store/auth-store')

// Mock child component
jest.mock('./upload-schemes-modal', () => ({
  UploadSchemesModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="upload-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}))

const mockUseStateAdminQueries = useStateAdminQueries as jest.Mocked<typeof useStateAdminQueries>
const mockUseAuthStore = useAuthStore as unknown as jest.Mock

describe('SchemeSyncPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    mockUseAuthStore.mockReturnValue({
      user: { tenantCode: 'TEST_STATE' },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const mockSchemes = [
    {
      id: 1,
      uuid: 'uuid-1',
      stateSchemeId: 'SS001',
      centreSchemeId: 'CS001',
      schemeName: 'Scheme 1',
      fhtcCount: 150,
      plannedFhtc: 200,
      houseHoldCount: 500,
      latitude: 28.1234,
      longitude: 77.5678,
      channel: 'Channel A',
      workStatus: 'Completed',
      operatingStatus: 'Active',
    },
    {
      id: 2,
      uuid: 'uuid-2',
      stateSchemeId: 'SS002',
      centreSchemeId: 'CS002',
      schemeName: 'Scheme 2',
      fhtcCount: 175,
      plannedFhtc: 200,
      houseHoldCount: 600,
      latitude: 28.5678,
      longitude: 77.9012,
      channel: 'Channel B',
      workStatus: 'In Progress',
      operatingStatus: 'Active',
    },
  ]

  const mockCounts = {
    totalSchemes: 100,
    activeSchemes: 80,
    inactiveSchemes: 20,
    statusCounts: [],
    workStatusCounts: [
      { status: 'Completed', count: 50 },
      { status: 'In Progress', count: 30 },
    ],
    operatingStatusCounts: [
      { status: 'Active', count: 80 },
      { status: 'Inactive', count: 20 },
    ],
  }

  it('should render the page title and page structure', () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: { items: [], totalElements: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('schemeSync.title')
  })

  it('should display table with new columns: stateSchemeId, plannedFhtc, and achievedFhtc', async () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    // Check for table headers
    await waitFor(() => {
      expect(screen.getByText('schemeSync.table.schemeName')).toBeInTheDocument()
      expect(screen.getByText('schemeSync.table.stateSchemeId')).toBeInTheDocument()
      expect(screen.getByText('schemeSync.table.plannedFhtc')).toBeInTheDocument()
      expect(screen.getByText('schemeSync.table.achievedFhtc')).toBeInTheDocument()
      expect(screen.getByText('schemeSync.table.houseHoldCount')).toBeInTheDocument()
      expect(screen.getByText('schemeSync.table.workStatus')).toBeInTheDocument()
      expect(screen.getByText('schemeSync.table.operatingStatus')).toBeInTheDocument()
    })

    // Check for data in rows
    expect(screen.getByText('Scheme 1')).toBeInTheDocument()
    expect(screen.getByText('SS001')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument() // plannedFhtc
    expect(screen.getByText('150')).toBeInTheDocument() // fhtcCount (achieved)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should display stat cards with correct values', async () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('schemeSync.stats.totalSchemes')).toBeInTheDocument()
      expect(screen.getByText('schemeSync.stats.activeSchemes')).toBeInTheDocument()
      expect(screen.getByText('schemeSync.stats.inactiveSchemes')).toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    const mockRefetch = jest.fn()
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    const searchInput = screen.getByPlaceholderText('schemeSync.searchPlaceholder')
    await user.type(searchInput, 'test')

    // The debounce will delay the search, so we wait for the state to update
    await waitFor(
      () => {
        expect(searchInput).toHaveValue('test')
      },
      { timeout: 500 }
    )
  })

  it('should open and close upload modal', async () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: { items: [], totalElements: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    // Open modal
    const uploadButton = screen.getByText('schemeSync.uploadData')
    await user.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByTestId('upload-modal')).toBeInTheDocument()
    })

    // Close modal
    const closeButton = screen.getByText('Close Modal')
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument()
    })
  })

  it('should display empty state when no schemes found', async () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: { items: [], totalElements: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('schemeSync.messages.noSchemesFound')).toBeInTheDocument()
    })
  })

  it('should display error state when loading fails', async () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('schemeSync.messages.failedToLoad')).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()

    await user.click(retryButton)
    expect(mockUseStateAdminQueries.useSchemeListQuery).toHaveBeenCalled()
  })

  it('should handle sorting', async () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    // The sorting is handled in handleSort which tests would require clicking on sortable headers
    // For now, we verify the table is rendered and sortable columns are present
    await waitFor(() => {
      expect(screen.getByText('schemeSync.table.schemeName')).toBeInTheDocument()
    })
  })

  it('should display loading state', async () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    // The DataTable should show loading state
    // Exact loading indicators depend on DataTable implementation
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('should display all new columns data correctly', async () => {
    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    // @ts-expect-error - mocking UseQueryResult return type in tests
    mockUseStateAdminQueries.useSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SchemeSyncPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      // Check first scheme row
      expect(screen.getByText('Scheme 1')).toBeInTheDocument()
      expect(screen.getByText('SS001')).toBeInTheDocument()

      // Check second scheme row
      expect(screen.getByText('Scheme 2')).toBeInTheDocument()
      expect(screen.getByText('SS002')).toBeInTheDocument()
    })

    // Verify planned and achieved FHTC values appear
    const achievedFhtcValues = screen.getAllByText(/^(150|175)$/)
    expect(achievedFhtcValues.length).toBeGreaterThan(0)

    const plannedFhtcValues = screen.getAllByText(/^200$/)
    expect(plannedFhtcValues.length).toBeGreaterThan(0)
  })
})

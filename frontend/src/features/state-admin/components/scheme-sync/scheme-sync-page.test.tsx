import '@testing-library/jest-dom/jest-globals'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import { SchemeSyncPage } from './scheme-sync-page'
import type { Scheme, SchemeCounts } from '../../types/scheme-sync'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: (selector?: (s: { user: { tenantCode: string } }) => unknown) => {
    const mockState = { user: { tenantCode: 'TEST_STATE' } }
    return selector ? selector(mockState) : mockState
  },
}))

const mockUseSchemeListQuery = jest.fn()
const mockUseSchemeCountsQuery = jest.fn()
const mockUseDownloadSchemesReportMutation = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useSchemeListQuery: (params: unknown) => mockUseSchemeListQuery(params),
  useSchemeCountsQuery: () => mockUseSchemeCountsQuery(),
  useUpdateSchemeStatusMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useDownloadSchemesReportMutation: () => mockUseDownloadSchemesReportMutation(),
}))

jest.mock('./scheme-status-chip', () => ({
  SchemeStatusChip: ({
    currentValue,
    statusType,
    schemeId,
  }: {
    currentValue: string
    statusType: string
    schemeId: number
  }) => <span data-testid={`status-chip-${statusType}-${schemeId}`}>{currentValue}</span>,
}))

jest.mock('./upload-schemes-modal', () => ({
  UploadSchemesModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="upload-modal">
        <button type="button" onClick={onClose}>
          Close Modal
        </button>
      </div>
    ) : null,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockSchemes: Scheme[] = [
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
    operatingStatus: 'Operative',
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
    workStatus: 'Ongoing',
    operatingStatus: 'Operative',
  },
]

const mockCounts: SchemeCounts = {
  totalSchemes: 100,
  workStatusCounts: [
    { code: 1, label: 'Ongoing', count: 30 },
    { code: 2, label: 'Completed', count: 70 },
  ],
  operatingStatusCounts: [
    { code: 0, label: 'Non-Operative', count: 20 },
    { code: 1, label: 'Operative', count: 65 },
    { code: 2, label: 'Partially Operative', count: 15 },
  ],
}

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('SchemeSyncPage', () => {
  beforeEach(() => {
    mockUseSchemeListQuery.mockReturnValue({
      data: { items: [], totalElements: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
    mockUseDownloadSchemesReportMutation.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseSchemeCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })
  })

  it('should render the page title and page structure', () => {
    renderWithProviders(<SchemeSyncPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Schemes')
  })

  it('should display table with new columns: stateSchemeId, plannedFhtc, and achievedFhtc', () => {
    mockUseSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderWithProviders(<SchemeSyncPage />)

    expect(screen.getByText('Scheme Name')).toBeInTheDocument()
    expect(screen.getByText('State Scheme ID')).toBeInTheDocument()
    expect(screen.getByText('Planned FHTC')).toBeInTheDocument()
    expect(screen.getByText('Achieved FHTC')).toBeInTheDocument()
    expect(screen.getByText('Household Count')).toBeInTheDocument()
    expect(screen.getAllByText('Work Status').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Operating Status').length).toBeGreaterThan(0)

    expect(screen.getByText('Scheme 1')).toBeInTheDocument()
    expect(screen.getByText('SS001')).toBeInTheDocument()
    expect(screen.getAllByText('200')).toHaveLength(2)
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getAllByText('Operative')).toHaveLength(2)
  })

  it('should display stat cards with correct values', async () => {
    mockUseSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderWithProviders(<SchemeSyncPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Total Schemes: 100')).toBeInTheDocument()
      expect(screen.getByLabelText('Operative Schemes: 65')).toBeInTheDocument()
      expect(screen.getByLabelText('Partially Operative Schemes: 15')).toBeInTheDocument()
      expect(screen.getByLabelText('Non-Operative Schemes: 20')).toBeInTheDocument()
    })
  })

  it('shows 0 for an operating status bucket absent from the response', async () => {
    mockUseSchemeCountsQuery.mockReturnValue({
      data: {
        totalSchemes: 100,
        workStatusCounts: [],
        operatingStatusCounts: [{ code: 1, label: 'Operative', count: 100 }],
      } satisfies SchemeCounts,
      isLoading: false,
    })

    renderWithProviders(<SchemeSyncPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Partially Operative Schemes: 0')).toBeInTheDocument()
      expect(screen.getByLabelText('Non-Operative Schemes: 0')).toBeInTheDocument()
    })
  })

  it('explains the shortfall on the total card when schemes have no recorded operating status', async () => {
    mockUseSchemeCountsQuery.mockReturnValue({
      data: {
        totalSchemes: 100,
        workStatusCounts: [],
        operatingStatusCounts: [
          { code: 1, label: 'Operative', count: 98 },
          { code: null, label: 'Unknown', count: 2 },
        ],
      } satisfies SchemeCounts,
      isLoading: false,
    })

    renderWithProviders(<SchemeSyncPage />)

    // The three operating cards cannot sum to the total, so the total card gains a tooltip.
    const stats = screen.getByRole('region', { name: 'Scheme sync statistics' })
    await waitFor(() => {
      expect(screen.getByLabelText('Total Schemes: 100')).toBeInTheDocument()
    })
    expect(stats.querySelectorAll('[aria-label="More info"]')).toHaveLength(4)
  })

  it('omits the total card tooltip when every scheme has a recorded operating status', async () => {
    renderWithProviders(<SchemeSyncPage />)

    const stats = screen.getByRole('region', { name: 'Scheme sync statistics' })
    await waitFor(() => {
      expect(screen.getByLabelText('Total Schemes: 100')).toBeInTheDocument()
    })
    expect(stats.querySelectorAll('[aria-label="More info"]')).toHaveLength(3)
  })

  it('shows a placeholder on every card while counts load', async () => {
    mockUseSchemeCountsQuery.mockReturnValue({ data: undefined, isLoading: true })

    renderWithProviders(<SchemeSyncPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Total Schemes: —')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Operative Schemes: —')).toBeInTheDocument()
    expect(screen.getByLabelText('Partially Operative Schemes: —')).toBeInTheDocument()
    expect(screen.getByLabelText('Non-Operative Schemes: —')).toBeInTheDocument()
  })

  it('offers Partially Operative as an operating status filter option', async () => {
    renderWithProviders(<SchemeSyncPage />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Operating Status' }))

    // Newly reachable: the backend could never surface this value before the migration.
    expect(screen.getByText('Partially Operative')).toBeInTheDocument()
  })

  it('sends the canonical English label as the operating status filter value', async () => {
    renderWithProviders(<SchemeSyncPage />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Operating Status' }))
    await userEvent.click(screen.getByText('Non-Operative'))

    // Non-Operative is code 0; sending the code would be stripped as falsy by the service layer.
    await waitFor(() => {
      expect(mockUseSchemeListQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ operatingStatus: 'Non-Operative' })
      )
    })
  })

  it('sends the canonical English label as the work status filter value', async () => {
    renderWithProviders(<SchemeSyncPage />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Work Status' }))
    await userEvent.click(screen.getByText('Completed'))

    await waitFor(() => {
      expect(mockUseSchemeListQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ workStatus: 'Completed' })
      )
    })
  })

  it('treats a selected Non-Operative filter as active so it can be cleared', async () => {
    renderWithProviders(<SchemeSyncPage />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Operating Status' }))
    await userEvent.click(screen.getByText('Non-Operative'))

    expect(await screen.findByText('clear all filters')).toBeInTheDocument()
  })

  it('should handle search functionality', async () => {
    mockUseSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemeSyncPage />)

    const searchInput = screen.getByPlaceholderText('Search by scheme name')
    await user.type(searchInput, 'test')

    await waitFor(
      () => {
        expect(searchInput).toHaveValue('test')
      },
      { timeout: 500 }
    )
  })

  it('should open and close upload modal', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemeSyncPage />)

    await user.click(screen.getByText('Upload Data'))

    await waitFor(() => {
      expect(screen.getByTestId('upload-modal')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Close Modal'))

    await waitFor(() => {
      expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument()
    })
  })

  it('should display empty state when no schemes found', async () => {
    renderWithProviders(<SchemeSyncPage />)

    await waitFor(() => {
      expect(screen.getByText('No schemes found')).toBeInTheDocument()
    })
  })

  it('should display error state when loading fails', async () => {
    const mockRefetch = jest.fn()
    mockUseSchemeListQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemeSyncPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load scheme data')).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('should handle sorting', async () => {
    mockUseSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderWithProviders(<SchemeSyncPage />)

    await waitFor(() => {
      expect(screen.getByText('Scheme Name')).toBeInTheDocument()
    })
  })

  it('should display loading state', () => {
    mockUseSchemeListQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })
    mockUseSchemeCountsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    renderWithProviders(<SchemeSyncPage />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  // ── Reports button ───────────────────────────────────────────────────────────

  it('renders Reports button', () => {
    renderWithProviders(<SchemeSyncPage />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('calls mutate when Reports button is clicked', async () => {
    const mockMutate = jest.fn()
    mockUseDownloadSchemesReportMutation.mockReturnValue({ mutate: mockMutate, isPending: false })
    const user = userEvent.setup()
    renderWithProviders(<SchemeSyncPage />)
    await user.click(screen.getByText('Reports'))
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('triggers file download on report success', async () => {
    ;(globalThis as { fetch: unknown }).fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        headers: { get: jest.fn().mockReturnValue('text/csv') },
        blob: jest
          .fn()
          .mockImplementation(() => Promise.resolve(new Blob(['csv'], { type: 'text/csv' }))),
      })
    )
    ;(URL as { createObjectURL: unknown }).createObjectURL = jest
      .fn()
      .mockReturnValue('blob:mock-schemes-url')
    ;(URL as { revokeObjectURL: unknown }).revokeObjectURL = jest.fn()

    const mockMutate = jest.fn(
      (_: unknown, { onSuccess }: { onSuccess: (link: string) => void }) => {
        onSuccess('https://example.com/schemes.csv')
      }
    )
    mockUseDownloadSchemesReportMutation.mockReturnValue({ mutate: mockMutate, isPending: false })

    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const appendSpy = jest.spyOn(document.body, 'appendChild')

    renderWithProviders(<SchemeSyncPage />)
    screen.getByText('Reports').click()

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())

    const anchor = appendSpy.mock.calls
      .map((c) => c[0] as HTMLElement)
      .find((el) => el.tagName === 'A') as HTMLAnchorElement | undefined

    expect(anchor).toBeDefined()
    expect(anchor!.download).toBe('schemes-report.csv')
    expect(clickSpy).toHaveBeenCalled()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com/schemes.csv',
      expect.any(Object)
    )

    clickSpy.mockRestore()
    appendSpy.mockRestore()
  })

  it('renders Reports button in loading state while pending', () => {
    mockUseDownloadSchemesReportMutation.mockReturnValue({ mutate: jest.fn(), isPending: true })
    renderWithProviders(<SchemeSyncPage />)
    expect(screen.getByLabelText('Download schemes report')).toBeInTheDocument()
  })

  it('should display all new columns data correctly', async () => {
    mockUseSchemeListQuery.mockReturnValue({
      data: { items: mockSchemes, totalElements: 2 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderWithProviders(<SchemeSyncPage />)

    await waitFor(() => {
      expect(screen.getByText('Scheme 1')).toBeInTheDocument()
      expect(screen.getByText('SS001')).toBeInTheDocument()
      expect(screen.getByText('Scheme 2')).toBeInTheDocument()
      expect(screen.getByText('SS002')).toBeInTheDocument()
    })

    const achievedFhtcValues = screen.getAllByText(/^(150|175)$/)
    expect(achievedFhtcValues.length).toBeGreaterThan(0)

    const plannedFhtcValues = screen.getAllByText(/^200$/)
    expect(plannedFhtcValues.length).toBeGreaterThan(0)
  })
})

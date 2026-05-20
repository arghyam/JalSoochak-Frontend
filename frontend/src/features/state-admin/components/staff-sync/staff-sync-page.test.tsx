import { screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { StaffSyncPage, DEBOUNCE_DELAY_MS } from './staff-sync-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { StaffListResponse } from '../../types/staff-sync'
import type { StaffCountsData } from '../../types/overview'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: (selector?: (s: { user: { tenantCode: string } }) => unknown) => {
    const mockState = { user: { tenantCode: 'AS' } }
    return selector ? selector(mockState) : mockState
  },
}))

const mockUseStaffListQuery = jest.fn()
const mockUseStaffCountsQuery = jest.fn()
const mockUseUploadMutation = jest.fn()
const mockUseBroadcastMutation = jest.fn()
const mockUseReportMutation = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStaffListQuery: () => mockUseStaffListQuery(),
  useStaffCountsQuery: () => mockUseStaffCountsQuery(),
  useUploadPumpOperatorsMutation: () => mockUseUploadMutation(),
  useBroadcastWelcomeMessageMutation: () => mockUseBroadcastMutation(),
  useGenerateStaffReportMutation: () => mockUseReportMutation(),
  useUpdateStaffStatusMutation: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockListData: StaffListResponse = {
  totalElements: 3,
  items: [
    {
      id: 27935,
      uuid: 'uuid-1',
      title: 'Shyam Singh',
      email: 'shyam@test.com',
      phoneNumber: '9888888888',
      status: 'ACTIVE',
      role: 'PUMP_OPERATOR',
      schemes: [
        {
          schemeId: 1,
          schemeName: 'Scheme A',
          workStatus: 'Ongoing',
          operatingStatus: 'Operative',
        },
      ],
    },
    {
      id: 27934,
      uuid: 'uuid-2',
      title: 'Ram Kumar',
      email: 'ram@test.com',
      phoneNumber: '9999999999',
      status: 'INACTIVE',
      role: 'SECTION_OFFICER',
      schemes: [
        {
          schemeId: 2,
          schemeName: 'Scheme B',
          workStatus: 'Ongoing',
          operatingStatus: 'Operative',
        },
        {
          schemeId: 3,
          schemeName: 'Scheme C',
          workStatus: 'Completed',
          operatingStatus: 'Non-Operative',
        },
      ],
    },
    {
      id: 27929,
      uuid: 'uuid-3',
      title: 'District Officer',
      email: 'do@test.com',
      phoneNumber: '910000027929',
      status: 'ACTIVE',
      role: 'SUB_DIVISIONAL_OFFICER',
      schemes: [],
    },
  ],
}

const mockCounts: StaffCountsData = {
  totalStaff: 300,
  pumpOperators: 150,
  sectionOfficers: 80,
  subDivisionOfficers: 70,
  totalAdmins: 4,
}

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('StaffSyncPage', () => {
  beforeEach(() => {
    mockUseStaffListQuery.mockReturnValue({
      data: mockListData,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
    mockUseStaffCountsQuery.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    })
    mockUseUploadMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    })
    mockUseBroadcastMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    })
    mockUseReportMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    })
  })

  // ── Basic render ────────────────────────────────────────────────────────────

  it('renders the page title', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('renders loading state for the table', () => {
    mockUseStaffListQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    mockUseStaffListQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  // ── Stat cards ──────────────────────────────────────────────────────────────

  it('renders stat cards from counts query', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('150')).toBeTruthy()
    expect(screen.getByText('70')).toBeTruthy()
    expect(screen.getByText('80')).toBeTruthy()
  })

  it('shows placeholder when counts are loading', () => {
    mockUseStaffCountsQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
  })

  // ── Table columns ───────────────────────────────────────────────────────────

  it('renders all staff members by title', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Shyam Singh')).toBeTruthy()
    expect(screen.getByText('Ram Kumar')).toBeTruthy()
    expect(screen.getByText('District Officer')).toBeTruthy()
  })

  it('renders role labels in human-readable form', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Pump Operator')).toBeTruthy()
    expect(screen.getByText('Section Officer')).toBeTruthy()
    expect(screen.getByText('Sub Divisional Officer')).toBeTruthy()
  })

  it('renders phone numbers', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('9888888888')).toBeTruthy()
    expect(screen.getByText('9999999999')).toBeTruthy()
  })

  it('renders first scheme name for single-scheme staff', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Scheme A')).toBeTruthy()
  })

  it('shows +N for staff with multiple schemes', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('+1')).toBeTruthy()
  })

  it('renders dash for staff with no schemes', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('renders activity status toggles for each staff row', () => {
    renderWithProviders(<StaffSyncPage />)
    const toggles = screen.getAllByRole('checkbox')
    expect(toggles).toHaveLength(3)
    expect((toggles[0] as HTMLInputElement).checked).toBe(true)
    expect((toggles[1] as HTMLInputElement).checked).toBe(false)
    expect((toggles[2] as HTMLInputElement).checked).toBe(true)
  })

  // ── Toolbar ─────────────────────────────────────────────────────────────────

  it('renders search input', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('renders Upload Data button', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Upload Data')).toBeTruthy()
  })

  it('does not render Download Data button', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.queryByText('Download Data')).toBeNull()
  })

  it('renders role and status filter dropdowns', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByRole('combobox', { name: /role/i })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /status/i })).toBeTruthy()
  })

  it('does not render GP or Village filters', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.queryByRole('combobox', { name: /gram panchayat/i })).toBeNull()
    expect(screen.queryByRole('combobox', { name: /village/i })).toBeNull()
  })

  it('does not show clear all button when no filters are active', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.queryByText(/clear all/i)).toBeNull()
  })

  // ── Search (debounced; list comes from API by name filter) ───────────────────

  it('filters displayed rows by name search', async () => {
    jest.useFakeTimers()
    try {
      renderWithProviders(<StaffSyncPage />)
      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: 'Shyam' } })
      mockUseStaffListQuery.mockReturnValue({
        data: { totalElements: 1, items: [mockListData.items[0]] },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      })
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS)
      })
      expect(screen.getByText('Shyam Singh')).toBeTruthy()
      expect(screen.queryByText('Ram Kumar')).toBeNull()
      expect(screen.queryByText('District Officer')).toBeNull()
    } finally {
      jest.useRealTimers()
    }
  })

  it('shows empty message when search has no results', async () => {
    jest.useFakeTimers()
    try {
      renderWithProviders(<StaffSyncPage />)
      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: 'zzznomatch' } })
      mockUseStaffListQuery.mockReturnValue({
        data: { totalElements: 0, items: [] },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      })
      await act(async () => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS)
      })
      expect(screen.getByText(/no staff members found/i)).toBeTruthy()
    } finally {
      jest.useRealTimers()
    }
  })

  // ── Upload modal ─────────────────────────────────────────────────────────────

  it('opens upload modal when Upload Data is clicked', () => {
    renderWithProviders(<StaffSyncPage />)
    fireEvent.click(screen.getByText('Upload Data'))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  // ── Reports button ───────────────────────────────────────────────────────────

  it('renders Reports button', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Reports')).toBeTruthy()
  })

  it('calls generateReport with all default roles and no status when no filters are active', () => {
    const mockMutate = jest.fn()
    mockUseReportMutation.mockReturnValue({ mutate: mockMutate, isPending: false })
    renderWithProviders(<StaffSyncPage />)
    fireEvent.click(screen.getByText('Reports'))
    expect(mockMutate).toHaveBeenCalledWith(
      { roles: ['PUMP_OPERATOR', 'SECTION_OFFICER', 'SUB_DIVISIONAL_OFFICER'] },
      expect.any(Object)
    )
  })

  it('calls generateReport with single role when role filter is set', () => {
    const mockMutate = jest.fn()
    mockUseReportMutation.mockReturnValue({ mutate: mockMutate, isPending: false })
    renderWithProviders(<StaffSyncPage />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Role' }))
    fireEvent.click(screen.getByRole('option', { name: 'Pump Operator' }))
    fireEvent.click(screen.getByText('Reports'))
    expect(mockMutate).toHaveBeenCalledWith({ roles: ['PUMP_OPERATOR'] }, expect.any(Object))
  })

  it('calls generateReport with status when status filter is set', () => {
    const mockMutate = jest.fn()
    mockUseReportMutation.mockReturnValue({ mutate: mockMutate, isPending: false })
    renderWithProviders(<StaffSyncPage />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Status' }))
    fireEvent.click(screen.getByRole('option', { name: 'Active' }))
    fireEvent.click(screen.getByText('Reports'))
    const [payload] = mockMutate.mock.calls[0] as [{ status?: string }]
    expect(payload.status).toBe('ACTIVE')
  })

  it('triggers file download on report success', () => {
    const mockMutate = jest.fn(
      (_, callbacks: { onSuccess: (d: { downloadUrl: string }) => void }) => {
        callbacks.onSuccess({ downloadUrl: 'https://example.com/report.csv' })
      }
    )
    mockUseReportMutation.mockReturnValue({ mutate: mockMutate, isPending: false })

    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const appendSpy = jest.spyOn(document.body, 'appendChild')
    const removeSpy = jest.spyOn(document.body, 'removeChild')

    renderWithProviders(<StaffSyncPage />)
    fireEvent.click(screen.getByText('Reports'))

    const anchor = appendSpy.mock.calls
      .map((c) => c[0] as HTMLElement)
      .find((el) => el.tagName === 'A') as HTMLAnchorElement | undefined

    expect(anchor).toBeDefined()
    expect(anchor!.tagName).toBe('A')
    expect(anchor!.href).toContain('example.com/report.csv')
    expect(anchor!.download).toMatch(/^staff-report_\d{8}_\d{6}\.csv$/)
    expect(clickSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()

    clickSpy.mockRestore()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('shows Reports button in loading state while report is pending', () => {
    mockUseReportMutation.mockReturnValue({ mutate: jest.fn(), isPending: true })
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByLabelText('Download staff report')).toBeTruthy()
  })
})

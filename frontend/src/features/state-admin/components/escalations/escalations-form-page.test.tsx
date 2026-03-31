import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { EscalationsFormPage } from './escalations-form-page'

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useEscalationRulesQuery: jest.fn(),
  useSaveEscalationRulesMutation: jest.fn(),
}))

const { useEscalationRulesQuery, useSaveEscalationRulesMutation } = jest.requireMock(
  '../../services/query/use-state-admin-queries'
)

const mockMutateAsync = jest.fn()

const defaultMutation = {
  mutateAsync: mockMutateAsync,
  isPending: false,
}

const configuredData = {
  schedule: { hour: 9, minute: 0 },
  levels: [
    { days: 3, userType: 'SECTION_OFFICER' as const },
    { days: 7, userType: 'SUB_DIVISIONAL_OFFICER' as const },
  ],
}

describe('EscalationsFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSaveEscalationRulesMutation.mockReturnValue(defaultMutation)
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  it('renders loading state', () => {
    useEscalationRulesQuery.mockReturnValue({ isLoading: true, isError: false, data: undefined })
    renderWithProviders(<EscalationsFormPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  // ── Error state ────────────────────────────────────────────────────────────

  it('renders error state', () => {
    useEscalationRulesQuery.mockReturnValue({ isLoading: false, isError: true, data: undefined })
    renderWithProviders(<EscalationsFormPage />)
    expect(screen.getByText(/failed to load escalations/i)).toBeInTheDocument()
  })

  // ── View mode ──────────────────────────────────────────────────────────────

  it('renders view mode when configured', () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: configuredData,
    })
    renderWithProviders(<EscalationsFormPage />)

    expect(screen.getByText('09:00')).toBeInTheDocument()
    expect(screen.getByText('Section Officer')).toBeInTheDocument()
    expect(screen.getByText('Sub Divisional Officer')).toBeInTheDocument()
  })

  it('shows edit button in view mode', () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: configuredData,
    })
    renderWithProviders(<EscalationsFormPage />)
    expect(screen.getByLabelText(/edit mode/i)).toBeInTheDocument()
  })

  // ── Edit mode ──────────────────────────────────────────────────────────────

  it('switches to edit mode on edit button click', () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: configuredData,
    })
    renderWithProviders(<EscalationsFormPage />)

    fireEvent.click(screen.getByLabelText(/edit mode/i))

    expect(screen.getByRole('form')).toBeInTheDocument()
    expect(screen.getByLabelText(/schedule time/i)).toBeInTheDocument()
  })

  it('shows edit form for unconfigured state (empty levels)', () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { schedule: { hour: 9, minute: 0 }, levels: [] },
    })
    renderWithProviders(<EscalationsFormPage />)
    // Should go straight to edit mode (not configured)
    expect(screen.getByRole('form')).toBeInTheDocument()
  })

  it('always renders exactly 2 fixed level rows in edit mode', () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: configuredData,
    })
    renderWithProviders(<EscalationsFormPage />)
    fireEvent.click(screen.getByLabelText(/edit mode/i))

    const levelNumbers = screen.getAllByText(/^Level \d+$/i)
    expect(levelNumbers.length).toBe(2)

    expect(screen.getByText('Section Officer')).toBeInTheDocument()
    expect(screen.getByText('Sub Divisional Officer')).toBeInTheDocument()
  })

  it('does not render add or delete level buttons in edit mode', () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: configuredData,
    })
    renderWithProviders(<EscalationsFormPage />)
    fireEvent.click(screen.getByLabelText(/edit mode/i))

    expect(screen.queryByText(/add new level/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/delete level/i)).not.toBeInTheDocument()
  })

  it('cancels edit mode and returns to view', () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: configuredData,
    })
    renderWithProviders(<EscalationsFormPage />)

    fireEvent.click(screen.getByLabelText(/edit mode/i))
    expect(screen.getByRole('form')).toBeInTheDocument()

    fireEvent.click(screen.getByText(/cancel/i))
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  // ── Save ───────────────────────────────────────────────────────────────────

  it('calls mutateAsync with correct payload on save', async () => {
    mockMutateAsync.mockResolvedValue(configuredData)
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: configuredData,
    })
    renderWithProviders(<EscalationsFormPage />)
    fireEvent.click(screen.getByLabelText(/edit mode/i))

    fireEvent.click(screen.getByText(/save changes/i))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        schedule: { hour: 9, minute: 0 },
        levels: [
          { days: 3, userType: 'SECTION_OFFICER' },
          { days: 7, userType: 'SUB_DIVISIONAL_OFFICER' },
        ],
      })
    })
  })

  it('shows inline error for empty schedule time on save', async () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { schedule: { hour: 0, minute: 0 }, levels: [] },
    })
    renderWithProviders(<EscalationsFormPage />)

    // Clear the schedule time field
    const timeInput = screen.getByLabelText(/schedule time/i)
    fireEvent.change(timeInput, { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/please select a time/i)).toBeInTheDocument()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for level with days < 1 on save', async () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        schedule: { hour: 9, minute: 0 },
        levels: [
          { days: 0, userType: 'SECTION_OFFICER' as const },
          { days: 7, userType: 'SUB_DIVISIONAL_OFFICER' as const },
        ],
      },
    })
    renderWithProviders(<EscalationsFormPage />)
    fireEvent.click(screen.getByLabelText(/edit mode/i))

    fireEvent.click(screen.getByText(/save changes/i))

    await waitFor(() => {
      expect(screen.getByText(/days must be at least 1/i)).toBeInTheDocument()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows cross-level error when SDO days are less than SO days', async () => {
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        schedule: { hour: 9, minute: 0 },
        levels: [
          { days: 7, userType: 'SECTION_OFFICER' as const },
          { days: 3, userType: 'SUB_DIVISIONAL_OFFICER' as const },
        ],
      },
    })
    renderWithProviders(<EscalationsFormPage />)
    fireEvent.click(screen.getByLabelText(/edit mode/i))

    fireEvent.click(screen.getByText(/save changes/i))

    await waitFor(() => {
      expect(
        screen.getByText(/sub divisional officer escalation days must be greater than or equal/i)
      ).toBeInTheDocument()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('does not show cross-level error when SDO days equal SO days', async () => {
    mockMutateAsync.mockResolvedValue({})
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        schedule: { hour: 9, minute: 0 },
        levels: [
          { days: 5, userType: 'SECTION_OFFICER' as const },
          { days: 5, userType: 'SUB_DIVISIONAL_OFFICER' as const },
        ],
      },
    })
    renderWithProviders(<EscalationsFormPage />)
    fireEvent.click(screen.getByLabelText(/edit mode/i))

    fireEvent.click(screen.getByText(/save changes/i))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
    })
    expect(
      screen.queryByText(/sub divisional officer escalation days must be greater than or equal/i)
    ).not.toBeInTheDocument()
  })

  it('shows error toast when save fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Network error'))
    useEscalationRulesQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: configuredData,
    })
    renderWithProviders(<EscalationsFormPage />)
    fireEvent.click(screen.getByLabelText(/edit mode/i))

    fireEvent.click(screen.getByText(/save changes/i))

    await waitFor(() => {
      expect(screen.getByText(/failed to save escalation rules/i)).toBeInTheDocument()
    })
  })
})

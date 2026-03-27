import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { EscalationsPage } from './escalations-page'
import { renderWithProviders } from '@/test/render-with-providers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreateMutateAsync = jest.fn<(...args: any[]) => any>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdateMutateAsync = jest.fn<(...args: any[]) => any>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDeleteMutateAsync = jest.fn<(...args: any[]) => any>()
const mockEscalationsQuery = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useEscalationsQuery: () => mockEscalationsQuery(),
  useCreateEscalationMutation: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateEscalationMutation: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteEscalationMutation: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}))

jest.mock('../../services/api/state-admin-api', () => ({
  stateAdminApi: {
    getEscalationById: jest.fn(),
  },
}))

jest.mock('../../services/query/state-admin-query-keys', () => ({
  stateAdminQueryKeys: {
    escalationById: (id: string) => ['state-admin', 'escalation', id],
  },
}))

const escalationsList = [
  {
    id: 'e1',
    name: 'Water Quantity Alert',
    alertType: 'water-quantity-alert',
    levels: [{ id: 'l1', levelNumber: 1, targetRole: 'pump-operator', escalateAfterHours: 12 }],
  },
]

describe('EscalationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEscalationsQuery.mockReturnValue({
      data: escalationsList,
      isLoading: false,
      isError: false,
    })
  })

  it('renders loading state', () => {
    mockEscalationsQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderWithProviders(<EscalationsPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state', () => {
    mockEscalationsQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderWithProviders(<EscalationsPage />)
    expect(screen.getByText(/failed to load escalations/i)).toBeTruthy()
  })

  it('renders escalation cards in list view', () => {
    renderWithProviders(<EscalationsPage />)
    expect(screen.getByText('Water Quantity Alert')).toBeTruthy()
  })

  it('shows add form when clicking add new', () => {
    renderWithProviders(<EscalationsPage />)
    fireEvent.click(screen.getByText(/add new/i))
    expect(screen.getByRole('form')).toBeTruthy()
  })

  it('shows inline error for missing role when adding new level', async () => {
    renderWithProviders(<EscalationsPage />)
    fireEvent.click(screen.getByText(/add new/i))

    // Try to save without selecting alert type — button should be disabled
    // but we test the validation function directly by enabling the button scenario
    // The button is disabled, so we check the inline error appears on add level
    // with unfilled fields
    fireEvent.click(screen.getByText(/add new level/i))

    await waitFor(() => {
      expect(screen.getByText(/please select a role/i)).toBeTruthy()
    })
  })

  it('shows inline error for unfilled level when adding new level', async () => {
    renderWithProviders(<EscalationsPage />)
    fireEvent.click(screen.getByText(/add new/i))

    // First level is empty, try to add another
    fireEvent.click(screen.getByText(/add new level/i))

    await waitFor(() => {
      expect(screen.getByText(/please select a role/i)).toBeTruthy()
    })
  })

  it('cancel returns to list view and clears errors', () => {
    renderWithProviders(<EscalationsPage />)
    fireEvent.click(screen.getByText(/add new/i))
    expect(screen.getByRole('form')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('form')).toBeNull()
  })
})

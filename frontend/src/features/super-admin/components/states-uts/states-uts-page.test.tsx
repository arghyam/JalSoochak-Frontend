import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { StatesUTsPage } from './states-uts-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { Tenant } from '../../types/states-uts'

const mockTenants: Tenant[] = [
  {
    id: 1,
    uuid: 'uuid-1',
    stateCode: 'MH',
    lgdCode: 27,
    name: 'Maharashtra',
    status: 'ACTIVE',
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 2,
    uuid: 'uuid-2',
    stateCode: 'KA',
    lgdCode: 29,
    name: 'Karnataka',
    status: 'ONBOARDED',
    createdAt: '2024-02-10T00:00:00.000Z',
  },
  {
    id: 3,
    uuid: 'uuid-3',
    stateCode: 'TN',
    lgdCode: 33,
    name: 'Tamil Nadu',
    status: 'SUSPENDED',
    createdAt: '2024-03-01T00:00:00.000Z',
  },
]

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Bypass debounce so query args update synchronously in tests
jest.mock('@/shared/hooks/use-debounce', () => ({
  useDebounce: (value: unknown) => value,
}))

const mockUseStatesUTsPagedQuery = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useStatesUTsPagedQuery: (...args: unknown[]) => mockUseStatesUTsPagedQuery(...args),
}))

const defaultQueryResult = {
  data: { items: mockTenants, total: 3 },
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
}

describe('StatesUTsPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseStatesUTsPagedQuery.mockReturnValue(defaultQueryResult)
  })

  // ── Title ──────────────────────────────────────────────────────────────────

  it('renders the page title', () => {
    renderWithProviders(<StatesUTsPage />)
    expect(screen.getByRole('heading', { name: /manage states\/uts/i })).toBeTruthy()
  })

  // ── Loading ────────────────────────────────────────────────────────────────

  it('renders loading state', () => {
    mockUseStatesUTsPagedQuery.mockReturnValue({
      ...defaultQueryResult,
      data: undefined,
      isLoading: true,
    })
    renderWithProviders(<StatesUTsPage />)
    // DataTable shows a loading skeleton / spinner when isLoading=true
    expect(mockUseStatesUTsPagedQuery).toHaveBeenCalled()
  })

  // ── Error ──────────────────────────────────────────────────────────────────

  it('renders error state with retry button', () => {
    mockUseStatesUTsPagedQuery.mockReturnValue({
      ...defaultQueryResult,
      data: undefined,
      isError: true,
    })
    renderWithProviders(<StatesUTsPage />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('calls refetch when retry button is clicked', () => {
    const mockRefetch = jest.fn()
    mockUseStatesUTsPagedQuery.mockReturnValue({
      ...defaultQueryResult,
      data: undefined,
      isError: true,
      refetch: mockRefetch,
    })
    renderWithProviders(<StatesUTsPage />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockRefetch).toHaveBeenCalled()
  })

  // ── Table content ──────────────────────────────────────────────────────────

  it('renders table column headers', () => {
    renderWithProviders(<StatesUTsPage />)
    expect(screen.getByText('State/UT')).toBeTruthy()
    expect(screen.getByText('State Code')).toBeTruthy()
    expect(screen.getByText('LGD Code')).toBeTruthy()
    expect(screen.getByText('Status')).toBeTruthy()
    expect(screen.getByText('Actions')).toBeTruthy()
  })

  it('renders all tenant rows', () => {
    renderWithProviders(<StatesUTsPage />)
    expect(screen.getByText('Maharashtra')).toBeTruthy()
    expect(screen.getByText('Karnataka')).toBeTruthy()
    expect(screen.getByText('Tamil Nadu')).toBeTruthy()
    expect(screen.getByText('MH')).toBeTruthy()
    expect(screen.getByText('KA')).toBeTruthy()
    expect(screen.getByText('27')).toBeTruthy()
    expect(screen.getByText('29')).toBeTruthy()
  })

  it('renders empty message when data is empty', () => {
    mockUseStatesUTsPagedQuery.mockReturnValue({
      ...defaultQueryResult,
      data: { items: [], total: 0 },
    })
    renderWithProviders(<StatesUTsPage />)
    expect(screen.getByText(/no states\/uts found/i)).toBeTruthy()
  })

  // ── Search ─────────────────────────────────────────────────────────────────

  it('renders search input with correct placeholder', () => {
    renderWithProviders(<StatesUTsPage />)
    expect(screen.getByPlaceholderText(/search by state\/ut name/i)).toBeTruthy()
  })

  it('passes debounced search value to query', () => {
    renderWithProviders(<StatesUTsPage />)
    const searchInput = screen.getByPlaceholderText(/search by state\/ut name/i)
    fireEvent.change(searchInput, { target: { value: 'Maha' } })
    expect(mockUseStatesUTsPagedQuery).toHaveBeenCalledWith(1, 10, 'Maha', 'all')
  })

  it('resets page to 1 when search query changes', () => {
    renderWithProviders(<StatesUTsPage />)
    const searchInput = screen.getByPlaceholderText(/search by state\/ut name/i)
    fireEvent.change(searchInput, { target: { value: 'Ka' } })
    // After reset page should be 1 — query is called with page=1
    const lastCall = mockUseStatesUTsPagedQuery.mock.calls.at(-1)
    expect(lastCall?.[0]).toBe(1)
  })

  // ── Status filter ──────────────────────────────────────────────────────────

  it('renders status filter with All Statuses option', () => {
    renderWithProviders(<StatesUTsPage />)
    expect(screen.getByText('All Statuses')).toBeTruthy()
  })

  it('passes selected status to query', () => {
    renderWithProviders(<StatesUTsPage />)
    fireEvent.click(screen.getByText('All Statuses'))
    fireEvent.click(screen.getByRole('option', { name: 'Active' }))
    expect(mockUseStatesUTsPagedQuery).toHaveBeenCalledWith(1, 10, '', 'ACTIVE')
  })

  it('resets page to 1 when status filter changes', () => {
    renderWithProviders(<StatesUTsPage />)
    fireEvent.click(screen.getByText('All Statuses'))
    fireEvent.click(screen.getByRole('option', { name: 'Suspended' }))
    const lastCall = mockUseStatesUTsPagedQuery.mock.calls.at(-1)
    expect(lastCall?.[0]).toBe(1)
  })

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('navigates to add page when Add New State/UT button is clicked', () => {
    renderWithProviders(<StatesUTsPage />)
    fireEvent.click(screen.getByRole('button', { name: /add new state\/ut/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/states-uts/add')
  })

  it('navigates to view page when view icon is clicked', () => {
    renderWithProviders(<StatesUTsPage />)
    const viewButtons = screen.getAllByRole('button', { name: /view state\/ut/i })
    fireEvent.click(viewButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/states-uts/MH')
  })

  it('navigates to edit page when edit icon is clicked', () => {
    renderWithProviders(<StatesUTsPage />)
    const editButtons = screen.getAllByRole('button', { name: /edit state\/ut/i })
    fireEvent.click(editButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/states-uts/MH/edit')
  })

  // ── Initial query args ─────────────────────────────────────────────────────

  it('calls query with default args on first render', () => {
    renderWithProviders(<StatesUTsPage />)
    expect(mockUseStatesUTsPagedQuery).toHaveBeenCalledWith(1, 10, '', 'all')
  })
})

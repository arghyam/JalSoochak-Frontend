import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { StateUTAdminFormPage } from './state-ut-admin-form-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { StateUTAdmin } from '../../types/state-ut-admins'

const mockAdmin: StateUTAdmin = {
  id: 'admin-1',
  firstName: 'Vijay',
  lastName: 'Kumar',
  email: 'vijay.kumar@gmail.com',
  phone: '8564254517',
  status: 'active',
}

const mockNavigate = jest.fn()
const mockUseParams = jest.fn<() => { id: string | undefined }>().mockReturnValue({ id: undefined })

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}))

const mockUseStateUTAdminByIdQuery = jest.fn()
const mockUseCreateStateUTAdminMutation = jest.fn()
const mockUseUpdateStateUTAdminMutation = jest.fn()
const mockUseUpdateStateUTAdminStatusMutation = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStateUTAdminByIdQuery: () => mockUseStateUTAdminByIdQuery(),
  useCreateStateUTAdminMutation: () => mockUseCreateStateUTAdminMutation(),
  useUpdateStateUTAdminMutation: () => mockUseUpdateStateUTAdminMutation(),
  useUpdateStateUTAdminStatusMutation: () => mockUseUpdateStateUTAdminStatusMutation(),
}))

describe('StateUTAdminFormPage — Add Mode', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseParams.mockReturnValue({ id: undefined })
    mockUseStateUTAdminByIdQuery.mockReturnValue({ data: undefined, isLoading: false })
    mockUseCreateStateUTAdminMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<StateUTAdmin>>().mockResolvedValue(mockAdmin),
      isPending: false,
    })
    mockUseUpdateStateUTAdminMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<StateUTAdmin>>().mockResolvedValue(mockAdmin),
      isPending: false,
    })
    mockUseUpdateStateUTAdminStatusMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<StateUTAdmin>>().mockResolvedValue(mockAdmin),
      isPending: false,
    })
  })

  it('renders add title', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByRole('heading', { name: /add state\/ut admin/i })).toBeTruthy()
  })

  it('renders User Details section heading', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByText('User Details')).toBeTruthy()
  })

  it('renders all four required fields', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByLabelText(/first name/i)).toBeTruthy()
    expect(screen.getByLabelText(/last name/i)).toBeTruthy()
    expect(screen.getByLabelText(/email address/i)).toBeTruthy()
    expect(screen.getByLabelText(/phone number/i)).toBeTruthy()
  })

  it('submit button is disabled when form is empty', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    const submitBtn = screen.getByRole('button', {
      name: /add state admin & send link via email/i,
    })
    expect(submitBtn).toBeTruthy()
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit button is enabled when form is valid', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Vijay' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Kumar' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'vijay@gmail.com' },
    })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '8564254517' } })
    const submitBtn = screen.getByRole('button', {
      name: /add state admin & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('does not show status toggle in add mode', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.queryByText('Activated')).toBeNull()
  })

  it('navigates to list on Cancel click', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/state-admin/state-ut-admins')
  })
})

describe('StateUTAdminFormPage — Edit Mode', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseParams.mockReturnValue({ id: 'admin-1' })
    mockUseStateUTAdminByIdQuery.mockReturnValue({ data: mockAdmin, isLoading: false })
    mockUseCreateStateUTAdminMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    })
    mockUseUpdateStateUTAdminMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<StateUTAdmin>>().mockResolvedValue(mockAdmin),
      isPending: false,
    })
    mockUseUpdateStateUTAdminStatusMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<StateUTAdmin>>().mockResolvedValue(mockAdmin),
      isPending: false,
    })
  })

  it('renders edit title', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByRole('heading', { name: /edit state\/ut admin/i })).toBeTruthy()
  })

  it('renders loading state while fetching admin', () => {
    mockUseStateUTAdminByIdQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders not found state when admin is missing', () => {
    mockUseStateUTAdminByIdQuery.mockReturnValue({ data: null, isLoading: false })
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByText('Admin not found')).toBeTruthy()
  })

  it('email field is read-only in edit mode', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByLabelText(/email address/i).getAttribute('aria-readonly')).toBe('true')
  })

  it('shows status toggle in edit mode', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByText('Activated')).toBeTruthy()
  })

  it('shows Save Changes button in edit mode', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy()
  })

  it('navigates to view page on Cancel click in edit mode', () => {
    renderWithProviders(<StateUTAdminFormPage />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/state-admin/state-ut-admins/admin-1')
  })
})

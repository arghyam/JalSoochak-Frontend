import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { ViewStateUTPage } from './view-state-ut-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { UserAdminData } from '@/shared/components/common'

const mockTenant = {
  id: 1,
  uuid: 'uuid-1',
  stateCode: 'MH',
  lgdCode: 27,
  name: 'Maharashtra',
  status: 'ACTIVE' as const,
  createdAt: '2024-01-15T00:00:00.000Z',
}

const mockAdmin: UserAdminData = {
  id: 'admin-1',
  firstName: 'Raj',
  lastName: 'Sharma',
  email: 'raj@example.com',
  phone: '9876543210',
  status: 'active',
}

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ tenantCode: 'MH' }),
}))

const mockUseStatesUTsQuery = jest.fn()
const mockUseStateAdminsByTenantQuery = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useStatesUTsQuery: () => mockUseStatesUTsQuery(),
  useStateAdminsByTenantQuery: () => mockUseStateAdminsByTenantQuery(),
}))

describe('ViewStateUTPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseStatesUTsQuery.mockReturnValue({ data: [mockTenant], isLoading: false })
    mockUseStateAdminsByTenantQuery.mockReturnValue({ data: [mockAdmin], isLoading: false })
  })

  it('renders loading state when tenantsQuery.isLoading', () => {
    mockUseStatesUTsQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders not found text when tenant is not in list', () => {
    mockUseStatesUTsQuery.mockReturnValue({ data: [], isLoading: false })
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText(/not found/i)).toBeTruthy()
  })

  it('renders tenant name', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('Maharashtra')).toBeTruthy()
  })

  it('renders stateCode', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('MH')).toBeTruthy()
  })

  it('renders lgdCode', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('27')).toBeTruthy()
  })

  it('renders ACTIVE status chip', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText(/active/i)).toBeTruthy()
  })

  it('renders admin firstName and email', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('Raj')).toBeTruthy()
    expect(screen.getByText('raj@example.com')).toBeTruthy()
  })

  it('shows N/A when admins array is empty', () => {
    mockUseStateAdminsByTenantQuery.mockReturnValue({ data: [], isLoading: false })
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('N/A')).toBeTruthy()
  })

  it('edit icon button navigates to edit route on click', () => {
    renderWithProviders(<ViewStateUTPage />)
    const editBtn = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/states-uts/MH/edit')
  })
})

import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { Sidebar } from './sidebar'
import { ROUTES } from '@/shared/constants/routes'

const mockNavigate = jest.fn()
const mockLogout = jest.fn()

let mockPathname = '/super-admin'
let mockIsSingleTenant = false

const authState = {
  user: { role: 'SUPER_ADMIN' as string, name: 'Jane Doe' },
  logout: mockLogout,
}

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname }),
  }
})
jest.mock('@/app/store', () => ({
  useAuthStore: (
    selector: (s: { user: { role: string; name: string }; logout: () => Promise<void> }) => unknown
  ) => selector(authState),
}))
jest.mock('@/config/server-config', () => ({
  isSingleTenantMode: () => mockIsSingleTenant,
}))

describe('Sidebar', () => {
  beforeEach(() => {
    authState.user = { role: 'SUPER_USER', name: 'Jane Doe' }
    mockPathname = '/super-user'
    mockIsSingleTenant = false
    mockNavigate.mockClear()
    mockLogout.mockClear()
    mockLogout.mockResolvedValue(undefined)
  })

  it('renders user initials and profile menu trigger', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.getByText('JD')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /jane doe/i })).toBeInTheDocument()
  })

  it('uses two-letter initials for single-word names', () => {
    authState.user = { role: 'SUPER_USER', name: 'Madonna' }
    renderWithProviders(<Sidebar />)
    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('logs out and navigates to login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />)
    await user.click(screen.getByRole('button', { name: /jane doe/i }))
    const logoutText = await screen.findByText('Logout')
    fireEvent.click(logoutText.closest('button') as HTMLButtonElement)
    expect(mockLogout).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.LOGIN, { replace: true })
    })
  })

  it('renders state-admin navigation when role is STATE_ADMIN', () => {
    authState.user = { role: 'STATE_ADMIN', name: 'State User' }
    mockPathname = ROUTES.STATE_ADMIN
    renderWithProviders(<Sidebar />)
    const mainNav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(mainNav).toBeInTheDocument()
    const navLinks = mainNav.querySelectorAll('a')
    expect(navLinks.length).toBeGreaterThan(0)
  })

  describe('SUPER_STATE_ADMIN in single-tenant mode', () => {
    beforeEach(() => {
      authState.user = { role: 'SUPER_STATE_ADMIN', name: 'Super State' }
      mockIsSingleTenant = true
    })

    it('shows only super-admin nav items when on super-admin panel', () => {
      mockPathname = ROUTES.SUPER_ADMIN + '/overview'
      renderWithProviders(<Sidebar />)
      const mainNav = screen.getByRole('navigation', { name: /main navigation/i })
      // State-admin-only routes must not appear
      expect(mainNav.querySelector(`a[href="${ROUTES.STATE_ADMIN_OVERVIEW}"]`)).toBeNull()
      expect(mainNav.querySelector(`a[href="${ROUTES.STATE_ADMIN_LANGUAGE}"]`)).toBeNull()
      // Super-admin routes must be present
      expect(mainNav.querySelector(`a[href="${ROUTES.SUPER_ADMIN_OVERVIEW}"]`)).not.toBeNull()
    })

    it('shows only state-admin nav items when on state-admin panel', () => {
      mockPathname = ROUTES.STATE_ADMIN + '/overview'
      renderWithProviders(<Sidebar />)
      const mainNav = screen.getByRole('navigation', { name: /main navigation/i })
      // Super-admin-only routes must not appear
      expect(mainNav.querySelector(`a[href="${ROUTES.SUPER_ADMIN_OVERVIEW}"]`)).toBeNull()
      expect(mainNav.querySelector(`a[href="${ROUTES.SUPER_ADMIN_SUPER_USERS}"]`)).toBeNull()
      // State-admin routes must be present
      expect(mainNav.querySelector(`a[href="${ROUTES.STATE_ADMIN_OVERVIEW}"]`)).not.toBeNull()
    })
  })

  describe('SUPER_STATE_ADMIN in multi-tenant mode', () => {
    it('shows all accessible nav items (both panels)', () => {
      authState.user = { role: 'SUPER_STATE_ADMIN', name: 'Super State' }
      mockIsSingleTenant = false
      mockPathname = ROUTES.SUPER_ADMIN + '/overview'
      renderWithProviders(<Sidebar />)
      const mainNav = screen.getByRole('navigation', { name: /main navigation/i })
      // Both panel routes are visible
      expect(mainNav.querySelector(`a[href="${ROUTES.SUPER_ADMIN_OVERVIEW}"]`)).not.toBeNull()
      expect(mainNav.querySelector(`a[href="${ROUTES.STATE_ADMIN_OVERVIEW}"]`)).not.toBeNull()
    })
  })
})

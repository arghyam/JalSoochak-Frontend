import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import type { AuthUser } from '@/features/auth/services/auth-api'
import { AUTH_ROLES } from '@/shared/constants/auth'
import { ROUTES } from '@/shared/constants/routes'
import theme from '@/app/theme'
import { ProtectedRoute, RedirectIfAuthenticated } from './ProtectedRoute'

jest.mock('@/app/store', () => ({
  useAuthStore: jest.fn(),
}))

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

function renderProtectedRouteTree(guarded: React.ReactElement, initialPath: string) {
  return render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route path={ROUTES.STAFF_LOGIN} element={<div>Staff login screen</div>} />
          <Route path={ROUTES.SUPER_ADMIN} element={<div>Super admin home</div>} />
          <Route path={ROUTES.STATE_ADMIN} element={<div>State admin home</div>} />
          <Route path={ROUTES.STAFF} element={<div>Staff home</div>} />
          <Route path={ROUTES.DASHBOARD} element={<div>Dashboard home</div>} />
          <Route path="*" element={guarded} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  )
}

function renderRedirectIfAuthenticatedTree() {
  return render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <div>Login form</div>
              </RedirectIfAuthenticated>
            }
          />
          <Route path={ROUTES.SUPER_ADMIN} element={<div>Super admin home</div>} />
          <Route path={ROUTES.STATE_ADMIN} element={<div>State admin home</div>} />
          <Route path={ROUTES.STAFF} element={<div>Staff home</div>} />
          <Route path={ROUTES.DASHBOARD} element={<div>Dashboard home</div>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  )
}

const baseState = {
  login: jest.fn(),
  logout: jest.fn(),
  bootstrap: jest.fn(),
  updateUser: jest.fn(),
  setFromActivation: jest.fn(),
  setSessionExpired: jest.fn(),
  refreshAccessToken: jest.fn(),
  accessToken: null,
  loading: false,
  error: null,
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading spinner while bootstrapping', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: true,
      isAuthenticated: false,
      sessionExpired: false,
      user: null,
    })

    renderProtectedRouteTree(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      '/app'
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('shows session expired page when sessionExpired is true', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      sessionExpired: true,
      user: { role: AUTH_ROLES.STATE_ADMIN } as AuthUser,
    })

    render(
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={['/app']}>
          <ProtectedRoute>
            <div>Secret</div>
          </ProtectedRoute>
        </MemoryRouter>
      </ChakraProvider>
    )

    expect(screen.getByRole('heading', { name: /session expired/i })).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated users to login for non-staff paths', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: false,
      sessionExpired: false,
      user: null,
    })

    renderProtectedRouteTree(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      '/protected'
    )

    expect(screen.getByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated staff-area users to staff login', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: false,
      sessionExpired: false,
      user: null,
    })

    renderProtectedRouteTree(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      `${ROUTES.STAFF}/schemes`
    )

    expect(screen.getByText('Staff login screen')).toBeInTheDocument()
  })

  it('does not treat /staffing as a staff route', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: false,
      sessionExpired: false,
      user: null,
    })

    renderProtectedRouteTree(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      '/staffing'
    )

    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('renders forbidden when role is not allowed', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      sessionExpired: false,
      user: { role: AUTH_ROLES.STATE_ADMIN } as AuthUser,
    })

    render(
      <ChakraProvider theme={theme}>
        <MemoryRouter>
          <ProtectedRoute allowedRoles={[AUTH_ROLES.SUPER_ADMIN]}>
            <div>Admin only</div>
          </ProtectedRoute>
        </MemoryRouter>
      </ChakraProvider>
    )

    expect(screen.getByRole('heading', { name: /403/i })).toBeInTheDocument()
    expect(screen.queryByText('Admin only')).not.toBeInTheDocument()
  })

  it('renders children when authenticated and role is allowed', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      sessionExpired: false,
      user: { role: AUTH_ROLES.STATE_ADMIN } as AuthUser,
    })

    render(
      <ChakraProvider theme={theme}>
        <MemoryRouter>
          <ProtectedRoute allowedRoles={[AUTH_ROLES.STATE_ADMIN]}>
            <div>Allowed</div>
          </ProtectedRoute>
        </MemoryRouter>
      </ChakraProvider>
    )

    expect(screen.getByText('Allowed')).toBeInTheDocument()
  })

  it('renders children when requireAuth is false', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: false,
      sessionExpired: false,
      user: null,
    })

    render(
      <ChakraProvider theme={theme}>
        <MemoryRouter>
          <ProtectedRoute requireAuth={false}>
            <div>Public-ish</div>
          </ProtectedRoute>
        </MemoryRouter>
      </ChakraProvider>
    )

    expect(screen.getByText('Public-ish')).toBeInTheDocument()
  })
})

describe('RedirectIfAuthenticated', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading while bootstrapping', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: true,
      isAuthenticated: false,
      user: null,
    })

    render(
      <ChakraProvider theme={theme}>
        <MemoryRouter>
          <RedirectIfAuthenticated>
            <div>Login form</div>
          </RedirectIfAuthenticated>
        </MemoryRouter>
      </ChakraProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders children when not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: false,
      user: null,
    })

    render(
      <ChakraProvider theme={theme}>
        <MemoryRouter>
          <RedirectIfAuthenticated>
            <div>Login form</div>
          </RedirectIfAuthenticated>
        </MemoryRouter>
      </ChakraProvider>
    )

    expect(screen.getByText('Login form')).toBeInTheDocument()
  })

  it('redirects super admin to super admin home', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      user: { role: AUTH_ROLES.SUPER_ADMIN } as AuthUser,
    })

    renderRedirectIfAuthenticatedTree()

    expect(screen.getByText('Super admin home')).toBeInTheDocument()
  })

  it('redirects super state admin to super admin home', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      user: { role: AUTH_ROLES.SUPER_STATE_ADMIN } as AuthUser,
    })

    renderRedirectIfAuthenticatedTree()

    expect(screen.getByText('Super admin home')).toBeInTheDocument()
  })

  it('redirects state admin to state admin home', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      user: { role: AUTH_ROLES.STATE_ADMIN } as AuthUser,
    })

    renderRedirectIfAuthenticatedTree()

    expect(screen.getByText('State admin home')).toBeInTheDocument()
  })

  it('redirects staff roles to staff home', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      user: { role: AUTH_ROLES.SECTION_OFFICER } as AuthUser,
    })

    renderRedirectIfAuthenticatedTree()

    expect(screen.getByText('Staff home')).toBeInTheDocument()
  })

  it('redirects other authenticated users to dashboard', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      user: { role: 'OTHER_ROLE' } as AuthUser,
    })

    renderRedirectIfAuthenticatedTree()

    expect(screen.getByText('Dashboard home')).toBeInTheDocument()
  })

  it('restores location from state when present', () => {
    mockUseAuthStore.mockReturnValue({
      ...baseState,
      isBootstrapping: false,
      isAuthenticated: true,
      user: { role: AUTH_ROLES.SUPER_ADMIN } as AuthUser,
    })

    const from = {
      pathname: '/deep',
      search: '?x=1',
      hash: '#sec',
      state: null,
      key: 'k',
    }

    render(
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from } }]}>
          <Routes>
            <Route path="/deep" element={<div>Deep page</div>} />
            <Route
              path="/login"
              element={
                <RedirectIfAuthenticated>
                  <div>Login form</div>
                </RedirectIfAuthenticated>
              }
            />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    )

    expect(screen.getByText('Deep page')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import * as router from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import type { AuthUser } from '@/features/auth/services/auth-api'
import * as serverConfig from '@/config/server-config'
import { AUTH_ROLES } from '@/shared/constants/auth'
import { ROUTES } from '@/shared/constants/routes'
import { PanelSwitcher } from './panel-switcher'

// Mock the auth store
jest.mock('@/app/store', () => ({
  useAuthStore: jest.fn(),
}))

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}))

// Mock the server config
jest.mock('@/config/server-config', () => ({
  isSingleTenantMode: jest.fn(() => false),
}))

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
const mockUseNavigate = router.useNavigate as jest.MockedFunction<typeof router.useNavigate>
const mockUseLocation = router.useLocation as jest.MockedFunction<typeof router.useLocation>
const mockIsSingleTenantMode = serverConfig.isSingleTenantMode as jest.MockedFunction<
  typeof serverConfig.isSingleTenantMode
>

const createMockAuthState = (role: string) => ({
  user: { role } as unknown as AuthUser,
  isAuthenticated: true,
  accessToken: null,
  isBootstrapping: false,
  loading: false,
  error: null,
  sessionExpired: false,
  login: jest.fn(),
  logout: jest.fn(),
  bootstrap: jest.fn(),
  updateUser: jest.fn(),
  setFromActivation: jest.fn(),
  setSessionExpired: jest.fn(),
  refreshAccessToken: jest.fn(),
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('PanelSwitcher', () => {
  const mockNavigate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseNavigate.mockReturnValue(mockNavigate)
    mockIsSingleTenantMode.mockReturnValue(false)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render null when server is not in single_tenant_mode', () => {
    mockIsSingleTenantMode.mockReturnValue(false)
    mockUseAuthStore.mockReturnValue(createMockAuthState(AUTH_ROLES.SUPER_STATE_ADMIN))
    mockUseLocation.mockReturnValue({
      pathname: ROUTES.SUPER_ADMIN,
      search: '',
      hash: '',
      state: null,
      key: '',
    })

    const { container } = renderWithRouter(<PanelSwitcher />)
    expect(container.firstChild).toBeNull()
  })

  it('should render null when user role is not SUPER_STATE_ADMIN', () => {
    mockIsSingleTenantMode.mockReturnValue(true)
    mockUseAuthStore.mockReturnValue(createMockAuthState(AUTH_ROLES.SUPER_ADMIN))
    mockUseLocation.mockReturnValue({
      pathname: ROUTES.SUPER_ADMIN,
      search: '',
      hash: '',
      state: null,
      key: '',
    })

    const { container } = renderWithRouter(<PanelSwitcher />)
    expect(container.firstChild).toBeNull()
  })

  it('should render null when user is not authenticated', () => {
    mockIsSingleTenantMode.mockReturnValue(true)
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      isBootstrapping: false,
      loading: false,
      error: null,
      sessionExpired: false,
      login: jest.fn(),
      logout: jest.fn(),
      bootstrap: jest.fn(),
      updateUser: jest.fn(),
      setFromActivation: jest.fn(),
      setSessionExpired: jest.fn(),
      refreshAccessToken: jest.fn(),
    })
    mockUseLocation.mockReturnValue({
      pathname: ROUTES.SUPER_ADMIN,
      search: '',
      hash: '',
      state: null,
      key: '',
    })

    const { container } = renderWithRouter(<PanelSwitcher />)
    expect(container.firstChild).toBeNull()
  })

  it('should display "Super User" when on super-user panel with SUPER_STATE_ADMIN role', () => {
    mockIsSingleTenantMode.mockReturnValue(true)
    mockUseAuthStore.mockReturnValue(createMockAuthState(AUTH_ROLES.SUPER_STATE_ADMIN))
    mockUseLocation.mockReturnValue({
      pathname: ROUTES.SUPER_ADMIN,
      search: '',
      hash: '',
      state: null,
      key: '',
    })

    renderWithRouter(<PanelSwitcher />)
    const button = screen.getByRole('button', { name: /switch panel/i })
    expect(button).toHaveTextContent('Super User')
  })

  it('should display "State Admin" when on state-admin panel with SUPER_STATE_ADMIN role', () => {
    mockIsSingleTenantMode.mockReturnValue(true)
    mockUseAuthStore.mockReturnValue(createMockAuthState(AUTH_ROLES.SUPER_STATE_ADMIN))
    mockUseLocation.mockReturnValue({
      pathname: ROUTES.STATE_ADMIN,
      search: '',
      hash: '',
      state: null,
      key: '',
    })

    renderWithRouter(<PanelSwitcher />)
    const button = screen.getByRole('button', { name: /switch panel/i })
    expect(button).toHaveTextContent('State Admin')
  })
})

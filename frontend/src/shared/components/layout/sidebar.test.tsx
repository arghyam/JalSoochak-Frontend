import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { Sidebar } from './sidebar'
import { ROUTES } from '@/shared/constants/routes'

const mockNavigate = jest.fn()
const mockLogout = jest.fn()

const authState = {
  user: { role: 'SUPER_ADMIN' as string, name: 'Jane Doe' },
  logout: mockLogout,
}

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/super-admin' }),
  }
})
jest.mock('@/app/store', () => ({
  useAuthStore: (
    selector: (s: { user: { role: string; name: string }; logout: () => Promise<void> }) => unknown
  ) => selector(authState),
}))

describe('Sidebar', () => {
  beforeEach(() => {
    authState.user = { role: 'SUPER_ADMIN', name: 'Jane Doe' }
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
    authState.user = { role: 'SUPER_ADMIN', name: 'Madonna' }
    renderWithProviders(<Sidebar />)
    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('logs out and navigates to login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />)
    await user.click(screen.getByRole('button', { name: /jane doe/i }))
    await user.click(screen.getByRole('menuitem', { name: /logout/i }))
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.LOGIN, { replace: true })
  })

  it('renders state-admin navigation when role is STATE_ADMIN', () => {
    authState.user = { role: 'STATE_ADMIN', name: 'State User' }
    renderWithProviders(<Sidebar />)
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })
})

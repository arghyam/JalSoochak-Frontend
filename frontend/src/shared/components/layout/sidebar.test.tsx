import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { Sidebar } from './sidebar'

const mockNavigate = jest.fn()
const mockLogout = jest.fn()

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
  ) => selector({ user: { role: 'SUPER_ADMIN', name: 'Jane Doe' }, logout: mockLogout }),
}))

describe('Sidebar', () => {
  it('renders user initials and profile menu trigger', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.getByText('JD')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /jane doe/i })).toBeInTheDocument()
  })
})

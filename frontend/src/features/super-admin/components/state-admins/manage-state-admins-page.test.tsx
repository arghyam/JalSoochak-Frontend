import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { ManageStateAdminsPage } from './manage-state-admins-page'
import * as hooks from '../../services/query/use-super-admin-queries'

jest.mock('../../services/query/use-super-admin-queries')
jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({ toasts: [], removeToast: jest.fn(), success: jest.fn(), error: jest.fn() }),
}))

const mockedHooks = hooks as jest.Mocked<typeof hooks>

describe('ManageStateAdminsPage', () => {
  beforeEach(() => {
    mockedHooks.useStateAdminsQuery.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)
    mockedHooks.useReinviteStateAdminMutation.mockReturnValue({ mutate: jest.fn() } as never)
  })

  it('renders page title', () => {
    renderWithProviders(<ManageStateAdminsPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Manage State/UTs Admins')
  })

  it('shows retry UI in error state', async () => {
    const refetch = jest.fn()
    mockedHooks.useStateAdminsQuery.mockReturnValue({
      isError: true,
      isLoading: false,
      refetch,
    } as never)
    const user = userEvent.setup()
    renderWithProviders(<ManageStateAdminsPage />)
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetch).toHaveBeenCalled()
  })
})

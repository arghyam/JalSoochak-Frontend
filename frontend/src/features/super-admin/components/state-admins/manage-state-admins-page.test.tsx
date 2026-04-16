import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { ManageStateAdminsPage } from './manage-state-admins-page'
import * as hooks from '../../services/query/use-super-admin-queries'
import { ROUTES } from '@/shared/constants/routes'

jest.mock('../../services/query/use-super-admin-queries')
const mockNavigate = jest.fn()
const mockToast = {
  toasts: [],
  removeToast: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
}

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))
jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => mockToast,
}))
jest.mock('@/shared/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}))

const mockedHooks = hooks as jest.Mocked<typeof hooks>

describe('ManageStateAdminsPage', () => {
  const mutate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedHooks.useStateAdminsQuery.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)
    mockedHooks.useReinviteStateAdminMutation.mockReturnValue({ mutate } as never)
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

  it('shows loading status in the table area', () => {
    mockedHooks.useStateAdminsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    } as never)
    renderWithProviders(<ManageStateAdminsPage />)
    expect(screen.getByRole('status', { busy: true })).toBeInTheDocument()
  })

  it('renders admin name from loaded data', () => {
    mockedHooks.useStateAdminsQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            adminName: 'Ravi Kumar',
            stateUt: 'MH',
            mobileNumber: '999',
            emailAddress: 'r@x.com',
            status: 'active',
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)
    renderWithProviders(<ManageStateAdminsPage />)
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument()
  })

  it('navigates to view and edit routes from action buttons', async () => {
    const user = userEvent.setup()
    mockedHooks.useStateAdminsQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            adminName: 'Ravi Kumar',
            stateUt: 'MH',
            mobileNumber: '999',
            emailAddress: 'r@x.com',
            status: 'active',
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)

    renderWithProviders(<ManageStateAdminsPage />)
    await user.click(screen.getByRole('button', { name: /view admin Ravi Kumar/i }))
    await user.click(screen.getByRole('button', { name: /edit admin Ravi Kumar/i }))

    expect(mockNavigate).toHaveBeenNthCalledWith(
      1,
      ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', 'MH')
    )
    expect(mockNavigate).toHaveBeenNthCalledWith(
      2,
      ROUTES.SUPER_ADMIN_STATES_UTS_EDIT.replace(':tenantCode', 'MH')
    )
  })

  it('calls reinvite mutation and handles success callback for pending admin', async () => {
    const user = userEvent.setup()
    mockedHooks.useStateAdminsQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '2',
            adminName: 'Pending User',
            stateUt: 'UP',
            mobileNumber: '888',
            emailAddress: 'pending@x.com',
            status: 'pending',
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)

    renderWithProviders(<ManageStateAdminsPage />)
    await user.click(screen.getByRole('button', { name: /resend/i }))

    expect(mutate).toHaveBeenCalled()
    const options = mutate.mock.calls[0]?.[1] as { onSuccess?: () => void; onError?: () => void }
    options.onSuccess?.()
    expect(mockToast.success).toHaveBeenCalled()
  })

  it('handles reinvite error callback', async () => {
    const user = userEvent.setup()
    mockedHooks.useStateAdminsQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '3',
            adminName: 'Pending Error',
            stateUt: 'TN',
            mobileNumber: '777',
            emailAddress: 'error@x.com',
            status: 'pending',
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)

    renderWithProviders(<ManageStateAdminsPage />)
    await user.click(screen.getByRole('button', { name: /resend/i }))
    const options = mutate.mock.calls[0]?.[1] as { onSuccess?: () => void; onError?: () => void }
    options.onError?.()
    expect(mockToast.error).toHaveBeenCalled()
  })

  it('updates query params when search input changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ManageStateAdminsPage />)

    const input = screen.getByRole('textbox', { name: /search by admin name/i })
    await user.clear(input)
    await user.type(input, 'Neha')

    const lastCall = mockedHooks.useStateAdminsQuery.mock.calls.at(-1)
    expect(lastCall).toEqual([1, 10, 'Neha', 'all'])
  })
})

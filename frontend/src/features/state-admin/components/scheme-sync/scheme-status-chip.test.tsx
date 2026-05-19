import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { SchemeStatusChip } from './scheme-status-chip'
import * as queryHooks from '../../services/query/use-state-admin-queries'

jest.mock('../../services/query/use-state-admin-queries')
jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: jest.fn(),
    error: jest.fn(),
  }),
}))
jest.mock('@/shared/components/common', () => ({
  ToastContainer: () => null,
}))

const mockedHooks = queryHooks as jest.Mocked<typeof queryHooks>

function makeMutate(impl?: jest.Mock) {
  const mutate = impl ?? jest.fn()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockedHooks.useUpdateSchemeStatusMutation.mockReturnValue({ mutate, isPending: false } as any)
  return mutate
}

const defaultProps = {
  schemeId: 1,
  statusType: 'workStatus' as const,
  currentValue: 'Ongoing',
  tenantCode: 'TN',
}

const openMenu = async (
  user: ReturnType<typeof userEvent.setup>,
  schemeId = 1,
  statusType = 'workStatus'
) => {
  await user.click(screen.getByTestId(`status-chip-${statusType}-${schemeId}`))
}

describe('SchemeStatusChip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the current status value', () => {
    makeMutate()
    renderWithProviders(<SchemeStatusChip {...defaultProps} />)
    expect(screen.getByText('Ongoing')).toBeInTheDocument()
  })

  it('opens the menu on click and shows all work status options', async () => {
    makeMutate()
    const user = userEvent.setup()
    renderWithProviders(<SchemeStatusChip {...defaultProps} />)
    await openMenu(user)
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Handed Over')).toBeInTheDocument()
  })

  it('calls mutate with correct payload when a different option is selected', async () => {
    const mutate = makeMutate()
    const user = userEvent.setup()
    renderWithProviders(<SchemeStatusChip {...defaultProps} />)
    await openMenu(user)
    await user.click(screen.getByRole('menuitem', { name: 'Completed' }))
    expect(mutate).toHaveBeenCalledWith(
      {
        schemeId: 1,
        tenantCode: 'TN',
        payload: { workStatus: 'Completed' },
      },
      expect.any(Object)
    )
  })

  it('does not call mutate when the same option is selected', async () => {
    const mutate = makeMutate()
    const user = userEvent.setup()
    renderWithProviders(<SchemeStatusChip {...defaultProps} />)
    await openMenu(user)
    await user.click(screen.getByRole('menuitem', { name: 'Ongoing' }))
    expect(mutate).not.toHaveBeenCalled()
  })

  it('optimistically shows the new value before API resolves', async () => {
    makeMutate(jest.fn())
    const user = userEvent.setup()
    renderWithProviders(<SchemeStatusChip {...defaultProps} />)
    await openMenu(user)
    await user.click(screen.getByRole('menuitem', { name: 'Completed' }))
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('reverts to previous value on mutation failure', async () => {
    const mutate = jest.fn((_vars: unknown, { onError }: { onError: () => void }) => {
      onError()
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedHooks.useUpdateSchemeStatusMutation.mockReturnValue({ mutate, isPending: false } as any)

    const user = userEvent.setup()
    renderWithProviders(<SchemeStatusChip {...defaultProps} />)
    await openMenu(user)
    await user.click(screen.getByRole('menuitem', { name: 'Completed' }))

    await waitFor(() => {
      expect(screen.getByText('Ongoing')).toBeInTheDocument()
    })
  })

  it('shows operating status options for operatingStatus statusType', async () => {
    makeMutate()
    const user = userEvent.setup()
    renderWithProviders(
      <SchemeStatusChip
        schemeId={2}
        statusType="operatingStatus"
        currentValue="Operative"
        tenantCode="TN"
      />
    )
    await openMenu(user, 2, 'operatingStatus')
    expect(screen.getByText('Non-Operative')).toBeInTheDocument()
    expect(screen.getByText('Partially Operative')).toBeInTheDocument()
  })
})

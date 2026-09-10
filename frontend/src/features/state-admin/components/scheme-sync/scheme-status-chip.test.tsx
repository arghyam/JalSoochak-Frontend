import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import i18n from '@/app/i18n'
import { SchemeStatusChip } from './scheme-status-chip'
import * as queryHooks from '../../services/query/use-state-admin-queries'

jest.mock('../../services/query/use-state-admin-queries')
const mockToastError = jest.fn()
jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: jest.fn(),
    error: mockToastError,
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

  it('renders an unrecognised status label verbatim rather than blanking it', () => {
    makeMutate()
    renderWithProviders(
      <SchemeStatusChip
        {...defaultProps}
        statusType="operatingStatus"
        currentValue="Partially Operational"
      />
    )
    expect(screen.getByText('Partially Operational')).toBeInTheDocument()
  })

  it('still offers every valid option when the current label is unrecognised', async () => {
    makeMutate()
    const user = userEvent.setup()
    renderWithProviders(
      <SchemeStatusChip
        {...defaultProps}
        statusType="operatingStatus"
        currentValue="Partially Operational"
      />
    )
    await openMenu(user, 1, 'operatingStatus')
    expect(screen.getByRole('menuitem', { name: 'Non-Operative' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Operative' })).toBeInTheDocument()
  })

  it('lets the user correct an unrecognised status to a valid one', async () => {
    const mutate = makeMutate()
    const user = userEvent.setup()
    renderWithProviders(
      <SchemeStatusChip
        {...defaultProps}
        statusType="operatingStatus"
        currentValue="Partially Operational"
      />
    )
    await openMenu(user, 1, 'operatingStatus')
    await user.click(screen.getByRole('menuitem', { name: 'Operative' }))
    expect(mutate).toHaveBeenCalledWith(
      { schemeId: 1, tenantCode: 'TN', payload: { operatingStatus: 'Operative' } },
      expect.any(Object)
    )
  })

  it('resolves a differently cased status label to its canonical display label', () => {
    makeMutate()
    renderWithProviders(<SchemeStatusChip {...defaultProps} currentValue="ongoing" />)
    expect(screen.getByText('Ongoing')).toBeInTheDocument()
  })

  it('does not mutate when the selected option matches a differently cased current value', async () => {
    const mutate = makeMutate()
    const user = userEvent.setup()
    renderWithProviders(<SchemeStatusChip {...defaultProps} currentValue="ongoing" />)
    await openMenu(user)
    await user.click(screen.getByRole('menuitem', { name: 'Ongoing' }))
    expect(mutate).not.toHaveBeenCalled()
  })

  it('falls back to Unknown when the row carries no status', () => {
    makeMutate()
    renderWithProviders(<SchemeStatusChip {...defaultProps} currentValue="" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('shows all three operating status options', async () => {
    makeMutate()
    const user = userEvent.setup()
    renderWithProviders(
      <SchemeStatusChip {...defaultProps} statusType="operatingStatus" currentValue="Operative" />
    )
    await openMenu(user, 1, 'operatingStatus')
    expect(screen.getByRole('menuitem', { name: 'Non-Operative' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Partially Operative' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Operative' })).toBeInTheDocument()
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
    expect(mockToastError).toHaveBeenCalledWith('Failed to update status. Please try again.')
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

  describe('in a non-English locale', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('hi')
    })

    afterEach(async () => {
      await i18n.changeLanguage('en')
    })

    it('translates the chip label', () => {
      makeMutate()
      renderWithProviders(<SchemeStatusChip {...defaultProps} />)
      expect(screen.getByText('जारी')).toBeInTheDocument()
      expect(screen.queryByText('Ongoing')).not.toBeInTheDocument()
    })

    it('translates the menu options', async () => {
      makeMutate()
      const user = userEvent.setup()
      renderWithProviders(<SchemeStatusChip {...defaultProps} />)
      await openMenu(user)
      expect(screen.getByRole('menuitem', { name: 'पूर्ण' })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: 'हस्तांतरित' })).toBeInTheDocument()
    })

    it('still sends the canonical English label to the API', async () => {
      const mutate = makeMutate()
      const user = userEvent.setup()
      renderWithProviders(<SchemeStatusChip {...defaultProps} />)
      await openMenu(user)
      await user.click(screen.getByRole('menuitem', { name: 'पूर्ण' }))

      // Translation is display-only: the wire contract stays the canonical English label.
      expect(mutate).toHaveBeenCalledWith(
        { schemeId: 1, tenantCode: 'TN', payload: { workStatus: 'Completed' } },
        expect.any(Object)
      )
    })
  })
})

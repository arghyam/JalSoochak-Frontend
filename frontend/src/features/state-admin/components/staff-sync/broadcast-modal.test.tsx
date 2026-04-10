import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { BroadcastModal } from './broadcast-modal'
import * as queryHooks from '../../services/query/use-state-admin-queries'

jest.mock('../../services/query/use-state-admin-queries')

jest.mock('@/shared/components/common', () => {
  const actual = jest.requireActual('@/shared/components/common') as Record<string, unknown>
  return {
    ...actual,
    MultiSelect: ({ onChange }: { onChange: (v: string[]) => void }) => (
      <button type="button" onClick={() => onChange(['PUMP_OPERATOR'])}>
        pick-roles
      </button>
    ),
    DateRangePicker: ({
      onChange,
    }: {
      onChange: (v: { startDate: string; endDate: string }) => void
    }) => (
      <button
        type="button"
        onClick={() => onChange({ startDate: '2024-01-01', endDate: '2024-01-31' })}
      >
        pick-dates
      </button>
    ),
    SearchableSelect: ({ onChange }: { onChange: (v: string) => void }) => (
      <button type="button" onClick={() => onChange('welcome_template')}>
        pick-template
      </button>
    ),
    ToastContainer: () => null,
  }
})

jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}))

const mockedHooks = queryHooks as jest.Mocked<typeof queryHooks>

describe('BroadcastModal', () => {
  beforeEach(() => {
    mockedHooks.useBroadcastWelcomeMessageMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as never)
  })

  it('renders title when open', () => {
    renderWithProviders(<BroadcastModal isOpen onClose={jest.fn()} />)
    expect(screen.getByText('Broadcast Message')).toBeInTheDocument()
  })

  it('disables send until role, duration, and template are set', async () => {
    renderWithProviders(<BroadcastModal isOpen onClose={jest.fn()} />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('calls broadcast mutation with payload when send is enabled', async () => {
    const mutate = jest.fn()
    mockedHooks.useBroadcastWelcomeMessageMutation.mockReturnValue({
      mutate,
      isPending: false,
    } as never)
    const user = userEvent.setup()
    renderWithProviders(<BroadcastModal isOpen onClose={jest.fn()} />)
    await user.click(screen.getByRole('button', { name: 'pick-roles' }))
    await user.click(screen.getByRole('button', { name: 'pick-dates' }))
    await user.click(screen.getByRole('button', { name: 'pick-template' }))
    const send = screen.getByRole('button', { name: /send/i })
    expect(send).toBeEnabled()
    await user.click(send)
    expect(mutate).toHaveBeenCalledWith(
      {
        roles: ['PUMP_OPERATOR'],
        type: 'welcome_template',
        onboardedAfter: '2024-01-01',
        onboardedBefore: '2024-01-31',
      },
      expect.any(Object)
    )
  })
})

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigSetupWizard } from './config-setup-wizard'
import { renderWithProviders } from '@/test/render-with-providers'
import type { ConfigStatusMap } from '../../types/config-status'
import { ROUTES } from '@/shared/constants/routes'

const mockNavigate = jest.fn()
const mockUseConfigStatusQuery = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useConfigStatusQuery: () => mockUseConfigStatusQuery(),
}))

function buildConfiguredMap(): ConfigStatusMap {
  return {
    TENANT_SUPPORTED_CHANNELS: { status: 'CONFIGURED', mandatory: true },
    METER_CHANGE_REASONS: { status: 'CONFIGURED', mandatory: true },
    AVERAGE_MEMBERS_PER_HOUSEHOLD: { status: 'CONFIGURED', mandatory: true },
    DATA_CONSOLIDATION_TIME: { status: 'CONFIGURED', mandatory: true },
    PUMP_OPERATOR_REMINDER_NUDGE_TIME: { status: 'CONFIGURED', mandatory: true },
    LOCATION_CHECK_REQUIRED: { status: 'CONFIGURED', mandatory: true },
    TENANT_LOGO: { status: 'CONFIGURED', mandatory: false },
    DATE_FORMAT_SCREEN: { status: 'CONFIGURED', mandatory: true },
    DATE_FORMAT_TABLE: { status: 'CONFIGURED', mandatory: true },
    DISPLAY_DEPARTMENT_MAPS: { status: 'CONFIGURED', mandatory: true },
    SUPPLY_OUTAGE_REASONS: { status: 'CONFIGURED', mandatory: true },
    SUPPORTED_LANGUAGES: { status: 'CONFIGURED', mandatory: true },
    WATER_NORM: { status: 'CONFIGURED', mandatory: true },
    TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: { status: 'CONFIGURED', mandatory: true },
    FIELD_STAFF_ESCALATION_RULES: { status: 'CONFIGURED', mandatory: true },
  }
}

describe('ConfigSetupWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseConfigStatusQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    renderWithProviders(<ConfigSetupWizard />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseConfigStatusQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    renderWithProviders(<ConfigSetupWizard />)
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  it('renders steps and navigates when a step is activated', async () => {
    mockUseConfigStatusQuery.mockReturnValue({
      data: buildConfiguredMap(),
      isLoading: false,
      isError: false,
    })
    const user = userEvent.setup()
    renderWithProviders(<ConfigSetupWizard />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /configuration/i })).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: /configuration/i }))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.STATE_ADMIN_CONFIGURATION)
  })
})

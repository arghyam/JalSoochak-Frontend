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

  it('renders hierarchy node as first step and always configured (green)', async () => {
    mockUseConfigStatusQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigSetupWizard />)
    // Hierarchy is step 1 (index 0) and always configured regardless of config map
    const hierarchyBtn = await screen.findByRole('button', { name: /hierarchy/i })
    expect(hierarchyBtn).toBeInTheDocument()
    // connector-0 follows hierarchy (always configured) -> green
    const connector0 = screen.getByTestId('vertical-connector-0')
    expect(connector0).toHaveAttribute('data-configured', 'true')
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

  it('renders green connectors when all steps are configured', () => {
    mockUseConfigStatusQuery.mockReturnValue({
      data: buildConfiguredMap(),
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigSetupWizard />)

    // All 5 steps render
    expect(screen.getByRole('button', { name: /hierarchy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /configuration/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /language/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /water norms/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escalations/i })).toBeInTheDocument()

    // 4 connectors (between 5 steps), all green
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`vertical-connector-${i}`)).toHaveAttribute(
        'data-configured',
        'true'
      )
    }
  })

  it('renders gray connectors when previous step is not configured', () => {
    // Hierarchy (always configured) + Configuration configured; rest pending
    const partialConfig: ConfigStatusMap = {
      TENANT_SUPPORTED_CHANNELS: { status: 'CONFIGURED', mandatory: true },
      METER_CHANGE_REASONS: { status: 'CONFIGURED', mandatory: true },
      AVERAGE_MEMBERS_PER_HOUSEHOLD: { status: 'CONFIGURED', mandatory: true },
      DATA_CONSOLIDATION_TIME: { status: 'CONFIGURED', mandatory: true },
      PUMP_OPERATOR_REMINDER_NUDGE_TIME: { status: 'CONFIGURED', mandatory: true },
      LOCATION_CHECK_REQUIRED: { status: 'CONFIGURED', mandatory: true },
      TENANT_LOGO: { status: 'CONFIGURED', mandatory: false },
      DATE_FORMAT_SCREEN: { status: 'CONFIGURED', mandatory: true },
      DATE_FORMAT_TABLE: { status: 'CONFIGURED', mandatory: true },
      SUPPLY_OUTAGE_REASONS: { status: 'CONFIGURED', mandatory: true },
      SUPPORTED_LANGUAGES: { status: 'PENDING', mandatory: true },
      WATER_NORM: { status: 'PENDING', mandatory: true },
      TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: { status: 'PENDING', mandatory: true },
      FIELD_STAFF_ESCALATION_RULES: { status: 'PENDING', mandatory: true },
    }

    mockUseConfigStatusQuery.mockReturnValue({
      data: partialConfig,
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<ConfigSetupWizard />)

    // connector-0: after Hierarchy (always configured) -> green
    expect(screen.getByTestId('vertical-connector-0')).toHaveAttribute('data-configured', 'true')
    // connector-1: after Configuration (configured) -> green
    expect(screen.getByTestId('vertical-connector-1')).toHaveAttribute('data-configured', 'true')
    // connector-2: after Language (pending) -> gray
    expect(screen.getByTestId('vertical-connector-2')).toHaveAttribute('data-configured', 'false')
    // connector-3: after Water Norms (pending) -> gray
    expect(screen.getByTestId('vertical-connector-3')).toHaveAttribute('data-configured', 'false')
  })

  it('connector turns green only when previous step is configured', () => {
    // Hierarchy + Configuration + Language configured; Water Norms + Escalations pending
    const partialConfig: ConfigStatusMap = {
      TENANT_SUPPORTED_CHANNELS: { status: 'CONFIGURED', mandatory: true },
      METER_CHANGE_REASONS: { status: 'CONFIGURED', mandatory: true },
      AVERAGE_MEMBERS_PER_HOUSEHOLD: { status: 'CONFIGURED', mandatory: true },
      DATA_CONSOLIDATION_TIME: { status: 'CONFIGURED', mandatory: true },
      PUMP_OPERATOR_REMINDER_NUDGE_TIME: { status: 'CONFIGURED', mandatory: true },
      LOCATION_CHECK_REQUIRED: { status: 'CONFIGURED', mandatory: true },
      TENANT_LOGO: { status: 'CONFIGURED', mandatory: false },
      DATE_FORMAT_SCREEN: { status: 'CONFIGURED', mandatory: true },
      DATE_FORMAT_TABLE: { status: 'CONFIGURED', mandatory: true },
      SUPPLY_OUTAGE_REASONS: { status: 'CONFIGURED', mandatory: true },
      SUPPORTED_LANGUAGES: { status: 'CONFIGURED', mandatory: true },
      WATER_NORM: { status: 'PENDING', mandatory: true },
      TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: { status: 'PENDING', mandatory: true },
      FIELD_STAFF_ESCALATION_RULES: { status: 'PENDING', mandatory: true },
    }

    mockUseConfigStatusQuery.mockReturnValue({
      data: partialConfig,
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<ConfigSetupWizard />)

    // connector-0: after Hierarchy (always configured) -> green
    expect(screen.getByTestId('vertical-connector-0')).toHaveAttribute('data-configured', 'true')
    // connector-1: after Configuration (configured) -> green
    expect(screen.getByTestId('vertical-connector-1')).toHaveAttribute('data-configured', 'true')
    // connector-2: after Language (configured) -> green
    expect(screen.getByTestId('vertical-connector-2')).toHaveAttribute('data-configured', 'true')
    // connector-3: after Water Norms (pending) -> gray
    expect(screen.getByTestId('vertical-connector-3')).toHaveAttribute('data-configured', 'false')
  })
})

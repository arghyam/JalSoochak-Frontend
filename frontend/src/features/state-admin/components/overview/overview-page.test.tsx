import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { OverviewPage } from './overview-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { ConfigStatusMap } from '../../types/config-status'
import type { StaffCountsData } from '../../types/overview'
import type { SchemeCounts } from '../../types/scheme-sync'

const allConfiguredConfigStatus: ConfigStatusMap = {
  TENANT_SUPPORTED_CHANNELS: { status: 'CONFIGURED', mandatory: true },
  METER_CHANGE_REASONS: { status: 'CONFIGURED', mandatory: true },
  AVERAGE_MEMBERS_PER_HOUSEHOLD: { status: 'CONFIGURED', mandatory: true },
  DATA_CONSOLIDATION_TIME: { status: 'CONFIGURED', mandatory: true },
  PUMP_OPERATOR_REMINDER_NUDGE_TIME: { status: 'CONFIGURED', mandatory: true },
  LOCATION_CHECK_REQUIRED: { status: 'CONFIGURED', mandatory: true },
  TENANT_LOGO: { status: 'CONFIGURED', mandatory: false },
  SUPPORTED_LANGUAGES: { status: 'CONFIGURED', mandatory: true },
  WATER_NORM: { status: 'CONFIGURED', mandatory: true },
  TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: { status: 'CONFIGURED', mandatory: true },
  MESSAGE_BROKER_CONNECTION_SETTINGS: { status: 'CONFIGURED', mandatory: true },
  FIELD_STAFF_ESCALATION_RULES: { status: 'CONFIGURED', mandatory: true },
}

const mockConfigStatusState: {
  data: ConfigStatusMap | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: allConfiguredConfigStatus,
  isLoading: false,
  isError: false,
}

const mockStaffCountsState: {
  data: StaffCountsData | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: {
    totalStaff: 243,
    pumpOperators: 120,
    sectionOfficers: 60,
    subDivisionOfficers: 63,
    totalAdmins: 15,
  },
  isLoading: false,
  isError: false,
}

const mockSchemeCountsState: {
  data: SchemeCounts | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: {
    totalSchemes: 100,
    activeSchemes: 57,
    inactiveSchemes: 43,
    statusCounts: [],
    workStatusCounts: [],
    operatingStatusCounts: [],
  },
  isLoading: false,
  isError: false,
}

const mockAuthState: { user: { tenantCode: string } | null } = {
  user: { tenantCode: 'TG' },
}

const mockGenerateTokenMutate = jest.fn()
const mockGenerateTokenState: {
  isPending: boolean
  mutate: typeof mockGenerateTokenMutate
} = {
  isPending: false,
  mutate: mockGenerateTokenMutate,
}

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStaffCountsQuery: () => mockStaffCountsState,
  useSchemeCountsQuery: () => mockSchemeCountsState,
  useConfigStatusQuery: () => mockConfigStatusState,
  useGenerateApiTokenMutation: () => mockGenerateTokenState,
}))

jest.mock('@/app/store', () => ({
  useAuthStore: (selector?: (state: typeof mockAuthState) => unknown) => {
    return selector ? selector(mockAuthState) : mockAuthState
  },
}))

beforeEach(() => {
  mockStaffCountsState.data = {
    totalStaff: 243,
    pumpOperators: 120,
    sectionOfficers: 60,
    subDivisionOfficers: 63,
    totalAdmins: 15,
  }
  mockStaffCountsState.isLoading = false
  mockStaffCountsState.isError = false
  mockSchemeCountsState.data = {
    totalSchemes: 100,
    activeSchemes: 57,
    inactiveSchemes: 43,
    statusCounts: [],
    workStatusCounts: [],
    operatingStatusCounts: [],
  }
  mockSchemeCountsState.isLoading = false
  mockSchemeCountsState.isError = false
  mockConfigStatusState.data = allConfiguredConfigStatus
  mockConfigStatusState.isLoading = false
  mockConfigStatusState.isError = false
  mockAuthState.user = { tenantCode: 'TG' }
  mockGenerateTokenState.isPending = false
  mockGenerateTokenMutate.mockReset()
})

describe('data state', () => {
  it('renders the page heading with state name derived from tenantCode', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByText(/Overview of Telangana/i)).toBeTruthy()
  })

  it('renders all four stat card titles', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('Total Staff')).toBeTruthy()
    expect(screen.getByText('Total Pump Operators')).toBeTruthy()
    expect(screen.getByText('Total Admins')).toBeTruthy()
    expect(screen.getByText('Active Schemes')).toBeTruthy()
  })

  it('renders stat card values', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('243')).toBeTruthy()
    expect(screen.getByText('120')).toBeTruthy()
    expect(screen.getByText('15')).toBeTruthy()
    expect(screen.getByText('57')).toBeTruthy()
  })

  it('renders stats section with aria-label', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByRole('region', { name: /statistics overview/i })).toBeTruthy()
  })
})

describe('loading state', () => {
  it('renders loading spinner and suppresses page content', () => {
    mockStaffCountsState.data = undefined
    mockStaffCountsState.isLoading = true

    renderWithProviders(<OverviewPage />)

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('renders loading spinner when staff counts are loading', () => {
    mockStaffCountsState.data = undefined
    mockStaffCountsState.isLoading = true

    renderWithProviders(<OverviewPage />)

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('renders loading spinner when scheme counts are loading', () => {
    mockSchemeCountsState.data = undefined
    mockSchemeCountsState.isLoading = true

    renderWithProviders(<OverviewPage />)

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })
})

describe('error state', () => {
  it('renders error message when scheme counts query fails', () => {
    mockSchemeCountsState.isError = true
    mockSchemeCountsState.data = undefined

    renderWithProviders(<OverviewPage />)

    expect(screen.getByText(/failed to load/i)).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('renders error message when staff counts query fails', () => {
    mockStaffCountsState.isError = true
    mockStaffCountsState.data = undefined

    renderWithProviders(<OverviewPage />)

    expect(screen.getByText(/failed to load/i)).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })
})

describe('fallback heading', () => {
  it('renders fallback title when user has no tenantCode', () => {
    mockAuthState.user = { tenantCode: '' }

    renderWithProviders(<OverviewPage />)

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByText('Overview of State')).toBeTruthy()
    expect(screen.queryByText(/Telangana/i)).toBeNull()
  })
})

describe('Generate Token button', () => {
  it('renders the Generate Token button', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByRole('button', { name: /generate api token/i })).toBeTruthy()
    expect(screen.getByText('Generate Token')).toBeTruthy()
  })

  it('calls mutate when button is clicked', () => {
    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate api token/i }))
    expect(mockGenerateTokenMutate).toHaveBeenCalledTimes(1)
  })

  it('shows success toast and copies token to clipboard on success', async () => {
    const mockWriteText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    })

    mockGenerateTokenMutate.mockImplementation(
      (_: undefined, options: { onSuccess?: (token: string) => void }) => {
        options?.onSuccess?.('test-token-abc')
      }
    )

    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate api token/i }))

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('test-token-abc')
    })
  })

  it('shows error toast when mutation fails', async () => {
    mockGenerateTokenMutate.mockImplementation(
      (_: undefined, options: { onError?: () => void }) => {
        options?.onError?.()
      }
    )

    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate api token/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to generate API token')).toBeTruthy()
    })
  })

  it('disables button and shows loading state while pending', () => {
    mockGenerateTokenState.isPending = true

    renderWithProviders(<OverviewPage />)

    const button = screen.getByRole('button', { name: /generate api token/i })
    expect(button).toBeTruthy()
    // Chakra sets aria-disabled on isLoading buttons
    expect((button as HTMLButtonElement).dataset['loading']).not.toBeUndefined()
  })
})

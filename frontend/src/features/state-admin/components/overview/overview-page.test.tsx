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
  Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true })
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
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
  it('renders the Generate Token button in the API Token section', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByRole('button', { name: /generate a new api key/i })).toBeTruthy()
    expect(screen.getByText('Generate Key')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /api key/i })).toBeTruthy()
  })

  it('calls mutate when button is clicked', () => {
    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate a new api key/i }))
    expect(mockGenerateTokenMutate).toHaveBeenCalledTimes(1)
  })

  it('shows success toast on generation and displays token field', async () => {
    ;(mockGenerateTokenMutate as jest.Mock).mockImplementation((...args: unknown[]) => {
      const options = args[1] as { onSuccess?: (token: string) => void }
      options?.onSuccess?.('test-token-abc')
    })

    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate a new api key/i }))

    await waitFor(() => {
      expect(screen.getByText('New key generated successfully')).toBeTruthy()
    })
    // Token input appears after generation
    expect(screen.getByDisplayValue('test-token-abc')).toBeTruthy()
    // View and copy icon buttons appear
    expect(screen.getByRole('button', { name: /show key/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /copy key/i })).toBeTruthy()
  })

  it('does not show token field before generation', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.queryByRole('button', { name: /show key/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /copy key/i })).toBeNull()
  })

  it('toggles token visibility when view button is clicked', async () => {
    ;(mockGenerateTokenMutate as jest.Mock).mockImplementation((...args: unknown[]) => {
      const options = args[1] as { onSuccess?: (token: string) => void }
      options?.onSuccess?.('test-token-abc')
    })

    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate a new api key/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show key/i })).toBeTruthy()
    })

    const input = screen.getByDisplayValue('test-token-abc') as HTMLInputElement
    expect(input.type).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: /show key/i }))
    expect(input.type).toBe('text')
    expect(screen.getByRole('button', { name: /hide key/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /hide key/i }))
    expect(input.type).toBe('password')
  })

  it('copies token to clipboard and shows success toast when copy button is clicked', async () => {
    Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true })
    const mockWriteText = jest
      .fn<(text: string) => Promise<void>>()
      .mockReturnValue(Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    })
    ;(mockGenerateTokenMutate as jest.Mock).mockImplementation((...args: unknown[]) => {
      const options = args[1] as { onSuccess?: (token: string) => void }
      options?.onSuccess?.('test-token-abc')
    })

    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate a new api key/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy key/i })).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /copy key/i }))

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('test-token-abc')
    })
    await waitFor(() => {
      expect(screen.getByText('Key copied to clipboard')).toBeTruthy()
    })
  })

  it('shows error toast when clipboard is unavailable (non-secure context)', async () => {
    Object.defineProperty(globalThis, 'isSecureContext', { value: false, configurable: true })
    ;(mockGenerateTokenMutate as jest.Mock).mockImplementation((...args: unknown[]) => {
      const options = args[1] as { onSuccess?: (token: string) => void }
      options?.onSuccess?.('test-token-abc')
    })

    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate a new api key/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy key/i })).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /copy key/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to copy key to clipboard')).toBeTruthy()
    })

    Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true })
  })

  it('shows error toast when mutation fails', async () => {
    ;(mockGenerateTokenMutate as jest.Mock).mockImplementation((...args: unknown[]) => {
      const options = args[1] as { onError?: () => void }
      options?.onError?.()
    })

    renderWithProviders(<OverviewPage />)
    fireEvent.click(screen.getByRole('button', { name: /generate a new api key/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to generate API key')).toBeTruthy()
    })
  })

  it('disables button and shows loading state while pending', () => {
    mockGenerateTokenState.isPending = true

    renderWithProviders(<OverviewPage />)

    const button = screen.getByRole('button', { name: /generate a new api key/i })
    expect(button).toBeTruthy()
    // Chakra sets data-loading on isLoading buttons and disables them
    expect((button as HTMLButtonElement).dataset['loading']).not.toBeUndefined()
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })
})

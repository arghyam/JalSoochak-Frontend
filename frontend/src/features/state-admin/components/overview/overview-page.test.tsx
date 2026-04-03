import { screen } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { OverviewPage } from './overview-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { ConfigStatusMap } from '../../types/config-status'
import type { StaffCountsData } from '../../types/overview'
import type { SchemeCounts } from '../../types/scheme-sync'

const allConfiguredConfigStatus: ConfigStatusMap = {
  TENANT_SUPPORTED_CHANNELS: 'CONFIGURED',
  METER_CHANGE_REASONS: 'CONFIGURED',
  AVERAGE_MEMBERS_PER_HOUSEHOLD: 'CONFIGURED',
  DATA_CONSOLIDATION_TIME: 'CONFIGURED',
  PUMP_OPERATOR_REMINDER_NUDGE_TIME: 'CONFIGURED',
  LOCATION_CHECK_REQUIRED: 'CONFIGURED',
  TENANT_LOGO: 'CONFIGURED',
  SUPPORTED_LANGUAGES: 'CONFIGURED',
  WATER_NORM: 'CONFIGURED',
  TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: 'CONFIGURED',
  MESSAGE_BROKER_CONNECTION_SETTINGS: 'CONFIGURED',
  FIELD_STAFF_ESCALATION_RULES: 'CONFIGURED',
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

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStaffCountsQuery: () => mockStaffCountsState,
  useSchemeCountsQuery: () => mockSchemeCountsState,
  useConfigStatusQuery: () => mockConfigStatusState,
}))

jest.mock('@/app/store', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
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

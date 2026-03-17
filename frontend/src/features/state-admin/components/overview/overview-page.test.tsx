import { screen } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { OverviewPage } from './overview-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { OverviewData, StaffCountsData } from '../../types/overview'

const mockQueryState: {
  data: OverviewData | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: undefined,
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
    totalAdmins: 15,
  },
  isLoading: false,
  isError: false,
}

const mockAuthState: { user: { tenantCode: string } | null } = {
  user: { tenantCode: 'TG' },
}

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStateAdminOverviewQuery: () => mockQueryState,
  useStaffCountsQuery: () => mockStaffCountsState,
}))

jest.mock('@/app/store', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}))

const mockOverviewData: OverviewData = {
  stats: {
    activeSchemes: { value: 57, subtitle: '3 new this week' },
  },
}

beforeEach(() => {
  mockQueryState.data = mockOverviewData
  mockQueryState.isLoading = false
  mockQueryState.isError = false
  mockStaffCountsState.data = { totalStaff: 243, pumpOperators: 120, totalAdmins: 15 }
  mockStaffCountsState.isLoading = false
  mockStaffCountsState.isError = false
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
    mockQueryState.data = undefined
    mockQueryState.isLoading = true

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
})

describe('error state', () => {
  it('renders error message and suppresses page content when overview query fails', () => {
    mockQueryState.isError = true
    mockQueryState.data = undefined

    renderWithProviders(<OverviewPage />)

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('renders error message and suppresses page content when staff counts query fails', () => {
    mockStaffCountsState.isError = true
    mockStaffCountsState.data = undefined

    renderWithProviders(<OverviewPage />)

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })
})

describe('null/no data state', () => {
  it('renders nothing when data is undefined and neither loading nor error', () => {
    mockQueryState.data = undefined
    mockQueryState.isLoading = false
    mockQueryState.isError = false

    renderWithProviders(<OverviewPage />)

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
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

import { screen } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { OverviewPage } from './overview-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { OverviewData } from '../../types/overview'

jest.mock('@/shared/components/charts/line-chart', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}))

jest.mock('@/shared/components/charts/supply-outage-distribution-chart', () => ({
  SupplyOutageDistributionChart: () => <div data-testid="supply-outage-distribution-chart" />,
}))

const mockQueryState: {
  data: OverviewData | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: undefined,
  isLoading: false,
  isError: false,
}

const mockAuthState: { user: { tenantCode: string } | null } = {
  user: { tenantCode: 'TG' },
}

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStateAdminOverviewQuery: () => mockQueryState,
}))

jest.mock('@/app/store', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}))

const mockOverviewData: OverviewData = {
  stats: {
    configurationStatus: { value: '8/10', subtitle: '80% complete' },
    activeStaff: { value: 243, subtitle: '+12 this month' },
    activeSchemes: { value: 57, subtitle: '3 new this week' },
    activeIntegrations: { value: 4, subtitle: 'All systems active' },
  },
  demandSupplyData: [
    { period: '2023', Demand: 1200, Supply: 950 },
    { period: '2024', Demand: 1350, Supply: 1100 },
  ],
  dailyIngestionData: [
    { day: 'Mon', count: 420 },
    { day: 'Tue', count: 380 },
  ],
  waterSupplyOutages: [
    {
      label: 'District A',
      electricityFailure: 5,
      pipelineLeak: 3,
      pumpFailure: 2,
      valveIssue: 1,
      sourceDrying: 0,
    },
    {
      label: 'District B',
      electricityFailure: 2,
      pipelineLeak: 7,
      pumpFailure: 4,
      valveIssue: 3,
      sourceDrying: 1,
    },
  ],
}

beforeEach(() => {
  mockQueryState.data = mockOverviewData
  mockQueryState.isLoading = false
  mockQueryState.isError = false
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
    expect(screen.getByText('Configuration Status')).toBeTruthy()
    expect(screen.getByText('Active Staff')).toBeTruthy()
    expect(screen.getByText('Active Schemes')).toBeTruthy()
    expect(screen.getByText('Active Integrations')).toBeTruthy()
  })

  it('renders stat card values', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('8/10')).toBeTruthy()
    expect(screen.getByText('243')).toBeTruthy()
    expect(screen.getByText('57')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('renders stat card subtitles', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('80% complete')).toBeTruthy()
    expect(screen.getByText('+12 this month')).toBeTruthy()
    expect(screen.getByText('3 new this week')).toBeTruthy()
    expect(screen.getByText('All systems active')).toBeTruthy()
  })

  it('renders the Water Supply Outages chart section heading', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('Water Supply Outages')).toBeTruthy()
  })

  it('renders the Demand vs Supply chart section heading', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('Demand vs Supply')).toBeTruthy()
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
    expect(screen.getByText('Loading...', { selector: 'p' })).toBeTruthy()

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })
})

describe('error state', () => {
  it('renders error message and suppresses page content', () => {
    mockQueryState.isError = true
    mockQueryState.data = undefined

    renderWithProviders(<OverviewPage />)

    expect(screen.getByText('Failed to load configuration')).toBeTruthy()

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
    mockAuthState.user = null

    renderWithProviders(<OverviewPage />)

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByText('Overview of State')).toBeTruthy()
    expect(screen.queryByText(/Telangana/i)).toBeNull()
  })
})

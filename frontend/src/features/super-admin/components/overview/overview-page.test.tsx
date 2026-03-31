import { screen } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { OverviewPage } from './overview-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { SuperAdminStats } from '../../types/overview'

const mockSummaryData: SuperAdminStats = {
  totalStatesManaged: 28,
  activeStates: 26,
  inactiveStates: 2,
}

const mockUseTenantsSummaryQuery = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useTenantsSummaryQuery: () => mockUseTenantsSummaryQuery(),
}))

describe('OverviewPage', () => {
  beforeEach(() => {
    mockUseTenantsSummaryQuery.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
    })
  })

  it('renders the page heading', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByRole('heading', { name: /overview/i })).toBeTruthy()
  })

  it('sets document title on mount', () => {
    renderWithProviders(<OverviewPage />)
    expect(document.title).toContain('JalSoochak')
  })

  it('renders loading state', () => {
    mockUseTenantsSummaryQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    renderWithProviders(<OverviewPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state when query fails', () => {
    mockUseTenantsSummaryQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText(/failed to load/i)).toBeTruthy()
  })

  it('renders error state when data is undefined', () => {
    mockUseTenantsSummaryQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText(/failed to load/i)).toBeTruthy()
  })

  it('renders all three stat card titles', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('Total States/UTs Managed')).toBeTruthy()
    expect(screen.getByText('Active States/UTs')).toBeTruthy()
    expect(screen.getByText('Inactive States/UTs')).toBeTruthy()
  })

  it('renders correct stat values', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByLabelText(/Total States\/UTs Managed: 28/i)).toBeTruthy()
    expect(screen.getByLabelText(/Active States\/UTs: 26/i)).toBeTruthy()
    expect(screen.getByLabelText(/Inactive States\/UTs: 2/i)).toBeTruthy()
  })

  it('does not render add new state button', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.queryByRole('button', { name: /add new state/i })).toBeNull()
  })
})

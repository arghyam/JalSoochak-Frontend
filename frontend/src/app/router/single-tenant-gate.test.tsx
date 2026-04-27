import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SingleTenantGate } from './single-tenant-gate'
import * as serverConfig from '@/config/server-config'
import * as locationSearchQuery from '@/features/dashboard/services/query/use-location-search-query'
import type { StateUtOption, StateUtSearchResponse } from '@/features/dashboard/types'

jest.mock('@/config/server-config')
jest.mock('@/features/dashboard/services/query/use-location-search-query')
jest.mock('@/shared/components/layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}))
jest.mock('@/features/dashboard/components/central-dashboard', () => ({
  CentralDashboard: ({ singleTenantOverride }: { singleTenantOverride?: StateUtOption }) => (
    <div data-testid="central-dashboard" data-override={singleTenantOverride?.value}>
      Dashboard
    </div>
  ),
}))

const mockIsSingleTenantMode = serverConfig.isSingleTenantMode as jest.MockedFunction<
  typeof serverConfig.isSingleTenantMode
>
const mockUseLocationSearchQuery =
  locationSearchQuery.useLocationSearchQuery as jest.MockedFunction<
    typeof locationSearchQuery.useLocationSearchQuery
  >

const mockLocationSearchData: StateUtSearchResponse = {
  totalStatesCount: 2,
  states: [
    { value: 'maharashtra', label: 'Maharashtra', tenantId: 1, tenantCode: 'MH' },
    { value: 'karnataka', label: 'Karnataka', tenantId: 2, tenantCode: 'KA' },
  ],
}

function renderWithRouter(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  // Component to capture and display current location for redirect verification
  const LocationCapture = () => {
    const location = useLocation()
    return <div data-testid="current-location" data-pathname={location.pathname} />
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SingleTenantGate />
                <LocationCapture />
              </>
            }
          />
          <Route
            path="/:stateSlug"
            element={
              <>
                <SingleTenantGate />
                <LocationCapture />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('SingleTenantGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSingleTenantMode.mockReturnValue(false)
    mockUseLocationSearchQuery.mockReturnValue({
      data: mockLocationSearchData,
      isLoading: false,
      isError: false,
    } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  describe('multi-tenant mode', () => {
    it('should render CentralDashboard when not in single-tenant mode', () => {
      mockIsSingleTenantMode.mockReturnValue(false)
      renderWithRouter('/')

      expect(screen.getByTestId('central-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
    })
  })

  describe('single-tenant mode with loading', () => {
    it('should show loading spinner while fetching location data', () => {
      mockIsSingleTenantMode.mockReturnValue(true)
      mockUseLocationSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      renderWithRouter('/')

      expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    })
  })

  describe('single-tenant mode with error', () => {
    it('should show error message when location search fails', () => {
      mockIsSingleTenantMode.mockReturnValue(true)
      mockUseLocationSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      renderWithRouter('/')

      expect(screen.getByText(/Failed to load tenant configuration/i)).toBeInTheDocument()
    })
  })

  describe('single-tenant mode with no tenants', () => {
    it('should show error when no tenants are configured in the system', () => {
      mockIsSingleTenantMode.mockReturnValue(true)
      mockUseLocationSearchQuery.mockReturnValue({
        data: { totalStatesCount: 0, states: [] },
        isLoading: false,
        isError: false,
      } as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      renderWithRouter('/')

      expect(screen.getByText(/No tenants found in single-tenant mode/i)).toBeInTheDocument()
    })
  })

  describe('single-tenant mode at root (/)', () => {
    it('should render CentralDashboard with states[0] as override at /', () => {
      mockIsSingleTenantMode.mockReturnValue(true)

      renderWithRouter('/')

      const dashboard = screen.getByTestId('central-dashboard')
      expect(dashboard).toBeInTheDocument()
      // Verify the override was passed with the first tenant's value
      expect(dashboard).toHaveAttribute('data-override', 'maharashtra')
    })
  })

  describe('single-tenant mode at state slug', () => {
    it('should redirect to / when at /:stateSlug', () => {
      mockIsSingleTenantMode.mockReturnValue(true)

      // Start at /karnataka
      renderWithRouter('/karnataka')

      // Should redirect to /
      const locationElement = screen.getByTestId('current-location')
      expect(locationElement).toHaveAttribute('data-pathname', '/')
    })

    it('should redirect to / when initial route matches configured tenant slug', () => {
      mockIsSingleTenantMode.mockReturnValue(true)

      // Start at /maharashtra which matches states[0].value from mocked location search response
      renderWithRouter('/maharashtra')

      const locationElement = screen.getByTestId('current-location')
      expect(locationElement).toHaveAttribute('data-pathname', '/')
    })
  })
})

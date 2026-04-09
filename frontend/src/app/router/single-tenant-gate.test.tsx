import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SingleTenantGate } from './single-tenant-gate'
import * as serverConfig from '@/config/server-config'
import * as locationSearchQuery from '@/features/dashboard/services/query/use-location-search-query'
import type { StateUtSearchResponse } from '@/features/dashboard/types'

jest.mock('@/config/server-config')
jest.mock('@/features/dashboard/services/query/use-location-search-query')
jest.mock('@/shared/components/layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}))
jest.mock('@/features/dashboard/components/central-dashboard', () => ({
  CentralDashboard: () => <div data-testid="central-dashboard">Dashboard</div>,
}))

const mockIsSingleTenantMode = serverConfig.isSingleTenantMode as jest.MockedFunction<
  typeof serverConfig.isSingleTenantMode
>
const mockGetSingleTenantId = serverConfig.getSingleTenantId as jest.MockedFunction<
  typeof serverConfig.getSingleTenantId
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
    mockGetSingleTenantId.mockReturnValue(null)
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
      mockGetSingleTenantId.mockReturnValue(1)
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
      mockGetSingleTenantId.mockReturnValue(1)
      mockUseLocationSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      renderWithRouter('/')

      expect(screen.getByText(/Failed to load tenant configuration/i)).toBeInTheDocument()
    })
  })

  describe('single-tenant mode without tenant ID configured', () => {
    it('should show error when no tenant ID is configured', () => {
      mockIsSingleTenantMode.mockReturnValue(true)
      mockGetSingleTenantId.mockReturnValue(null)

      renderWithRouter('/')

      expect(
        screen.getByText(/Single-tenant mode is enabled, but no tenant ID is configured/i)
      ).toBeInTheDocument()
    })
  })

  describe('single-tenant mode with invalid tenant ID', () => {
    it('should show error when configured tenant is not found', () => {
      mockIsSingleTenantMode.mockReturnValue(true)
      mockGetSingleTenantId.mockReturnValue(999)

      renderWithRouter('/')

      expect(screen.getByText(/Configured tenant \(ID: 999\) not found/i)).toBeInTheDocument()
    })
  })

  describe('single-tenant mode on correct state slug', () => {
    it('should render CentralDashboard when on correct state slug', () => {
      mockIsSingleTenantMode.mockReturnValue(true)
      mockGetSingleTenantId.mockReturnValue(1)

      renderWithRouter('/maharashtra')

      expect(screen.getByTestId('central-dashboard')).toBeInTheDocument()
    })
  })

  describe('single-tenant mode on wrong state slug', () => {
    it('should redirect to correct state slug when on wrong slug', () => {
      mockIsSingleTenantMode.mockReturnValue(true)
      mockGetSingleTenantId.mockReturnValue(1) // Maharashtra

      // When navigating to wrong state (Karnataka)
      // The component should match maharashtra (ID 1) and redirect to /maharashtra
      renderWithRouter('/karnataka')

      // Verify the redirect happened to the correct state slug
      const locationElement = screen.getByTestId('current-location')
      expect(locationElement).toHaveAttribute('data-pathname', '/maharashtra')
    })
  })
})

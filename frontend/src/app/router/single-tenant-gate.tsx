import { useParams, Navigate } from 'react-router-dom'
import { useLocationSearchQuery } from '@/features/dashboard/services/query/use-location-search-query'
import { DashboardLayout } from '@/shared/components/layout'
import { CentralDashboard } from '@/features/dashboard/components/central-dashboard'
import { isSingleTenantMode } from '@/config/server-config'
import { LoadingSpinner } from '@/shared/components/common'
import { Box, Text } from '@chakra-ui/react'

/**
 * Router gate that enforces single-tenant mode:
 * - Multi-tenant: passes through to CentralDashboard
 * - Single-tenant deployments render dashboard at base URL `/` only
 * - There is no slug-based routing in single-tenant mode
 * - When `stateSlug` is truthy (any non-base path), this module redirects via
 *   `Navigate to="/" replace`
 * - Single-tenant + invalid tenant ID: shows error
 */
export function SingleTenantGate() {
  // Multi-tenant mode: passthrough
  if (!isSingleTenantMode()) {
    return (
      <DashboardLayout>
        <CentralDashboard />
      </DashboardLayout>
    )
  }

  // Single-tenant mode: delegate to nested component that fetches data
  return <SingleTenantContent />
}

function SingleTenantContent() {
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()
  const { data: locationSearchData, isLoading, isError } = useLocationSearchQuery()

  // Loading
  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    )
  }

  // Error fetching location data
  if (isError || !locationSearchData) {
    return (
      <DashboardLayout>
        <Box p={6} textAlign="center">
          <Text color="red.500">
            Failed to load tenant configuration. Please try again or contact support.
          </Text>
        </Box>
      </DashboardLayout>
    )
  }

  // In single-tenant mode, the configured tenant is always the first one from the API
  // (single-tenant deployments only have one tenant in the backend)
  const configuredTenant = locationSearchData.states[0]

  // No tenants configured
  if (!configuredTenant) {
    return (
      <DashboardLayout>
        <Box p={6} textAlign="center">
          <Text color="red.500">
            No tenants found in single-tenant mode. Please check your configuration.
          </Text>
        </Box>
      </DashboardLayout>
    )
  }

  // If user is at /:stateSlug, redirect to / (base URL) for single-tenant mode
  if (stateSlug) {
    return <Navigate to="/" replace data-testid="single-tenant-redirect" />
  }

  // Render dashboard at / with the tenant pre-selected
  return (
    <DashboardLayout
      tenantInfo={{
        tenantName: configuredTenant.label,
        tenantCode: configuredTenant.tenantCode,
      }}
    >
      <CentralDashboard singleTenantOverride={configuredTenant} />
    </DashboardLayout>
  )
}

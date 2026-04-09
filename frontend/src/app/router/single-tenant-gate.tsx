import { useParams, Navigate } from 'react-router-dom'
import { useLocationSearchQuery } from '@/features/dashboard/services/query/use-location-search-query'
import { DashboardLayout } from '@/shared/components/layout'
import { CentralDashboard } from '@/features/dashboard/components/central-dashboard'
import { isSingleTenantMode, getSingleTenantId } from '@/config/server-config'
import { LoadingSpinner } from '@/shared/components/common'
import { Box, Text } from '@chakra-ui/react'

/**
 * Router gate that enforces single-tenant mode:
 * - Multi-tenant: passes through to CentralDashboard
 * - Single-tenant + `/`: redirects to `/:tenantSlug`
 * - Single-tenant + wrong slug: redirects to correct slug
 * - Single-tenant + correct slug: renders CentralDashboard
 * - Single-tenant + invalid tenant ID: shows error
 */
export function SingleTenantGate() {
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()
  const { data: locationSearchData, isLoading, isError } = useLocationSearchQuery()

  // Multi-tenant mode: passthrough
  if (!isSingleTenantMode()) {
    return (
      <DashboardLayout>
        <CentralDashboard />
      </DashboardLayout>
    )
  }

  // Single-tenant mode: fetch configured tenant ID
  const tenantId = getSingleTenantId()

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

  // Single-tenant mode but no tenant ID configured
  if (!tenantId) {
    return (
      <DashboardLayout>
        <Box p={6} textAlign="center">
          <Text color="red.500">
            Single-tenant mode is enabled, but no tenant ID is configured. Please set
            JALSOOCHAK_TENANT_ID.
          </Text>
        </Box>
      </DashboardLayout>
    )
  }

  // Find configured tenant in the location search data
  const configuredTenant = locationSearchData.states.find((option) => option.tenantId === tenantId)

  // Tenant not found in list
  if (!configuredTenant) {
    return (
      <DashboardLayout>
        <Box p={6} textAlign="center">
          <Text color="red.500">
            Configured tenant (ID: {tenantId}) not found. Please verify JALSOOCHAK_TENANT_ID is
            correct.
          </Text>
        </Box>
      </DashboardLayout>
    )
  }

  // Current URL slug doesn't match configured tenant: redirect
  if (stateSlug !== configuredTenant.value) {
    return <Navigate to={`/${configuredTenant.value}`} replace />
  }

  // Correct slug: render dashboard
  return (
    <DashboardLayout>
      <CentralDashboard />
    </DashboardLayout>
  )
}

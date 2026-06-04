import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useTenantBoundaryGeoJsonQuery } from './use-tenant-boundary-geojson-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  tenantId: 6,
  parentLgdId: 11,
}

describe('useTenantBoundaryGeoJsonQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useTenantBoundaryGeoJsonQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.tenantBoundaryGeoJson(params),
        enabled: true,
      })
    )
  })

  it('honors explicit enabled: false when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useTenantBoundaryGeoJsonQuery({ params, enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.tenantBoundaryGeoJson(params),
        enabled: false,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useTenantBoundaryGeoJsonQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.tenantBoundaryGeoJson(null),
        enabled: false,
      })
    )
  })
})

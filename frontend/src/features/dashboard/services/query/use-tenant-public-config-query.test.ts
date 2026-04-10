import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useTenantPublicConfigQuery } from './use-tenant-public-config-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

describe('useTenantPublicConfigQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables for numeric tenant id', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useTenantPublicConfigQuery({ tenantId: 42 }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.tenantPublicConfig(42),
        enabled: true,
      })
    )
  })

  it('disables when tenant id is undefined', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useTenantPublicConfigQuery({}))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('honors explicit enabled: false for numeric tenant id', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useTenantPublicConfigQuery({ tenantId: 42, enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.tenantPublicConfig(42),
        enabled: false,
      })
    )
  })
})

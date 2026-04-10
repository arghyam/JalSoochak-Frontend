import { renderHook } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { useStateAdminsByTenantQuery, useTenantsSummaryQuery } from './use-super-admin-queries'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

describe('use-super-admin-queries', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('wires tenants summary query key', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useTenantsSummaryQuery())
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['super-admin', 'tenants-summary'] })
    )
  })

  it('disables state-admins-by-tenant query without tenantCode', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useStateAdminsByTenantQuery(undefined))
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

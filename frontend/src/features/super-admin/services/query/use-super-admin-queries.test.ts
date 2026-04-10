import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { superAdminApi } from '../api/super-admin-api'
import {
  useStateAdminsByTenantQuery,
  useStatesUTsPagedQuery,
  useSuperUsersQuery,
  useTenantsSummaryQuery,
} from './use-super-admin-queries'

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

  it('enables state-admins-by-tenant when tenantCode is set', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useStateAdminsByTenantQuery('TN'))
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: ['super-admin', 'state-admins', 'by-tenant', 'TN'],
      })
    )
  })

  it('maps paged states query to zero-based API page', async () => {
    const getStatesUTsPage = jest
      .spyOn(superAdminApi, 'getStatesUTsPage')
      .mockResolvedValue({ items: [], total: 0 })
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useStatesUTsPagedQuery(2, 20, 'search', 'ACTIVE'))
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['super-admin', 'states-uts', 2, 20, 'search', 'ACTIVE'],
        queryFn: expect.any(Function),
      })
    )
    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>
    }
    await options.queryFn()
    expect(getStatesUTsPage).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      search: 'search',
      status: 'ACTIVE',
    })
    getStatesUTsPage.mockRestore()
  })

  it('wires super users list query key', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useSuperUsersQuery(1, 10, 'active'))
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['super-admin', 'super-users', 1, 10, 'active'],
        queryFn: expect.any(Function),
      })
    )
  })
})

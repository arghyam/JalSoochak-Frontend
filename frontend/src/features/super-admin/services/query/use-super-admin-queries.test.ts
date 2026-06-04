import { describe, expect, it, jest, afterEach, beforeEach } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminApi } from '../api/super-admin-api'
import {
  useCreateTenantMutation,
  useInviteUserMutation,
  useSaveSystemConfigurationMutation,
  useStateAdminsByTenantQuery,
  useStateAdminsQuery,
  useStatesUTsPagedQuery,
  useSuperUsersQuery,
  useTenantsSummaryQuery,
  useUpdateUserMutation,
} from './use-super-admin-queries'
import { superAdminQueryKeys } from './super-admin-query-keys'
import type { SystemConfiguration } from '../../types/system-config'
import type { ApiUser } from '../../types/super-users'

const baseApiUser = (overrides: Partial<ApiUser>): ApiUser => ({
  id: 1,
  email: 'a@b.com',
  firstName: 'F',
  lastName: 'L',
  phoneNumber: '1',
  role: 'STATE_ADMIN',
  tenantCode: 'TN',
  status: 'ACTIVE',
  createdAt: '',
  ...overrides,
})

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

const mockedUseQuery = useQuery as jest.Mock
const mockedUseMutation = useMutation as jest.Mock
const mockedUseQueryClient = useQueryClient as jest.Mock

describe('use-super-admin-queries', () => {
  const invalidateQueries = jest.fn()
  const setQueryData = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseQueryClient.mockReturnValue({
      invalidateQueries,
      setQueryData,
      removeQueries: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('wires tenants summary query key', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useTenantsSummaryQuery())
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: superAdminQueryKeys.tenantsSummary() })
    )
  })

  it('disables state-admins-by-tenant query without tenantCode', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStateAdminsByTenantQuery(undefined))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('enables state-admins-by-tenant when tenantCode is set', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStateAdminsByTenantQuery('TN'))
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: superAdminQueryKeys.stateAdminsByTenant('TN'),
      })
    )
  })

  it('maps paged states query to zero-based API page', async () => {
    const getStatesUTsPage = jest
      .spyOn(superAdminApi, 'getStatesUTsPage')
      .mockResolvedValue({ items: [], total: 0 })
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStatesUTsPagedQuery(2, 20, 'search', 'ACTIVE'))
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: superAdminQueryKeys.statesUTsPaged(2, 20, 'search', 'ACTIVE'),
        queryFn: expect.any(Function),
      })
    )
    const options = mockedUseQuery.mock.calls[0][0] as {
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

  it('omits search and status when empty or all for paged states', async () => {
    const getStatesUTsPage = jest
      .spyOn(superAdminApi, 'getStatesUTsPage')
      .mockResolvedValue({ items: [], total: 0 })
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStatesUTsPagedQuery(1, 10, '', 'all'))
    const options = mockedUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>
    }
    await options.queryFn()
    expect(getStatesUTsPage).toHaveBeenCalledWith({
      page: 0,
      size: 10,
    })
    getStatesUTsPage.mockRestore()
  })

  it('wires super users list query key', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useSuperUsersQuery(1, 10, 'active'))
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: superAdminQueryKeys.superUsers(1, 10, 'active'),
        queryFn: expect.any(Function),
      })
    )
  })

  it('maps super users queryFn and omits status when all', async () => {
    const getSuperUsers = jest.spyOn(superAdminApi, 'getSuperUsers').mockResolvedValue({
      content: [baseApiUser({ id: 1, role: 'SUPER_USER' })],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    })
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useSuperUsersQuery(1, 10, 'all'))
    const options = mockedUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<{ items: unknown[]; total: number }>
    }
    const page = await options.queryFn()
    expect(getSuperUsers).toHaveBeenCalledWith({
      page: 0,
      size: 10,
    })
    expect(page.total).toBe(1)
    expect(page.items).toHaveLength(1)
    getSuperUsers.mockRestore()
  })

  it('maps state admins list with ACTIVE, INACTIVE, and PENDING', async () => {
    const getStateAdminsData = jest.spyOn(superAdminApi, 'getStateAdminsData').mockResolvedValue({
      content: [
        baseApiUser({ id: 1, tenantCode: 'TN', status: 'ACTIVE' }),
        baseApiUser({
          id: 2,
          email: 'b@b.com',
          firstName: null,
          lastName: null,
          phoneNumber: '2',
          status: 'INACTIVE',
          tenantCode: 'MH',
        }),
        baseApiUser({
          id: 3,
          email: 'c@b.com',
          firstName: 'P',
          lastName: 'Q',
          phoneNumber: '3',
          status: 'PENDING',
          tenantCode: 'GJ',
        }),
      ],
      totalElements: 3,
      totalPages: 1,
      size: 10,
      number: 0,
    })
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStateAdminsQuery(2, 10, 'Ada', 'ACTIVE'))
    const options = mockedUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<{ items: { status: string; adminName: string }[]; total: number }>
    }
    const result = await options.queryFn()
    expect(getStateAdminsData).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      name: 'Ada',
      status: 'ACTIVE',
    })
    expect(result.items[0]?.status).toBe('active')
    expect(result.items[1]?.adminName).toBe('')
    expect(result.items[1]?.status).toBe('inactive')
    expect(result.items[2]?.status).toBe('pending')
    getStateAdminsData.mockRestore()
  })

  it('omits name and status for state admins when empty or all', async () => {
    const getStateAdminsData = jest.spyOn(superAdminApi, 'getStateAdminsData').mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    })
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStateAdminsQuery(1, 10, '', 'all'))
    const options = mockedUseQuery.mock.calls[0][0] as { queryFn: () => Promise<unknown> }
    await options.queryFn()
    expect(getStateAdminsData).toHaveBeenCalledWith({
      page: 0,
      size: 10,
    })
    getStateAdminsData.mockRestore()
  })

  it('useCreateTenantMutation invalidates states UTs', async () => {
    renderHook(() => useCreateTenantMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as { onSuccess: () => Promise<void> }
    await onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: superAdminQueryKeys.statesUTs(),
    })
  })

  it('useInviteUserMutation invalidates super-users for SUPER_USER role', async () => {
    renderHook(() => useInviteUserMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (_d: unknown, variables: { role: string; tenantCode?: string }) => Promise<void>
    }
    await onSuccess(undefined, {
      role: 'SUPER_USER',
      email: 'x',
      firstName: 'a',
      lastName: 'b',
      phoneNumber: '1',
    } as never)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...superAdminQueryKeys.all, 'super-users'],
    })
  })

  it('useInviteUserMutation invalidates state admins by tenant when tenantCode set', async () => {
    renderHook(() => useInviteUserMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (_d: unknown, variables: { role: string; tenantCode?: string }) => Promise<void>
    }
    await onSuccess(undefined, {
      role: 'STATE_ADMIN',
      tenantCode: 'MH',
      email: 'x',
      firstName: 'a',
      lastName: 'b',
      phoneNumber: '1',
    } as never)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: superAdminQueryKeys.stateAdminsByTenant('MH'),
    })
  })

  it('useUpdateUserMutation invalidates related queries', async () => {
    renderHook(() => useUpdateUserMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (_d: unknown, variables: { id: string; payload: unknown }) => Promise<void>
    }
    await onSuccess(undefined, { id: 'user-1', payload: {} })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: superAdminQueryKeys.superUserById('user-1'),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...superAdminQueryKeys.all, 'super-users'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...superAdminQueryKeys.all, 'state-admins'],
    })
  })

  it('useSaveSystemConfigurationMutation sets system configuration cache', async () => {
    renderHook(() => useSaveSystemConfigurationMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (data: SystemConfiguration) => void
    }
    const data: SystemConfiguration = {
      supportedChannels: ['Bulk Flow Meter'],
      bfmImageConfidenceThreshold: 0.9,
      locationAffinityThreshold: 0.5,
    }
    onSuccess(data)
    expect(setQueryData).toHaveBeenCalledWith(superAdminQueryKeys.systemConfiguration(), data)
  })
})

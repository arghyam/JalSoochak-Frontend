import { describe, expect, it, jest, afterEach, beforeEach } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import {
  useIntegrationConfigurationQuery,
  useLanguageConfigurationQuery,
  useSaveLanguageConfigurationMutation,
  useSaveIntegrationConfigurationMutation,
  useSaveWaterNormsConfigurationMutation,
  useSaveConfigurationMutation,
  useSaveEscalationRulesMutation,
  useSchemeMappingsListQuery,
  useStaffCountsQuery,
  useStaffListQuery,
  useStateUTAdminsQuery,
  useUpdateLogoMutation,
  useUploadPumpOperatorsMutation,
  useUploadSchemesMutation,
  useUploadSchemeMappingsMutation,
  useWaterNormsConfigurationQuery,
  useStateUTAdminByIdQuery,
  useSchemeCountsQuery,
  useSchemeListQuery,
  useLogoQuery,
  useUpdateStateUTAdminMutation,
  useUpdateStateUTAdminStatusMutation,
  useReinviteStateUTAdminMutation,
} from './use-state-admin-queries'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stateAdminApi } from '../api/state-admin-api'
import { stateAdminQueryKeys } from './state-admin-query-keys'
import { useAuthStore } from '@/app/store/auth-store'
import type { AuthState } from '@/app/store/auth-store'
import type { SchemeListParams } from '../../types/scheme-sync'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}))

const mockedUseQuery = useQuery as jest.Mock
const mockedUseMutation = useMutation as jest.Mock
const mockedUseQueryClient = useQueryClient as jest.Mock
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('use-state-admin-queries', () => {
  const invalidateQueries = jest.fn()
  const setQueryData = jest.fn()
  const removeQueries = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseQueryClient.mockReturnValue({
      invalidateQueries,
      setQueryData,
      removeQueries,
    })
    mockedUseAuthStore.mockImplementation(((selector: (s: AuthState) => string) =>
      selector({ user: { tenantCode: 'TN' } } as AuthState)) as typeof useAuthStore)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('wires staff counts query', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStaffCountsQuery())
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: stateAdminQueryKeys.staffCounts() })
    )
  })

  it('disables staff list when tenant code empty', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useStaffListQuery({
        roles: ['PUMP_OPERATOR'],
        page: 0,
        limit: 10,
        tenantCode: '',
      })
    )
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('enables staff list when tenant code set', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useStaffListQuery({
        roles: ['PUMP_OPERATOR'],
        page: 0,
        limit: 10,
        tenantCode: 'MH',
      })
    )
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('enables scheme mappings list only with tenant code', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useSchemeMappingsListQuery({
        tenantCode: '',
        page: 0,
        limit: 10,
        schemeName: '',
        sortDir: '',
      })
    )
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('enables scheme mappings list when tenant code is present', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useSchemeMappingsListQuery({
        tenantCode: 'MH',
        page: 0,
        limit: 10,
        schemeName: 'x',
        sortDir: 'asc',
      })
    )
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('enables and disables scheme counts query based on tenant code', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useSchemeCountsQuery(''))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))

    mockedUseQuery.mockClear()
    renderHook(() => useSchemeCountsQuery('TN'))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('enables and disables scheme list query based on tenant code', () => {
    mockedUseQuery.mockReturnValue({})
    const paramsEmpty: SchemeListParams = {
      tenantCode: '',
      page: 0,
      limit: 10,
      schemeName: '',
      sortDir: '',
    }
    const paramsWithTenant: SchemeListParams = {
      tenantCode: 'TN',
      page: 0,
      limit: 10,
      schemeName: '',
      sortDir: '',
    }
    renderHook(() => useSchemeListQuery(paramsEmpty))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))

    mockedUseQuery.mockClear()
    renderHook(() => useSchemeListQuery(paramsWithTenant))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('wires language configuration query', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useLanguageConfigurationQuery())
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: stateAdminQueryKeys.languageConfiguration() })
    )
  })

  it('wires integration configuration query', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useIntegrationConfigurationQuery())
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: stateAdminQueryKeys.integrationConfiguration() })
    )
  })

  it('wires water norms configuration query', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useWaterNormsConfigurationQuery())
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: stateAdminQueryKeys.waterNormsConfiguration() })
    )
  })

  it('disables state UT admins query when tenant code missing from store', () => {
    mockedUseAuthStore.mockImplementation(((selector: (s: AuthState) => string) =>
      selector({ user: { tenantCode: '' } } as AuthState)) as typeof useAuthStore)
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStateUTAdminsQuery(1, 10, '', 'all'))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('enables state UT admin by id query only when id is provided', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useStateUTAdminByIdQuery(undefined))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))

    mockedUseQuery.mockClear()
    renderHook(() => useStateUTAdminByIdQuery('42'))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('maps state UT admins API page with ACTIVE, INACTIVE, and PENDING statuses', async () => {
    mockedUseQuery.mockReturnValue({})
    const listSpy = jest.spyOn(stateAdminApi, 'getStateUTAdmins').mockResolvedValue({
      content: [
        {
          id: 1,
          email: 'a@b.com',
          firstName: 'F',
          lastName: 'L',
          phoneNumber: '1',
          status: 'ACTIVE',
        },
        {
          id: 2,
          email: 'b@b.com',
          firstName: null,
          lastName: null,
          phoneNumber: '2',
          status: 'INACTIVE',
        },
        {
          id: 3,
          email: 'c@b.com',
          firstName: 'P',
          lastName: 'Q',
          phoneNumber: '3',
          status: 'PENDING',
        },
      ],
      totalElements: 3,
      totalPages: 1,
      size: 10,
      number: 0,
    })

    renderHook(() => useStateUTAdminsQuery(2, 10, 'Ada', 'ACTIVE'))

    const options = mockedUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<{ items: { status: string }[]; total: number }>
    }
    const result = await options.queryFn()

    expect(listSpy).toHaveBeenCalledWith('TN', {
      page: 1,
      size: 10,
      name: 'Ada',
      status: 'ACTIVE',
    })
    expect(result.items[0]?.status).toBe('active')
    expect(result.items[1]?.status).toBe('inactive')
    expect(result.items[2]?.status).toBe('pending')
    expect(result.total).toBe(3)

    listSpy.mockRestore()
  })

  it('omits name and status in state UT admins query when filters are empty or all', async () => {
    mockedUseQuery.mockReturnValue({})
    const listSpy = jest.spyOn(stateAdminApi, 'getStateUTAdmins').mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    })

    renderHook(() => useStateUTAdminsQuery(1, 10, '', 'all'))

    const options = mockedUseQuery.mock.calls[0][0] as { queryFn: () => Promise<unknown> }
    await options.queryFn()

    expect(listSpy).toHaveBeenCalledWith('TN', {
      page: 0,
      size: 10,
    })

    listSpy.mockRestore()
  })

  it('useSaveLanguageConfigurationMutation invalidates templates and config status', async () => {
    renderHook(() => useSaveLanguageConfigurationMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (data: { id: string }) => Promise<void>
    }
    const data = { id: 't1', primaryLanguage: 'en', isConfigured: true } as never
    await onSuccess(data)
    expect(setQueryData).toHaveBeenCalledWith(stateAdminQueryKeys.languageConfiguration(), data)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.configStatus(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.messageTemplates(),
    })
  })

  it('useSaveIntegrationConfigurationMutation updates cache and invalidates config status', async () => {
    renderHook(() => useSaveIntegrationConfigurationMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (data: { id: string }) => Promise<void>
    }
    const data = { id: 't1', apiUrl: 'x', organizationId: 'o', isConfigured: true } as never
    await onSuccess(data)
    expect(setQueryData).toHaveBeenCalledWith(stateAdminQueryKeys.integrationConfiguration(), data)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.configStatus(),
    })
  })

  it('useSaveWaterNormsConfigurationMutation invalidates config status', async () => {
    renderHook(() => useSaveWaterNormsConfigurationMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (data: { id: string }) => Promise<void>
    }
    const data = {
      id: 't1',
      stateQuantity: null,
      districtOverrides: [],
      oversupplyThreshold: null,
      undersupplyThreshold: null,
      isConfigured: false,
    } as never
    await onSuccess(data)
    expect(setQueryData).toHaveBeenCalledWith(stateAdminQueryKeys.waterNormsConfiguration(), data)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.configStatus(),
    })
  })

  it('useSaveConfigurationMutation invalidates config status', async () => {
    renderHook(() => useSaveConfigurationMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (data: { id: string }) => Promise<void>
    }
    const data = { id: 't1', isConfigured: true } as never
    await onSuccess(data)
    expect(setQueryData).toHaveBeenCalledWith(stateAdminQueryKeys.configuration(), data)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.configStatus(),
    })
  })

  it('useSaveEscalationRulesMutation sets escalation cache', async () => {
    renderHook(() => useSaveEscalationRulesMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (data: unknown) => Promise<void>
    }
    const data = { schedule: { hour: 9, minute: 0 }, levels: [] as const }
    await onSuccess(data)
    expect(setQueryData).toHaveBeenCalledWith(stateAdminQueryKeys.escalationRules(), data)
  })

  it('useUploadPumpOperatorsMutation invalidates staff list and counts', async () => {
    renderHook(() => useUploadPumpOperatorsMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as { onSuccess: () => Promise<void> }
    await onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...stateAdminQueryKeys.all, 'staff-list'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.staffCounts(),
    })
  })

  it('useUploadSchemesMutation invalidates scheme list and counts', async () => {
    renderHook(() => useUploadSchemesMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (_d: unknown, variables: { tenantCode: string; file: File }) => Promise<void>
    }
    await onSuccess(undefined, { tenantCode: 'MH', file: new File([], 'x') })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...stateAdminQueryKeys.all, 'scheme-list'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.schemeCounts('MH'),
    })
  })

  it('useUploadSchemeMappingsMutation invalidates scheme mappings list', async () => {
    renderHook(() => useUploadSchemeMappingsMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as { onSuccess: () => Promise<void> }
    await onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...stateAdminQueryKeys.all, 'scheme-mappings-list'],
    })
  })

  it('useUpdateLogoMutation invalidates logo and config status', async () => {
    renderHook(() => useUpdateLogoMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as { onSuccess: () => Promise<void> }
    await onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.logo(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.configStatus(),
    })
  })

  it('sets logo query retry to false', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useLogoQuery())
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ retry: false }))
  })

  it('useUpdateStateUTAdminMutation removes per-id cache key', async () => {
    renderHook(() => useUpdateStateUTAdminMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (_d: unknown, variables: { id: string }) => Promise<void>
    }
    await onSuccess(undefined, { id: 'u-1' })
    expect(removeQueries).toHaveBeenCalledTimes(1)
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: stateAdminQueryKeys.stateUtAdminById('u-1'),
    })
  })

  it('useUpdateStateUTAdminStatusMutation invalidates listing and detail keys', async () => {
    renderHook(() => useUpdateStateUTAdminStatusMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as {
      onSuccess: (_d: unknown, variables: { id: string }) => Promise<void>
    }
    await onSuccess(undefined, { id: 'u-2' })
    expect(invalidateQueries).toHaveBeenCalledTimes(2)
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: [...stateAdminQueryKeys.all, 'state-ut-admins'],
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: stateAdminQueryKeys.stateUtAdminById('u-2'),
    })
  })

  it('useReinviteStateUTAdminMutation invalidates listing key', async () => {
    renderHook(() => useReinviteStateUTAdminMutation())
    const { onSuccess } = mockedUseMutation.mock.calls[0][0] as { onSuccess: () => Promise<void> }
    await onSuccess()
    expect(invalidateQueries).toHaveBeenCalledTimes(1)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...stateAdminQueryKeys.all, 'state-ut-admins'],
    })
  })
})

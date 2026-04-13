import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { AxiosError } from 'axios'
import { superAdminApi } from './super-admin-api'
import { apiClient } from '@/shared/lib/axios'

jest.mock('@/shared/lib/axios', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
}))

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

describe('superAdminApi', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  // Helper to create properly typed mock responses
  const createMockApiResponse = <T>(data: T) =>
    ({
      data: { data },
    }) as never

  it('maps tenants summary response to dashboard stats', async () => {
    mockedApiClient.get.mockResolvedValueOnce(
      createMockApiResponse({
        totalTenants: 9,
        activeTenants: 7,
        inactiveTenants: 2,
        archivedTenants: 0,
      })
    )
    const res = await superAdminApi.getTenantsSummary()
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/tenants/summary')
    expect(res).toEqual({ totalStatesManaged: 9, activeStates: 7, inactiveStates: 2 })
  })

  it('deactivates tenant for INACTIVE status', async () => {
    await superAdminApi.updateTenantStatus(12, 'INACTIVE')
    expect(mockedApiClient.post).toHaveBeenCalledTimes(1)
    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/tenants/12/deactivate')
    expect(mockedApiClient.put).not.toHaveBeenCalled()
  })

  it('activates tenant with put when status is not INACTIVE', async () => {
    await superAdminApi.updateTenantStatus(5, 'ACTIVE')
    expect(mockedApiClient.put).toHaveBeenCalledWith('/api/v1/tenants/5', { status: 'ACTIVE' })
    expect(mockedApiClient.post).not.toHaveBeenCalled()
  })

  it('maps system configuration from API configs envelope', async () => {
    mockedApiClient.get.mockResolvedValueOnce(
      createMockApiResponse({
        configs: {
          SYSTEM_SUPPORTED_CHANNELS: { channels: ['BFM', 'MAN'] },
          BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD: { value: '0.5' },
          LOCATION_AFFINITY_THRESHOLD: { value: '0.25' },
        },
      })
    )
    const res = await superAdminApi.getSystemConfiguration()
    expect(mockedApiClient.get).toHaveBeenCalledTimes(1)
    const [requestUrl] = mockedApiClient.get.mock.calls[0] as [string]
    expect(requestUrl).toMatch(/^\/api\/v1\/system\/config\?keys=/)
    for (const key of [
      'SYSTEM_SUPPORTED_CHANNELS',
      'WATER_QUANTITY_SUPPLY_THRESHOLD',
      'BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD',
      'LOCATION_AFFINITY_THRESHOLD',
    ]) {
      expect(requestUrl).toContain(key)
    }
    expect(res.supportedChannels).toEqual(['Bulk Flow Meter', 'Manual'])
    expect(res.bfmImageConfidenceThreshold).toBe(0.5)
    expect(res.locationAffinityThreshold).toBe(0.25)
  })

  it('passes search and status to tenants page query', async () => {
    mockedApiClient.get.mockResolvedValueOnce(
      createMockApiResponse({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      })
    )
    await superAdminApi.getStatesUTsPage({ page: 0, size: 10, search: 'mh', status: 'ACTIVE' })
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/tenants', {
      params: { page: 0, size: 10, search: 'mh', status: 'ACTIVE' },
    })
  })

  it('returns null when super user is not found', async () => {
    const err = new AxiosError('missing')
    err.response = { status: 404 } as never
    mockedApiClient.get.mockRejectedValueOnce(err)
    await expect(superAdminApi.getSuperUserById('99')).resolves.toBeNull()
  })

  it('getSuperUserById maps user on success', async () => {
    mockedApiClient.get.mockResolvedValueOnce(
      createMockApiResponse({
        id: 3,
        email: 'a@b.com',
        firstName: 'F',
        lastName: 'L',
        phoneNumber: '1',
        role: 'SUPER_USER',
        tenantCode: null,
        status: 'ACTIVE',
        createdAt: '',
      })
    )
    const res = await superAdminApi.getSuperUserById('3')
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/users/3')
    expect(res?.email).toBe('a@b.com')
    expect(res?.status).toBe('active')
  })

  it('getSuperUserById rethrows non-404 errors', async () => {
    const err = new AxiosError('bad')
    err.response = { status: 500 } as never
    mockedApiClient.get.mockRejectedValueOnce(err)
    await expect(superAdminApi.getSuperUserById('1')).rejects.toBe(err)
  })

  it('getStateAdminsByTenant maps content', async () => {
    mockedApiClient.get.mockResolvedValueOnce(
      createMockApiResponse({
        content: [
          {
            id: 1,
            email: 'e@e.com',
            firstName: 'A',
            lastName: 'B',
            phoneNumber: '9',
            role: 'STATE_ADMIN',
            tenantCode: 'TN',
            status: 'ACTIVE',
            createdAt: '',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      })
    )
    const res = await superAdminApi.getStateAdminsByTenant('TN')
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/users/state-admins', {
      params: { tenantCode: 'TN' },
    })
    expect(res[0]?.email).toBe('e@e.com')
  })

  it('getStateAdminsData omits optional name and status', async () => {
    mockedApiClient.get.mockResolvedValueOnce(
      createMockApiResponse({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      })
    )
    await superAdminApi.getStateAdminsData({ page: 0, size: 10 })
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/users/state-admins', {
      params: { page: 0, size: 10 },
    })
  })

  it('getSuperUsers passes status filter', async () => {
    mockedApiClient.get.mockResolvedValueOnce(
      createMockApiResponse({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      })
    )
    await superAdminApi.getSuperUsers({ page: 0, size: 10, status: 'ACTIVE' })
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/users/super-users', {
      params: { page: 0, size: 10, status: 'ACTIVE' },
    })
  })

  it('createTenant posts and maps tenant', async () => {
    mockedApiClient.post.mockResolvedValueOnce(
      createMockApiResponse({
        id: 1,
        stateCode: 'MH',
        name: 'Maharashtra',
        lgdCode: 27,
        status: 'ACTIVE',
      })
    )
    const t = await superAdminApi.createTenant({
      stateCode: 'MH',
      name: 'Maharashtra',
      lgdCode: 27,
    })
    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/tenants', {
      stateCode: 'MH',
      name: 'Maharashtra',
      lgdCode: 27,
    })
    expect(t.stateCode).toBe('MH')
  })

  it('inviteUser posts payload', async () => {
    mockedApiClient.post.mockResolvedValueOnce({} as never)
    await superAdminApi.inviteUser({
      firstName: 'A',
      lastName: 'B',
      phoneNumber: '1',
      email: 'e@e.com',
      role: 'STATE_ADMIN',
      tenantCode: 'TN',
    })
    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/users/invitations', {
      firstName: 'A',
      lastName: 'B',
      phoneNumber: '1',
      email: 'e@e.com',
      role: 'STATE_ADMIN',
      tenantCode: 'TN',
    })
  })

  it('updateUser patches user', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({} as never)
    await superAdminApi.updateUser('9', { firstName: 'X' })
    expect(mockedApiClient.patch).toHaveBeenCalledWith('/api/v1/users/9', { firstName: 'X' })
  })

  it('updateUserStatus posts activate for active', async () => {
    mockedApiClient.post.mockResolvedValueOnce({} as never)
    await superAdminApi.updateUserStatus('2', 'active')
    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/users/2/activate')
  })

  it('updateUserStatus posts deactivate for inactive', async () => {
    mockedApiClient.post.mockResolvedValueOnce({} as never)
    await superAdminApi.updateUserStatus('2', 'inactive')
    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/users/2/deactivate')
  })

  it('reinviteUser posts invitations', async () => {
    mockedApiClient.post.mockResolvedValueOnce({} as never)
    await superAdminApi.reinviteUser('12')
    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/users/12/invitations')
  })

  it('saveSystemConfiguration puts and maps response', async () => {
    mockedApiClient.put.mockResolvedValueOnce(
      createMockApiResponse({
        configs: {
          SYSTEM_SUPPORTED_CHANNELS: { channels: ['BFM'] },
          BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD: { value: '0.8' },
          LOCATION_AFFINITY_THRESHOLD: { value: '0.3' },
        },
      })
    )
    const res = await superAdminApi.saveSystemConfiguration({
      supportedChannels: ['Bulk Flow Meter'],
      bfmImageConfidenceThreshold: 0.8,
      locationAffinityThreshold: 0.3,
    })
    expect(mockedApiClient.put).toHaveBeenCalledWith(
      '/api/v1/system/config',
      expect.objectContaining({
        configs: expect.objectContaining({
          SYSTEM_SUPPORTED_CHANNELS: { channels: ['BFM'] },
          BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD: { value: '0.8' },
          LOCATION_AFFINITY_THRESHOLD: { value: '0.3' },
        }),
      })
    )
    expect(res.bfmImageConfidenceThreshold).toBe(0.8)
  })
})

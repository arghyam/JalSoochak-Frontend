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

  it('maps tenants summary response to dashboard stats', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { totalTenants: 9, activeTenants: 7, inactiveTenants: 2, archivedTenants: 0 } },
    } as never)
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
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          configs: {
            SYSTEM_SUPPORTED_CHANNELS: { channels: ['BFM', 'MAN'] },
            BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD: { value: '0.5' },
            LOCATION_AFFINITY_THRESHOLD: { value: '0.25' },
          },
        },
      },
    } as never)
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
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0,
        },
      },
    } as never)
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
})

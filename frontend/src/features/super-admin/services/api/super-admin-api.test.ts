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
    expect(res).toEqual({ totalStatesManaged: 9, activeStates: 7, inactiveStates: 2 })
  })

  it('deactivates tenant for INACTIVE status', async () => {
    await superAdminApi.updateTenantStatus(12, 'INACTIVE')
    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/tenants/12/deactivate')
  })
})

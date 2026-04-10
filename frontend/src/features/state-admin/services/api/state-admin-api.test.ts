import { stateAdminApi } from './state-admin-api'
import { apiClient } from '@/shared/lib/axios'
import { useAuthStore } from '@/app/store/auth-store'

jest.mock('@/shared/lib/axios', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
}))
jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: { getState: jest.fn() },
}))

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>
const mockedGetState = useAuthStore.getState as jest.Mock

describe('stateAdminApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetState.mockReturnValue({ user: { tenantId: '1', tenantCode: 'TN' } })
  })

  it('maps staff counts by role', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        data: [
          { role: 'PUMP_OPERATOR', count: 2 },
          { role: 'SECTION_OFFICER', count: 3 },
          { role: 'SUB_DIVISIONAL_OFFICER', count: 1 },
          { role: 'STATE_ADMIN', count: 4 },
        ],
      },
    } as never)
    const res = await stateAdminApi.getStaffCounts()
    expect(res).toEqual({
      totalStaff: 6,
      pumpOperators: 2,
      sectionOfficers: 3,
      subDivisionOfficers: 1,
      totalAdmins: 4,
    })
  })

  it('posts scheme mappings upload with tenant header', async () => {
    const file = new File(['x'], 'mappings.xls')
    await stateAdminApi.uploadSchemeMappings(file, 'TN')
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/v1/scheme/schemes/mappings/upload',
      expect.any(FormData),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Tenant-Code': 'TN' }) })
    )
  })
})

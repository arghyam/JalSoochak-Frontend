import { beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockGetTenants = jest.fn()

jest.mock('./dashboard-api', () => ({
  dashboardApi: {
    getTenants: (...args: unknown[]) => mockGetTenants(...args),
  },
}))

describe('locationSearchApi', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('maps tenants API response to states options', async () => {
    const apiResponse = {
      data: {
        content: [
          { uuid: 'tenant-1', name: 'Telangana', status: 'ACTIVE' },
          { uuid: 'tenant-2', name: 'Andhra Pradesh', status: 'ACTIVE' },
        ],
        totalElements: 2,
      },
    }
    mockGetTenants.mockImplementation(async () => apiResponse)

    const { locationSearchApi } = await import('./location-search-api')
    const response = await locationSearchApi.getStatesUts()

    expect(mockGetTenants).toHaveBeenCalledTimes(1)
    expect(response).toEqual({
      totalStatesCount: 2,
      states: [
        { value: 'telangana', label: 'Telangana' },
        { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
      ],
    })
  })

  it('falls back to mapped content length when totalElements is missing', async () => {
    const apiResponse = {
      data: {
        data: {
          content: [{ uuid: 'tenant-1', name: 'Telangana', status: 'ACTIVE' }],
        },
      },
    }
    mockGetTenants.mockImplementation(async () => apiResponse)

    const { locationSearchApi } = await import('./location-search-api')
    const response = await locationSearchApi.getStatesUts()

    expect(response).toEqual({
      totalStatesCount: 1,
      states: [{ value: 'telangana', label: 'Telangana' }],
    })
  })

  it('supports content directly under response data', async () => {
    const apiResponse = {
      data: {
        content: [{ uuid: 'tenant-1', name: 'Assam', status: 'ACTIVE' }],
        totalElements: 1,
      },
    }
    mockGetTenants.mockImplementation(async () => apiResponse)

    const { locationSearchApi } = await import('./location-search-api')
    const response = await locationSearchApi.getStatesUts()

    expect(response).toEqual({
      totalStatesCount: 1,
      states: [{ value: 'assam', label: 'Assam' }],
    })
  })

  it('excludes tenant with id 0 from states list', async () => {
    const apiResponse = {
      data: {
        content: [
          { id: 0, uuid: 'tenant-0', name: 'India', status: 'ACTIVE' },
          { id: 16, uuid: 'tenant-16', name: 'Telangana', status: 'ACTIVE' },
          { id: 17, uuid: 'tenant-17', name: 'Assam', status: 'ACTIVE' },
        ],
        totalElements: 3,
      },
    }
    mockGetTenants.mockImplementation(async () => apiResponse)

    const { locationSearchApi } = await import('./location-search-api')
    const response = await locationSearchApi.getStatesUts()

    expect(response).toEqual({
      totalStatesCount: 2,
      states: [
        { value: 'telangana', label: 'Telangana', tenantId: 16 },
        { value: 'assam', label: 'Assam', tenantId: 17 },
      ],
    })
  })
})

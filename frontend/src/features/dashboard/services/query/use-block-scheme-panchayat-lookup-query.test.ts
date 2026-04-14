import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach, beforeEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { locationSearchQueryKeys } from './location-search-query-keys'
import { useBlockSchemePanchayatLookupQuery } from './use-block-scheme-panchayat-lookup-query'
import { dashboardApi, type TenantChildLocationsResponse } from '../api/dashboard-api'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

jest.mock('../api/dashboard-api', () => ({
  dashboardApi: { getTenantChildLocations: jest.fn() },
}))

const mockedUseQuery = useQuery as jest.Mock
const mockedGetChildren = jest.mocked(dashboardApi.getTenantChildLocations)

describe('useBlockSchemePanchayatLookupQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when tenant and block id exist', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useBlockSchemePanchayatLookupQuery({
        tenantId: 3,
        hierarchyType: 'LGD',
        blockId: 40,
      })
    )

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.blockSchemePanchayatLookup(3, 'LGD', 40),
        enabled: true,
      })
    )
  })

  it('disables when blockId is missing', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useBlockSchemePanchayatLookupQuery({
        tenantId: 3,
        hierarchyType: 'LGD',
      })
    )

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('honors caller-provided enabled: false when tenant and block exist', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useBlockSchemePanchayatLookupQuery({
        tenantId: 3,
        hierarchyType: 'LGD',
        blockId: 40,
        enabled: false,
      })
    )

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.blockSchemePanchayatLookup(3, 'LGD', 40),
        enabled: false,
      })
    )
  })

  it('queryFn throws when tenantId or blockId missing from options', async () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useBlockSchemePanchayatLookupQuery({
        hierarchyType: 'LGD',
      })
    )
    const { queryFn } = mockedUseQuery.mock.calls[0][0] as { queryFn: () => Promise<unknown> }
    await expect(queryFn()).rejects.toThrow(/tenantId and blockId/)
  })

  it('queryFn builds lookup from gram panchayats and nested villages', async () => {
    mockedUseQuery.mockReturnValue({})
    mockedGetChildren
      .mockResolvedValueOnce({
        data: [{ id: 10, title: ' GP 1 ' }, { title: 'No id' }],
      } satisfies TenantChildLocationsResponse)
      .mockResolvedValueOnce({
        data: [{ id: 101, title: 'V1' }],
      } satisfies TenantChildLocationsResponse)

    renderHook(() =>
      useBlockSchemePanchayatLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        blockId: 5,
        tenantCode: 'TN',
      })
    )

    const { queryFn } = mockedUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<{ idLookup: Record<number, string> }>
    }
    const lookup = await queryFn()

    expect(mockedGetChildren).toHaveBeenCalledWith({
      tenantId: 1,
      hierarchyType: 'LGD',
      parentId: 5,
      tenantCode: 'TN',
    })
    expect(mockedGetChildren).toHaveBeenCalledWith({
      tenantId: 1,
      hierarchyType: 'LGD',
      parentId: 10,
      tenantCode: 'TN',
    })
    expect(lookup.idLookup[101]).toBe('GP 1')
  })
})

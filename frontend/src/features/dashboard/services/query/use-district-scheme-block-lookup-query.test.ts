import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach, beforeEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { locationSearchQueryKeys } from './location-search-query-keys'
import { useDistrictSchemeBlockLookupQuery } from './use-district-scheme-block-lookup-query'
import { dashboardApi } from '../api/dashboard-api'
import type { TenantChildLocationsResponse } from '../api/dashboard-api'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

jest.mock('../api/dashboard-api', () => ({
  dashboardApi: { getTenantChildLocations: jest.fn() },
}))

const mockedUseQuery = useQuery as jest.Mock
const mockedGetChildren = jest.mocked(dashboardApi.getTenantChildLocations)

describe('useDistrictSchemeBlockLookupQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables only when target LGD ids are non-empty', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [101, 102],
      })
    )

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.districtSchemeBlockLookup(1, 'LGD', 7, '101,102'),
        enabled: true,
      })
    )
  })

  it('disables when targetLgdIds is empty', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [],
      })
    )

    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('normalizes target LGD ids to a stable comma-separated query key segment', () => {
    mockedUseQuery.mockReturnValue({})
    const expectedKey = locationSearchQueryKeys.districtSchemeBlockLookup(1, 'LGD', 7, '101,102')

    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [102, 101, 101],
      })
    )
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expectedKey, enabled: true })
    )
    mockedUseQuery.mockClear()

    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [101, '102'],
      })
    )
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expectedKey, enabled: true })
    )
  })

  it('disables when tenantId is missing', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [101, 102],
      })
    )

    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('disables when districtId is missing', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        targetLgdIds: [101, 102],
      })
    )

    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('honors caller-provided enabled: false', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [101, 102],
        enabled: false,
      })
    )

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.districtSchemeBlockLookup(1, 'LGD', 7, '101,102'),
        enabled: false,
      })
    )
  })

  it('queryFn throws when tenantId or districtId missing', async () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        hierarchyType: 'LGD',
        districtId: 1,
        targetLgdIds: [1],
      })
    )
    const { queryFn } = mockedUseQuery.mock.calls[0][0] as { queryFn: () => Promise<unknown> }
    await expect(queryFn()).rejects.toThrow(/tenantId and districtId/)
  })

  it('queryFn returns empty lookup when normalized targets empty', async () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [0, -1, ''],
      })
    )
    const { queryFn } = mockedUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<{ idLookup: Record<string, string> }>
    }
    const lookup = await queryFn()
    expect(lookup.idLookup).toEqual({})
    expect(mockedGetChildren).not.toHaveBeenCalled()
  })

  it('queryFn resolves targets via block and nested locations', async () => {
    mockedUseQuery.mockReturnValue({})
    mockedGetChildren
      .mockResolvedValueOnce({
        data: [{ id: 20, title: ' B1 ' }],
      } satisfies TenantChildLocationsResponse)
      .mockResolvedValueOnce({
        data: [{ id: 101, title: 'GP' }],
      } satisfies TenantChildLocationsResponse)
      .mockResolvedValueOnce({
        data: [{ id: 101, title: 'V' }],
      } satisfies TenantChildLocationsResponse)

    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [101],
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
      parentId: 7,
      tenantCode: 'TN',
    })
    expect(lookup.idLookup[101]).toBe('B1')
  })
})

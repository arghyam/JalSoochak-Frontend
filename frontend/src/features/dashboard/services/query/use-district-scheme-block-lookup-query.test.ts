import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { locationSearchQueryKeys } from './location-search-query-keys'
import { useDistrictSchemeBlockLookupQuery } from './use-district-scheme-block-lookup-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

describe('useDistrictSchemeBlockLookupQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables only when target LGD ids are non-empty', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [101, 102],
      })
    )

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.districtSchemeBlockLookup(1, 'LGD', 7, '101,102'),
        enabled: true,
      })
    )
  })

  it('disables when targetLgdIds is empty', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useDistrictSchemeBlockLookupQuery({
        tenantId: 1,
        hierarchyType: 'LGD',
        districtId: 7,
        targetLgdIds: [],
      })
    )

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

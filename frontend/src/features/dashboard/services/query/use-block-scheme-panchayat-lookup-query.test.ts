import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { locationSearchQueryKeys } from './location-search-query-keys'
import { useBlockSchemePanchayatLookupQuery } from './use-block-scheme-panchayat-lookup-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

describe('useBlockSchemePanchayatLookupQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when tenant and block id exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
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
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useBlockSchemePanchayatLookupQuery({
        tenantId: 3,
        hierarchyType: 'LGD',
      })
    )

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

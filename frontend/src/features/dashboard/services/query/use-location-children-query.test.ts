import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { locationSearchQueryKeys } from './location-search-query-keys'
import { useLocationChildrenQuery } from './use-location-children-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

describe('useLocationChildrenQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('includes parent id in query key', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useLocationChildrenQuery({
        tenantId: 2,
        hierarchyType: 'LGD',
        parentId: 99,
      })
    )

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.children(2, 'LGD', 99),
        enabled: true,
      })
    )
  })

  it('disables without tenantId', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useLocationChildrenQuery({ hierarchyType: 'LGD' }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

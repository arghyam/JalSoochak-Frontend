import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { locationSearchQueryKeys } from './location-search-query-keys'
import { useLocationHierarchyQuery } from './use-location-hierarchy-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

describe('useLocationHierarchyQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when tenantId is defined', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useLocationHierarchyQuery({ tenantId: 5, hierarchyType: 'LGD', tenantCode: 'MH' })
    )

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.hierarchy(5, 'LGD'),
        enabled: true,
      })
    )
  })

  it('disables when tenantId is missing', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useLocationHierarchyQuery({ hierarchyType: 'LGD' }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('honors explicit enabled: false when tenantId is defined', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useLocationHierarchyQuery({
        tenantId: 5,
        hierarchyType: 'LGD',
        tenantCode: 'MH',
        enabled: false,
      })
    )

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.hierarchy(5, 'LGD'),
        enabled: false,
      })
    )
  })
})

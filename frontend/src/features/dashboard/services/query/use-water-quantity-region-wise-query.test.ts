import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useWaterQuantityRegionWiseQuery } from './use-water-quantity-region-wise-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  tenantId: 1,
  parentLgdId: 2,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
}

describe('useWaterQuantityRegionWiseQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useWaterQuantityRegionWiseQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.waterQuantityRegionWise(params),
        enabled: true,
      })
    )
  })
})

import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useAverageWaterSupplyPerRegionQuery } from './use-average-water-supply-per-region-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  tenantId: 3,
  parentDepartmentId: 9,
  startDate: '2026-02-01',
  endDate: '2026-02-28',
}

describe('useAverageWaterSupplyPerRegionQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('wires query key and enablement from params', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useAverageWaterSupplyPerRegionQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.averageWaterSupplyPerRegion(params),
        enabled: true,
      })
    )
  })

  it('respects enabled: false override', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useAverageWaterSupplyPerRegionQuery({ params, enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

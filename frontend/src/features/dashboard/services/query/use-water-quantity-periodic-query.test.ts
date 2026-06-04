import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useWaterQuantityPeriodicQuery } from './use-water-quantity-periodic-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  scale: 'month' as const,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  lgdId: 5,
}

describe('useWaterQuantityPeriodicQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('exposes isAwaitingParams when enabled but params missing', () => {
    ;(useQuery as jest.Mock).mockReturnValue({ status: 'pending' })
    const { result } = renderHook(() => useWaterQuantityPeriodicQuery({ params: null }))

    expect(result.current.isAwaitingParams).toBe(true)
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.waterQuantityPeriodic(null),
        enabled: false,
      })
    )
  })

  it('sets isAwaitingParams false when params are provided', () => {
    ;(useQuery as jest.Mock).mockReturnValue({ status: 'success' })
    const { result } = renderHook(() => useWaterQuantityPeriodicQuery({ params }))

    expect(result.current.isAwaitingParams).toBe(false)
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.waterQuantityPeriodic(params),
        enabled: true,
      })
    )
  })
})

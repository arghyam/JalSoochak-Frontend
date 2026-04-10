import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useSchemePerformanceQuery } from './use-scheme-performance-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  parentLgdId: 3,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
}

describe('useSchemePerformanceQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useSchemePerformanceQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.schemePerformance(params),
        enabled: true,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useSchemePerformanceQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.schemePerformance(null),
        enabled: false,
      })
    )
  })

  it('honors explicit enabled: false when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useSchemePerformanceQuery({ params, enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.schemePerformance(params),
        enabled: false,
      })
    )
  })
})

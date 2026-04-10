import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useNationalDashboardBoundariesQuery } from './use-national-dashboard-boundaries-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

describe('useNationalDashboardBoundariesQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('uses national dashboard boundaries key and defaults enabled true', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useNationalDashboardBoundariesQuery())

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.nationalDashboardBoundaries(),
        enabled: true,
        retry: false,
      })
    )
  })

  it('allows disabling the query', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useNationalDashboardBoundariesQuery({ enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

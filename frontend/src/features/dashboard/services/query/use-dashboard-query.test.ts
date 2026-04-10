import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useDashboardQuery } from './use-dashboard-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

describe('useDashboardQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('registers dashboard data query with structured key', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useDashboardQuery('state', 'MH'))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.data('state', 'MH'),
      })
    )
  })
})

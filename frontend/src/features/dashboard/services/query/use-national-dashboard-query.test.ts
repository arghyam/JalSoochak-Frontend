import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useNationalDashboardQuery } from './use-national-dashboard-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = { startDate: '2026-01-01', endDate: '2026-01-31' }

describe('useNationalDashboardQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useNationalDashboardQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.nationalDashboard(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useNationalDashboardQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useAverageSchemeRegularityQuery } from './use-average-scheme-regularity-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  tenantId: 1,
  parentLgdId: 2,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
}

describe('useAverageSchemeRegularityQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables query when params are provided', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useAverageSchemeRegularityQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.averageSchemeRegularity(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables query when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useAverageSchemeRegularityQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

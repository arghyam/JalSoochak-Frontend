import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useContinuousSchemesQuery } from './use-continuous-schemes-query'

jest.mock('@tanstack/react-query', () => ({
  ...(jest.requireActual('@tanstack/react-query') as Record<string, unknown>),
  useQuery: jest.fn(),
}))

const params = {
  tenantId: 17,
  lgdId: 1,
  startDate: '2026-03-01',
  endDate: '2026-03-05',
}

describe('useContinuousSchemesQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables query when params are provided', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useContinuousSchemesQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.continuousSchemes(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables query when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useContinuousSchemesQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

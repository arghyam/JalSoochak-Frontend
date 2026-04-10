import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useNationalSchemeRegularityPeriodicQuery } from './use-national-scheme-regularity-periodic-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = { scale: 'month' as const, startDate: '2026-01-01', endDate: '2026-03-31' }

describe('useNationalSchemeRegularityPeriodicQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('wires national periodic key', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useNationalSchemeRegularityPeriodicQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.nationalSchemeRegularityPeriodic(params),
        enabled: true,
      })
    )
  })
})

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

  it('wires national periodic key when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useNationalSchemeRegularityPeriodicQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.nationalSchemeRegularityPeriodic(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useNationalSchemeRegularityPeriodicQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.nationalSchemeRegularityPeriodic(null),
        enabled: false,
        retry: false,
      })
    )
  })

  it('disables when params are undefined', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useNationalSchemeRegularityPeriodicQuery({
        // @ts-expect-error callers may omit params; Boolean(undefined) disables the query
        params: undefined,
      })
    )

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.nationalSchemeRegularityPeriodic(null),
        enabled: false,
        retry: false,
      })
    )
  })

  it('disables when explicit enabled is false', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useNationalSchemeRegularityPeriodicQuery({ params, enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.nationalSchemeRegularityPeriodic(params),
        enabled: false,
        retry: false,
      })
    )
  })
})

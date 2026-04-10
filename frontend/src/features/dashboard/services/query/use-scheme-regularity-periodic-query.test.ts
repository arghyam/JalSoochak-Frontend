import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useSchemeRegularityPeriodicQuery } from './use-scheme-regularity-periodic-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  tenantId: 1,
  scale: 'week' as const,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
}

describe('useSchemeRegularityPeriodicQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useSchemeRegularityPeriodicQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.schemeRegularityPeriodic(params),
        enabled: true,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useSchemeRegularityPeriodicQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.schemeRegularityPeriodic(null),
        enabled: false,
      })
    )
  })

  it('honors explicit enabled: false when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useSchemeRegularityPeriodicQuery({ params, enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.schemeRegularityPeriodic(params),
        enabled: false,
      })
    )
  })
})

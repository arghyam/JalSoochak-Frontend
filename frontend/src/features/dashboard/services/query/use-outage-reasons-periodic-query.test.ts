import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useOutageReasonsPeriodicQuery } from './use-outage-reasons-periodic-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  tenantId: 1,
  lgdId: 2,
  scale: 'week' as const,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
}

describe('useOutageReasonsPeriodicQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('uses outage periodic query key', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useOutageReasonsPeriodicQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.outageReasonsPeriodic(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useOutageReasonsPeriodicQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.outageReasonsPeriodic(null),
        enabled: false,
        retry: false,
      })
    )
  })

  it('disables when explicit enabled is false', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useOutageReasonsPeriodicQuery({ params, enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.outageReasonsPeriodic(params),
        enabled: false,
        retry: false,
      })
    )
  })
})

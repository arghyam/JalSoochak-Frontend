import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'

const mockUseQuery = jest.fn()
const mockIsAnalyticsEnabled = jest.fn(() => false)
const mockRegisterVisitAndGetCount = jest.fn(async () => 0)

jest.mock('@tanstack/react-query', () => ({
  ...(jest.requireActual('@tanstack/react-query') as object),
  useQuery: (options: unknown) => mockUseQuery(options),
}))

jest.mock('@/config/server-config', () => ({
  isAnalyticsEnabled: () => mockIsAnalyticsEnabled(),
}))

jest.mock('./site-stats-api', () => ({
  registerVisitAndGetCount: () => mockRegisterVisitAndGetCount(),
}))

import { siteStatsQueryKeys, useVisitorCountQuery } from './use-visitor-count-query'

beforeEach(() => {
  jest.clearAllMocks()
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false })
})

describe('siteStatsQueryKeys', () => {
  it('builds a structured array key', () => {
    expect(siteStatsQueryKeys.visitors()).toEqual(['site-stats', 'visitors'])
  })
})

describe('useVisitorCountQuery', () => {
  it('is disabled when analytics is not configured, so no request is issued', () => {
    mockIsAnalyticsEnabled.mockReturnValue(false)

    renderHook(() => useVisitorCountQuery())

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(mockRegisterVisitAndGetCount).not.toHaveBeenCalled()
  })

  it('is enabled when analytics is configured', () => {
    mockIsAnalyticsEnabled.mockReturnValue(true)

    renderHook(() => useVisitorCountQuery())

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('uses the structured key and never refetches a one-shot vanity number', () => {
    renderHook(() => useVisitorCountQuery())

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['site-stats', 'visitors'],
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      })
    )
  })

  it('counts the visit through the service when the query runs', async () => {
    renderHook(() => useVisitorCountQuery())

    const { queryFn } = mockUseQuery.mock.calls[0][0] as { queryFn: () => Promise<number> }
    await queryFn()

    expect(mockRegisterVisitAndGetCount).toHaveBeenCalledTimes(1)
  })
})

import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useReadingSubmissionRateQuery } from './use-reading-submission-rate-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  tenantId: 4,
  parentLgdId: 8,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
}

describe('useReadingSubmissionRateQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useReadingSubmissionRateQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.readingSubmissionRate(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables when params missing', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useReadingSubmissionRateQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.readingSubmissionRate(null),
        enabled: false,
        retry: false,
      })
    )
  })
})

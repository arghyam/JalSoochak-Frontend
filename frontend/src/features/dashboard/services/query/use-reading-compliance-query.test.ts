import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useReadingComplianceQuery } from './use-reading-compliance-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = {
  tenant_code: 'MH',
  scheme_id: 9,
  page: 0,
  size: 20,
}

describe('useReadingComplianceQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params are set', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useReadingComplianceQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.readingCompliance(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useReadingComplianceQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

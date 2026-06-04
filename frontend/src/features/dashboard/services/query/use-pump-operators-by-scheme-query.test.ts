import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { usePumpOperatorsBySchemeQuery } from './use-pump-operators-by-scheme-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = { tenant_code: 'MH', scheme_id: 5 }

describe('usePumpOperatorsBySchemeQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params are present', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => usePumpOperatorsBySchemeQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.pumpOperatorsByScheme(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => usePumpOperatorsBySchemeQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

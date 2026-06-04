import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { usePumpOperatorDetailsQuery } from './use-pump-operator-details-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const params = { pumpOperatorId: 12, tenant_code: 'MH' }

describe('usePumpOperatorDetailsQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params are present', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => usePumpOperatorDetailsQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.pumpOperatorDetails(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('disables when params are null', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => usePumpOperatorDetailsQuery({ params: null }))

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('honors explicit enabled: false when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => usePumpOperatorDetailsQuery({ params, enabled: false }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.pumpOperatorDetails(params),
        enabled: false,
      })
    )
  })
})

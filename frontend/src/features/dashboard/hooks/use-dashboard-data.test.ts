import { renderHook } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { useDashboardData } from './use-dashboard-data'
import { useDashboardQuery } from '../services/query/use-dashboard-query'

jest.mock('../services/query/use-dashboard-query', () => ({
  useDashboardQuery: jest.fn(() => ({ status: 'pending' })),
}))

describe('useDashboardData', () => {
  it('delegates to useDashboardQuery with level and entity id', () => {
    ;(useDashboardQuery as jest.Mock).mockReturnValue({ data: undefined })
    const { result } = renderHook(() => useDashboardData('district', 'd-1'))

    expect(useDashboardQuery).toHaveBeenCalledWith('district', 'd-1')
    expect(result.current).toEqual({ data: undefined })
  })
})

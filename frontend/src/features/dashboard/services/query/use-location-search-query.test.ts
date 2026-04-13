import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { useLocationSearchQuery } from './use-location-search-query'
import { locationSearchQueryKeys } from './location-search-query-keys'
import { locationSearchApi } from '../api/location-search-api'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

jest.mock('../api/location-search-api', () => ({
  locationSearchApi: { getStatesUts: jest.fn() },
}))

const mockedUseQuery = useQuery as jest.Mock
const mockedGetStatesUts = jest.mocked(locationSearchApi.getStatesUts)

describe('useLocationSearchQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('wires query key and defaults enabled true', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useLocationSearchQuery())
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: locationSearchQueryKeys.statesUts(),
        enabled: true,
        queryFn: expect.any(Function),
      })
    )
  })

  it('respects enabled: false', () => {
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useLocationSearchQuery({ enabled: false }))
    expect(mockedUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('queryFn delegates to locationSearchApi.getStatesUts', async () => {
    mockedGetStatesUts.mockResolvedValueOnce({ totalStatesCount: 0, states: [] })
    mockedUseQuery.mockReturnValue({})
    renderHook(() => useLocationSearchQuery())
    const { queryFn } = mockedUseQuery.mock.calls[0][0] as { queryFn: () => Promise<unknown> }
    await queryFn()
    expect(mockedGetStatesUts).toHaveBeenCalledTimes(1)
  })
})

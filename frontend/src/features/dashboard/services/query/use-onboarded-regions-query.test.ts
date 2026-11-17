import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import { dashboardQueryKeys } from './dashboard-query-keys'
import { useOnboardedRegionsQuery } from './use-onboarded-regions-query'

jest.mock('@tanstack/react-query', () => ({
  ...(jest.requireActual('@tanstack/react-query') as Record<string, unknown>),
  useQuery: jest.fn(),
}))

jest.mock('../api/dashboard-api', () => ({
  dashboardApi: {
    getOnboardedRegions: jest.fn(),
  },
}))

type CapturedQueryOptions = {
  queryKey: unknown
  queryFn: () => unknown
  enabled: boolean
  retry: unknown
}

const params = { tenantId: 3, parentLgdId: 1 }

const lastQueryOptions = () =>
  (useQuery as jest.Mock).mock.calls.at(-1)?.[0] as CapturedQueryOptions

describe('useOnboardedRegionsQuery', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('enables when params exist and does not retry', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useOnboardedRegionsQuery({ params }))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.onboardedRegions(params),
        enabled: true,
        retry: false,
      })
    )
  })

  it('fetches the onboarded regions for the params', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useOnboardedRegionsQuery({ params }))

    lastQueryOptions().queryFn()

    expect(dashboardApi.getOnboardedRegions).toHaveBeenCalledWith(params)
  })

  it('honors explicit enabled: false when params exist', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useOnboardedRegionsQuery({ params, enabled: false }))

    expect(lastQueryOptions().enabled).toBe(false)
  })

  it('disables when params are null, and refuses to fetch without them', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useOnboardedRegionsQuery({ params: null }))

    expect(lastQueryOptions()).toEqual(
      expect.objectContaining({
        queryKey: dashboardQueryKeys.onboardedRegions(null),
        enabled: false,
      })
    )
    expect(() => lastQueryOptions().queryFn()).toThrow('onboarded regions params are required')
    expect(dashboardApi.getOnboardedRegions).not.toHaveBeenCalled()
  })

  it('stops exposing the last onboarded list once a refetch fails, keeping the error', async () => {
    const actualQuery =
      jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
    ;(useQuery as jest.Mock).mockImplementation(
      actualQuery.useQuery as (...args: unknown[]) => unknown
    )
    const response = {
      tenantId: 3,
      parentLgdId: 1,
      parentDepartmentId: null,
      phasedRollout: true,
      onboardedChildIds: [12],
    }
    const refetchError = new Error('refetch failed')
    ;(dashboardApi.getOnboardedRegions as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve(response))
      .mockImplementationOnce(() => Promise.reject(refetchError))
    const queryClient = new QueryClient()
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useOnboardedRegionsQuery({ params }), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual(response))

    await act(async () => {
      await queryClient.refetchQueries({ queryKey: dashboardQueryKeys.onboardedRegions(params) })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBe(refetchError)
    queryClient.clear()
  })
})

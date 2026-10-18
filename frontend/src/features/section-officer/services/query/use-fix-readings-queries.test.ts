import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { fixReadingsApi, UpdateFinalReadingError } from '../api/fix-readings-api'
import {
  useUpdateFinalReadingMutation,
  useYesterdayFinalReadingsQuery,
} from './use-fix-readings-queries'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

const mockSetSessionExpired = jest.fn()

jest.mock('@/app/store/auth-store', () => {
  const state = {
    user: { tenantCode: 'AS' },
    setSessionExpired: () => mockSetSessionExpired(),
  }
  return {
    useAuthStore: Object.assign((selector: (s: typeof state) => unknown) => selector(state), {
      getState: () => state,
    }),
  }
})

jest.mock('../api/fix-readings-api', () => {
  const actual =
    jest.requireActual<typeof import('../api/fix-readings-api')>('../api/fix-readings-api')
  return {
    UpdateFinalReadingError: actual.UpdateFinalReadingError,
    fixReadingsApi: {
      searchSchemes: jest.fn(),
      updateFinalReading: jest.fn(),
    },
  }
})

const mockSearchSchemes = fixReadingsApi.searchSchemes as jest.MockedFunction<
  typeof fixReadingsApi.searchSchemes
>
const mockUpdateFinalReading = fixReadingsApi.updateFinalReading as jest.MockedFunction<
  typeof fixReadingsApi.updateFinalReading
>

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function newQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useYesterdayFinalReadingsQuery', () => {
  it('uses the tenant-scoped query key and trimmed scheme name', async () => {
    mockSearchSchemes.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    const queryClient = newQueryClient()

    const { result } = renderHook(() => useYesterdayFinalReadingsQuery(' S26 '), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSearchSchemes).toHaveBeenCalledWith('S26', 'AS')
    expect(
      queryClient.getQueryData(sectionOfficerQueryKeys.yesterdayFinalReadings('AS', 'S26'))
    ).toBeDefined()
  })

  it('is disabled for an empty search', () => {
    renderHook(() => useYesterdayFinalReadingsQuery('  '), {
      wrapper: createWrapper(newQueryClient()),
    })

    expect(mockSearchSchemes).not.toHaveBeenCalled()
  })
})

describe('useUpdateFinalReadingMutation', () => {
  it('calls the API with schemeId and reading only', async () => {
    mockUpdateFinalReading.mockResolvedValueOnce({
      success: true,
      schemeId: 28442,
      readingDate: '2026-06-02',
      finalReading: 300500,
      message: 'OK',
    })
    const { result } = renderHook(() => useUpdateFinalReadingMutation(), {
      wrapper: createWrapper(newQueryClient()),
    })

    await act(async () => {
      await result.current.mutateAsync({ schemeId: 28442, payload: { reading: 300500 } })
    })

    expect(mockUpdateFinalReading).toHaveBeenCalledWith(28442, { reading: 300500 })
    expect(mockSetSessionExpired).not.toHaveBeenCalled()
  })

  it('expires the session when the API reports unauthorized', async () => {
    mockUpdateFinalReading.mockRejectedValueOnce(
      new UpdateFinalReadingError('unauthorized', 'Request failed with status code 401')
    )
    const { result } = renderHook(() => useUpdateFinalReadingMutation(), {
      wrapper: createWrapper(newQueryClient()),
    })

    act(() => {
      result.current.mutate({ schemeId: 28442, payload: { reading: 100 } })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockSetSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('does not expire the session on forbidden', async () => {
    mockUpdateFinalReading.mockRejectedValueOnce(
      new UpdateFinalReadingError('forbidden', 'Request failed with status code 403')
    )
    const { result } = renderHook(() => useUpdateFinalReadingMutation(), {
      wrapper: createWrapper(newQueryClient()),
    })

    act(() => {
      result.current.mutate({ schemeId: 28442, payload: { reading: 100 } })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockSetSessionExpired).not.toHaveBeenCalled()
  })
})

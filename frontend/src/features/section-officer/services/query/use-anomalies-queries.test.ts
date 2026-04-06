import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { anomaliesApi } from '../api/anomalies-api'
import { useAnomaliesListQuery } from './use-anomalies-queries'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

jest.mock('../api/anomalies-api', () => ({
  anomaliesApi: {
    getAnomaliesList: jest.fn(),
  },
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn((selector: (s: { user: { id: string; tenantId: string } }) => unknown) =>
    selector({ user: { id: '2', tenantId: '50' } })
  ),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const MOCK_RESPONSE = {
  success: true,
  page: 1,
  limit: 10,
  anomalies: [
    {
      id: 9,
      uuid: 'issue-report-906e61be',
      type: '6',
      userId: 13,
      schemeId: 1,
      tenantId: 50,
      aiReading: null,
      aiConfidencePercentage: null,
      overriddenReading: null,
      retries: 0,
      previousReading: null,
      previousReadingDate: null,
      consecutiveDaysMissed: 0,
      reason: 'No Water Supply',
      remarks: null,
      correlationId: 'issue-report-906e61be',
      resolvedBy: null,
      resolvedAt: null,
      deletedAt: null,
      deletedBy: null,
      createdAt: '2026-04-01T18:52:17.610897Z',
      updatedAt: '2026-04-01T18:52:17.610897Z',
      scheme_name: 'Test Scheme',
      status: 'In-Progress',
    },
  ],
  total_count: 1,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('sectionOfficerQueryKeys — anomalies keys', () => {
  it('generates a stable anomalies list key', () => {
    expect(sectionOfficerQueryKeys.anomaliesList('2', '50', 1, 10, '', '', '', '')).toEqual([
      'section-officer',
      'anomalies',
      '2',
      '50',
      1,
      10,
      '',
      '',
      '',
      '',
    ])
  })
})

describe('useAnomaliesListQuery', () => {
  it('fetches and returns anomalies list on success', async () => {
    ;(
      anomaliesApi.getAnomaliesList as jest.MockedFunction<typeof anomaliesApi.getAnomaliesList>
    ).mockResolvedValue(MOCK_RESPONSE)

    const { result } = renderHook(() => useAnomaliesListQuery(1, 10, '', '', '', ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_RESPONSE)
    expect(anomaliesApi.getAnomaliesList).toHaveBeenCalledWith({
      userId: '2',
      tenantId: '50',
      page: 1,
      limit: 10,
      schemeName: undefined,
      status: undefined,
      startDate: undefined,
      endDate: undefined,
    })
  })

  it('passes optional filters when provided', async () => {
    ;(
      anomaliesApi.getAnomaliesList as jest.MockedFunction<typeof anomaliesApi.getAnomaliesList>
    ).mockResolvedValue(MOCK_RESPONSE)

    const { result } = renderHook(
      () => useAnomaliesListQuery(1, 10, 'Swajal', 'Pending', '2026-01-01', '2026-03-31'),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(anomaliesApi.getAnomaliesList).toHaveBeenCalledWith(
      expect.objectContaining({
        schemeName: 'Swajal',
        status: 'Pending',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      })
    )
  })

  it('surfaces error state on fetch failure', async () => {
    ;(
      anomaliesApi.getAnomaliesList as jest.MockedFunction<typeof anomaliesApi.getAnomaliesList>
    ).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAnomaliesListQuery(1, 10, '', '', '', ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { escalationsApi } from '../api/escalations-api'
import { useEscalationsListQuery } from './use-escalations-queries'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

jest.mock('../api/escalations-api', () => ({
  escalationsApi: {
    getEscalationsList: jest.fn(),
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
  escalations: [
    {
      id: 900127,
      tenantId: 50,
      schemeId: 1,
      escalationType: '9',
      message: 'pump operator has not submitted for 2 consecutive days',
      correlationId: '2b540432-bb88-3f8c-b254-f0517880b0a1',
      userId: 2,
      remark: null,
      createdAt: '2026-04-01T08:10:00.046812',
      updatedAt: '2026-04-01T08:10:00.046812',
      scheme_name: 'Test Scheme',
      resolution_status: 'In-Progress',
    },
  ],
  total_count: 1,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('sectionOfficerQueryKeys — escalations keys', () => {
  it('generates a stable escalations list key', () => {
    expect(sectionOfficerQueryKeys.escalationsList('2', '50', 1, 10, '', '', '', '')).toEqual([
      'section-officer',
      'escalations',
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

describe('useEscalationsListQuery', () => {
  it('fetches and returns escalations list on success', async () => {
    ;(
      escalationsApi.getEscalationsList as jest.MockedFunction<
        typeof escalationsApi.getEscalationsList
      >
    ).mockResolvedValue(MOCK_RESPONSE)

    const { result } = renderHook(() => useEscalationsListQuery(1, 10, '', '', '', ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_RESPONSE)
    expect(escalationsApi.getEscalationsList).toHaveBeenCalledWith({
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
      escalationsApi.getEscalationsList as jest.MockedFunction<
        typeof escalationsApi.getEscalationsList
      >
    ).mockResolvedValue(MOCK_RESPONSE)

    const { result } = renderHook(
      () => useEscalationsListQuery(1, 10, 'Swajal', 'Resolved', '2026-01-01', '2026-03-31'),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(escalationsApi.getEscalationsList).toHaveBeenCalledWith(
      expect.objectContaining({
        schemeName: 'Swajal',
        status: 'Resolved',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      })
    )
  })

  it('surfaces error state on fetch failure', async () => {
    ;(
      escalationsApi.getEscalationsList as jest.MockedFunction<
        typeof escalationsApi.getEscalationsList
      >
    ).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useEscalationsListQuery(1, 10, '', '', '', ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { overviewApi } from '../api/overview-api'
import {
  useSchemesCountQuery,
  useOutageReasonsQuery,
  useNonSubmissionReasonsQuery,
  useSubmissionStatusQuery,
  useDashboardStatsQuery,
} from './use-overview-queries'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

jest.mock('../api/overview-api', () => ({
  overviewApi: {
    getSchemesCount: jest.fn(),
    getOutageReasons: jest.fn(),
    getNonSubmissionReasons: jest.fn(),
    getSubmissionStatus: jest.fn(),
    getDashboardStats: jest.fn(),
  },
}))

const MOCK_PERSON_ID = '15'
const MOCK_TENANT_CODE = 'nl'
const MOCK_TENANT_ID = 'tenant-123'
const MOCK_USER_ID = 'user-456'

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn(
    (
      selector: (s: {
        user: { personId: string; tenantCode: string; tenantId: string; id: string }
      }) => unknown
    ) =>
      selector({
        user: {
          personId: MOCK_PERSON_ID,
          tenantCode: MOCK_TENANT_CODE,
          tenantId: MOCK_TENANT_ID,
          id: MOCK_USER_ID,
        },
      })
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

beforeEach(() => {
  jest.clearAllMocks()
})

// ── Query key shape tests ──────────────────────────────────────────────────────

describe('sectionOfficerQueryKeys — overview keys', () => {
  it('generates a stable schemesCount key', () => {
    expect(sectionOfficerQueryKeys.schemesCount('15', 'nl')).toEqual([
      'section-officer',
      'schemes-count',
      '15',
      'nl',
    ])
  })

  it('generates a stable outageReasons key', () => {
    expect(sectionOfficerQueryKeys.outageReasons('2026-01-01', '2026-01-31')).toEqual([
      'section-officer',
      'outage-reasons',
      '2026-01-01',
      '2026-01-31',
    ])
  })

  it('generates a stable nonSubmissionReasons key', () => {
    expect(sectionOfficerQueryKeys.nonSubmissionReasons('2026-01-01', '2026-01-31')).toEqual([
      'section-officer',
      'non-submission-reasons',
      '2026-01-01',
      '2026-01-31',
    ])
  })

  it('generates a stable submissionStatus key', () => {
    expect(sectionOfficerQueryKeys.submissionStatus('2026-01-01', '2026-01-31')).toEqual([
      'section-officer',
      'submission-status',
      '2026-01-01',
      '2026-01-31',
    ])
  })

  it('generates a stable dashboardStats key with dates', () => {
    expect(
      sectionOfficerQueryKeys.dashboardStats(
        MOCK_TENANT_ID,
        MOCK_USER_ID,
        '2026-01-01',
        '2026-01-31'
      )
    ).toEqual([
      'section-officer',
      'dashboard-stats',
      MOCK_TENANT_ID,
      MOCK_USER_ID,
      '2026-01-01',
      '2026-01-31',
    ])
  })
})

// ── useSchemesCountQuery ───────────────────────────────────────────────────────

describe('useSchemesCountQuery', () => {
  it('fetches schemes count and returns data', async () => {
    ;(
      overviewApi.getSchemesCount as jest.MockedFunction<typeof overviewApi.getSchemesCount>
    ).mockResolvedValue({ schemeCount: 5 })

    const { result } = renderHook(() => useSchemesCountQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(overviewApi.getSchemesCount).toHaveBeenCalledWith(MOCK_PERSON_ID, MOCK_TENANT_CODE)
    expect(result.current.data).toEqual({ schemeCount: 5 })
  })

  it('surfaces error state on fetch failure', async () => {
    ;(
      overviewApi.getSchemesCount as jest.MockedFunction<typeof overviewApi.getSchemesCount>
    ).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSchemesCountQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ── useOutageReasonsQuery ──────────────────────────────────────────────────────

const MOCK_OUTAGE_DATA = {
  pieData: [
    {
      label: '',
      reasons: { draught: 1 },
      electricityFailure: 0,
      pipelineLeak: 0,
      pumpFailure: 0,
      valveIssue: 0,
      sourceDrying: 0,
    },
  ],
  histogramData: [
    {
      label: '2026-01-01',
      reasons: { draught: 1 },
      electricityFailure: 0,
      pipelineLeak: 0,
      pumpFailure: 0,
      valveIssue: 0,
      sourceDrying: 0,
    },
  ],
}

describe('useOutageReasonsQuery', () => {
  it('fetches outage reasons and returns mapped data', async () => {
    ;(
      overviewApi.getOutageReasons as jest.MockedFunction<typeof overviewApi.getOutageReasons>
    ).mockResolvedValue(MOCK_OUTAGE_DATA)

    const { result } = renderHook(() => useOutageReasonsQuery('2026-01-01', '2026-01-31'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(overviewApi.getOutageReasons).toHaveBeenCalledWith('2026-01-01', '2026-01-31')
    expect(result.current.data).toEqual(MOCK_OUTAGE_DATA)
  })

  it('is disabled when dates are empty', async () => {
    const { result } = renderHook(() => useOutageReasonsQuery('', ''), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(overviewApi.getOutageReasons).not.toHaveBeenCalled()
  })
})

// ── useNonSubmissionReasonsQuery ───────────────────────────────────────────────

describe('useNonSubmissionReasonsQuery', () => {
  it('fetches non-submission reasons and returns data', async () => {
    ;(
      overviewApi.getNonSubmissionReasons as jest.MockedFunction<
        typeof overviewApi.getNonSubmissionReasons
      >
    ).mockResolvedValue({ pieData: [], histogramData: [] })

    const { result } = renderHook(() => useNonSubmissionReasonsQuery('2026-01-01', '2026-01-31'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(overviewApi.getNonSubmissionReasons).toHaveBeenCalledWith('2026-01-01', '2026-01-31')
  })

  it('is disabled when dates are empty', async () => {
    const { result } = renderHook(() => useNonSubmissionReasonsQuery('', ''), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(overviewApi.getNonSubmissionReasons).not.toHaveBeenCalled()
  })
})

// ── useSubmissionStatusQuery ───────────────────────────────────────────────────

describe('useSubmissionStatusQuery', () => {
  it('fetches submission status and returns data', async () => {
    ;(
      overviewApi.getSubmissionStatus as jest.MockedFunction<typeof overviewApi.getSubmissionStatus>
    ).mockResolvedValue({ pieData: [], barData: [] })

    const { result } = renderHook(() => useSubmissionStatusQuery('2026-01-01', '2026-01-31'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(overviewApi.getSubmissionStatus).toHaveBeenCalledWith('2026-01-01', '2026-01-31')
  })

  it('is disabled when dates are empty', async () => {
    const { result } = renderHook(() => useSubmissionStatusQuery('', ''), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(overviewApi.getSubmissionStatus).not.toHaveBeenCalled()
  })
})

// ── useDashboardStatsQuery ────────────────────────────────────────────────────

describe('useDashboardStatsQuery', () => {
  it('fetches dashboard stats with date parameters', async () => {
    ;(
      overviewApi.getDashboardStats as jest.MockedFunction<typeof overviewApi.getDashboardStats>
    ).mockResolvedValue({
      totalWaterSupplied: 100,
      totalAnomalyCount: 5,
      totalEscalationCount: 2,
    })

    const { result } = renderHook(() => useDashboardStatsQuery('2026-01-01', '2026-01-31'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(overviewApi.getDashboardStats).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_USER_ID,
      '2026-01-01',
      '2026-01-31'
    )
    expect(result.current.data).toEqual({
      totalWaterSupplied: 100,
      totalAnomalyCount: 5,
      totalEscalationCount: 2,
    })
  })

  it('is disabled when dates are empty', async () => {
    const { result } = renderHook(() => useDashboardStatsQuery('', ''), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(overviewApi.getDashboardStats).not.toHaveBeenCalled()
  })
})

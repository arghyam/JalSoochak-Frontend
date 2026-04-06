import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { schemesApi } from '../api/schemes-api'
import {
  useSchemesListQuery,
  useSchemeDetailsQuery,
  useSchemeReadingsQuery,
} from './use-schemes-queries'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

jest.mock('../api/schemes-api', () => ({
  schemesApi: {
    getSchemesList: jest.fn(),
    getSchemeDetails: jest.fn(),
    getSchemeReadings: jest.fn(),
  },
  formatTimestamp: jest.fn((s: string) => s),
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn(
    (selector: (s: { user: { personId: string; tenantCode: string } }) => unknown) =>
      selector({ user: { personId: '42', tenantCode: 'nl' } })
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

const MOCK_LIST = {
  content: [
    {
      schemeId: 1,
      stateSchemeId: 'SS-001',
      schemeName: 'Test Scheme',
      pumpOperatorNames: ['Op A'],
      lastReading: 100,
      lastReadingAt: '2026-04-04T08:00:00',
      yesterdayReading: 50,
      lastWaterSupplied: 200,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
}

const MOCK_DETAILS = {
  schemeId: 1,
  stateSchemeId: 'SS-001',
  schemeName: 'Test Scheme',
  lastSubmissionAt: '2026-04-04T08:00:00',
  reportingRatePercent: 75,
}

const MOCK_READINGS = {
  content: [
    {
      pumpOperatorId: 13,
      pumpOperatorName: 'Op A',
      submittedAt: '2026-04-04T08:00:00',
      readingValue: 100,
      waterSupplied: 50,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('sectionOfficerQueryKeys', () => {
  it('generates a stable schemes list key', () => {
    expect(sectionOfficerQueryKeys.schemesList('nl', '42', 1, 10, '')).toEqual([
      'section-officer',
      'schemes',
      'nl',
      '42',
      1,
      10,
      '',
    ])
  })

  it('generates a stable scheme details key', () => {
    expect(sectionOfficerQueryKeys.schemeDetails('nl', '1')).toEqual([
      'section-officer',
      'scheme-details',
      'nl',
      '1',
    ])
  })

  it('generates a stable scheme readings key', () => {
    expect(sectionOfficerQueryKeys.schemeReadings('nl', '1', 1, 10)).toEqual([
      'section-officer',
      'scheme-readings',
      'nl',
      '1',
      1,
      10,
    ])
  })
})

describe('useSchemesListQuery', () => {
  it('fetches and returns schemes list on success', async () => {
    ;(
      schemesApi.getSchemesList as jest.MockedFunction<typeof schemesApi.getSchemesList>
    ).mockResolvedValue(MOCK_LIST)

    const { result } = renderHook(() => useSchemesListQuery(1, 10, ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_LIST)
    expect(schemesApi.getSchemesList).toHaveBeenCalledWith({
      personId: '42',
      tenantCode: 'nl',
      page: 0,
      size: 10,
      schemeName: undefined,
    })
  })

  it('passes schemeName when non-empty', async () => {
    ;(
      schemesApi.getSchemesList as jest.MockedFunction<typeof schemesApi.getSchemesList>
    ).mockResolvedValue(MOCK_LIST)

    const { result } = renderHook(() => useSchemesListQuery(1, 10, 'test'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(schemesApi.getSchemesList).toHaveBeenCalledWith(
      expect.objectContaining({ schemeName: 'test' })
    )
  })

  it('surfaces error state on fetch failure', async () => {
    ;(
      schemesApi.getSchemesList as jest.MockedFunction<typeof schemesApi.getSchemesList>
    ).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSchemesListQuery(1, 10, ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useSchemeDetailsQuery', () => {
  it('fetches scheme details when schemeId is provided', async () => {
    ;(
      schemesApi.getSchemeDetails as jest.MockedFunction<typeof schemesApi.getSchemeDetails>
    ).mockResolvedValue(MOCK_DETAILS)

    const { result } = renderHook(() => useSchemeDetailsQuery('1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_DETAILS)
    expect(schemesApi.getSchemeDetails).toHaveBeenCalledWith({ schemeId: '1', tenantCode: 'nl' })
  })

  it('does not fetch when schemeId is undefined', () => {
    const { result } = renderHook(() => useSchemeDetailsQuery(undefined), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(schemesApi.getSchemeDetails).not.toHaveBeenCalled()
  })
})

describe('useSchemeReadingsQuery', () => {
  it('fetches readings when schemeId is provided', async () => {
    ;(
      schemesApi.getSchemeReadings as jest.MockedFunction<typeof schemesApi.getSchemeReadings>
    ).mockResolvedValue(MOCK_READINGS)

    const { result } = renderHook(() => useSchemeReadingsQuery('1', 1, 10), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_READINGS)
    expect(schemesApi.getSchemeReadings).toHaveBeenCalledWith({
      schemeId: '1',
      tenantCode: 'nl',
      page: 0,
      size: 10,
    })
  })

  it('does not fetch when schemeId is undefined', () => {
    const { result } = renderHook(() => useSchemeReadingsQuery(undefined, 1, 10), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(schemesApi.getSchemeReadings).not.toHaveBeenCalled()
  })
})

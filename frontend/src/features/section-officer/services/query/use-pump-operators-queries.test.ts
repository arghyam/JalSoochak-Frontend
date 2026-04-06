import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { pumpOperatorsApi } from '../api/pump-operators-api'
import {
  usePumpOperatorsListQuery,
  usePumpOperatorDetailsQuery,
  usePumpOperatorReadingsQuery,
} from './use-pump-operators-queries'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

jest.mock('../api/pump-operators-api', () => ({
  pumpOperatorsApi: {
    getPumpOperatorsList: jest.fn(),
    getPumpOperatorDetails: jest.fn(),
    getPumpOperatorReadings: jest.fn(),
  },
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn(
    (selector: (s: { user: { personId: string; tenantCode: string } }) => unknown) =>
      selector({ user: { personId: '15', tenantCode: 'nl' } })
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
      id: 13,
      uuid: '94f7dffa',
      name: 'pump operator',
      status: 'ACTIVE',
      schemes: [{ schemeId: 1, schemeName: 'Test Scheme 1', stateSchemeId: 'SS-001' }],
      reportingRatePercent: 50.0,
      lastSubmissionAt: '2026-04-06T05:28:08.640517',
      lastWaterSupplied: null,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
}

const MOCK_DETAILS = {
  id: 3,
  uuid: '4c3d5550',
  name: 'Shyam Singh',
  email: 'po@pump.local',
  phoneNumber: '9919420001',
  status: 'INACTIVE',
  schemeId: 2,
  schemeName: 'Test Scheme 2',
  schemeLatitude: 13.9716,
  schemeLongitude: 78.5946,
  lastSubmissionAt: null,
  firstSubmissionDate: null,
  totalDaysSinceFirstSubmission: null,
  submittedDays: 0,
  reportingRatePercent: null,
  missedSubmissionDays: null,
}

const MOCK_READINGS = {
  content: [
    {
      schemeId: 1,
      schemeName: 'Test Scheme 1',
      stateSchemeId: 'SS-001',
      readingAt: '2026-03-31T17:48:16.127898',
      readingValue: 0,
      waterSupplied: -2722,
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

describe('sectionOfficerQueryKeys — pump operator keys', () => {
  it('generates a stable pump operators list key', () => {
    expect(sectionOfficerQueryKeys.pumpOperatorsList('nl', '15', 1, 10, '', '', '', '')).toEqual([
      'section-officer',
      'pump-operators',
      'nl',
      '15',
      1,
      10,
      '',
      '',
      '',
      '',
    ])
  })

  it('generates a stable pump operator details key', () => {
    expect(sectionOfficerQueryKeys.pumpOperatorDetails('nl', '3')).toEqual([
      'section-officer',
      'pump-operator-details',
      'nl',
      '3',
    ])
  })

  it('generates a stable pump operator readings key', () => {
    expect(sectionOfficerQueryKeys.pumpOperatorReadings('nl', '3', 1, 10, '')).toEqual([
      'section-officer',
      'pump-operator-readings',
      'nl',
      '3',
      1,
      10,
      '',
    ])
  })
})

describe('usePumpOperatorsListQuery', () => {
  it('fetches and returns pump operators list on success', async () => {
    ;(
      pumpOperatorsApi.getPumpOperatorsList as jest.MockedFunction<
        typeof pumpOperatorsApi.getPumpOperatorsList
      >
    ).mockResolvedValue(MOCK_LIST)

    const { result } = renderHook(() => usePumpOperatorsListQuery(1, 10, '', '', '', ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_LIST)
    expect(pumpOperatorsApi.getPumpOperatorsList).toHaveBeenCalledWith({
      personId: '15',
      tenantCode: 'nl',
      page: 0,
      size: 10,
      name: undefined,
      status: undefined,
      startDate: undefined,
      endDate: undefined,
    })
  })

  it('passes optional filters when provided', async () => {
    ;(
      pumpOperatorsApi.getPumpOperatorsList as jest.MockedFunction<
        typeof pumpOperatorsApi.getPumpOperatorsList
      >
    ).mockResolvedValue(MOCK_LIST)

    const { result } = renderHook(
      () => usePumpOperatorsListQuery(1, 10, 'ravi', 'ACTIVE', '2026-01-01', '2026-03-31'),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(pumpOperatorsApi.getPumpOperatorsList).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ravi',
        status: 'ACTIVE',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      })
    )
  })

  it('surfaces error state on fetch failure', async () => {
    ;(
      pumpOperatorsApi.getPumpOperatorsList as jest.MockedFunction<
        typeof pumpOperatorsApi.getPumpOperatorsList
      >
    ).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => usePumpOperatorsListQuery(1, 10, '', '', '', ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('usePumpOperatorDetailsQuery', () => {
  it('fetches pump operator details when operatorId is provided', async () => {
    ;(
      pumpOperatorsApi.getPumpOperatorDetails as jest.MockedFunction<
        typeof pumpOperatorsApi.getPumpOperatorDetails
      >
    ).mockResolvedValue(MOCK_DETAILS)

    const { result } = renderHook(() => usePumpOperatorDetailsQuery('3'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_DETAILS)
    expect(pumpOperatorsApi.getPumpOperatorDetails).toHaveBeenCalledWith({
      operatorId: '3',
      tenantCode: 'nl',
    })
  })

  it('does not fetch when operatorId is undefined', () => {
    const { result } = renderHook(() => usePumpOperatorDetailsQuery(undefined), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(pumpOperatorsApi.getPumpOperatorDetails).not.toHaveBeenCalled()
  })
})

describe('usePumpOperatorReadingsQuery', () => {
  it('fetches readings when operatorId is provided', async () => {
    ;(
      pumpOperatorsApi.getPumpOperatorReadings as jest.MockedFunction<
        typeof pumpOperatorsApi.getPumpOperatorReadings
      >
    ).mockResolvedValue(MOCK_READINGS)

    const { result } = renderHook(() => usePumpOperatorReadingsQuery('3', 1, 10, ''), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_READINGS)
    expect(pumpOperatorsApi.getPumpOperatorReadings).toHaveBeenCalledWith({
      operatorId: '3',
      tenantCode: 'nl',
      page: 0,
      size: 10,
      schemeName: undefined,
    })
  })

  it('passes schemeName when non-empty', async () => {
    ;(
      pumpOperatorsApi.getPumpOperatorReadings as jest.MockedFunction<
        typeof pumpOperatorsApi.getPumpOperatorReadings
      >
    ).mockResolvedValue(MOCK_READINGS)

    const { result } = renderHook(() => usePumpOperatorReadingsQuery('3', 1, 10, 'Swajal'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(pumpOperatorsApi.getPumpOperatorReadings).toHaveBeenCalledWith(
      expect.objectContaining({ schemeName: 'Swajal' })
    )
  })

  it('does not fetch when operatorId is undefined', () => {
    const { result } = renderHook(() => usePumpOperatorReadingsQuery(undefined, 1, 10, ''), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(pumpOperatorsApi.getPumpOperatorReadings).not.toHaveBeenCalled()
  })
})

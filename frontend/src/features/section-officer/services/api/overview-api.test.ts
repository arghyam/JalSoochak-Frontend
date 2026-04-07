import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { apiClient } from '@/shared/lib/axios'
import {
  overviewApi,
  mapOutageReasonsToPieData,
  mapOutageReasonsToHistogramData,
  mapNonSubmissionToPieData,
  mapNonSubmissionToHistogramData,
  mapSubmissionToPieData,
  mapSubmissionToBarData,
} from './overview-api'
import type {
  OutageReasonsResponse,
  NonSubmissionReasonsResponse,
  SubmissionStatusResponse,
} from '../../types/overview'

jest.mock('@/shared/lib/axios', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

const MOCK_OUTAGE_RESPONSE: OutageReasonsResponse = {
  userId: 11,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  schemeCount: 2,
  outageReasonSchemeCount: { draught: 1, no_electricity: 0 },
  dailyOutageReasonDistribution: [
    { date: '2026-01-01', outageReasonSchemeCount: { draught: 1, no_electricity: 0 } },
    { date: '2026-01-02', outageReasonSchemeCount: { draught: 0, no_electricity: 1 } },
  ],
}

const MOCK_NON_SUBMISSION_RESPONSE: NonSubmissionReasonsResponse = {
  userId: 11,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  schemeCount: 2,
  nonSubmissionReasonSchemeCount: { app_issue: 1 },
  dailyNonSubmissionReasonDistribution: [
    { date: '2026-01-01', nonSubmissionReasonSchemeCount: { app_issue: 1 } },
  ],
}

const MOCK_SUBMISSION_RESPONSE: SubmissionStatusResponse = {
  userId: 11,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  schemeCount: 2,
  compliantSubmissionCount: 4,
  anomalousSubmissionCount: 1,
  dailySubmissionSchemeDistribution: [
    { date: '2026-01-01', submittedSchemeCount: 1 },
    { date: '2026-01-02', submittedSchemeCount: 2 },
  ],
}

// ── Mapper unit tests ──────────────────────────────────────────────────────────

describe('mapOutageReasonsToPieData', () => {
  it('returns a single entry with reasons from the response', () => {
    const result = mapOutageReasonsToPieData(MOCK_OUTAGE_RESPONSE)
    expect(result).toHaveLength(1)
    expect(result[0].reasons).toEqual({ draught: 1, no_electricity: 0 })
    expect(result[0].electricityFailure).toBe(0)
  })
})

describe('mapOutageReasonsToHistogramData', () => {
  it('returns one entry per day with correct label and reasons', () => {
    const result = mapOutageReasonsToHistogramData(MOCK_OUTAGE_RESPONSE)
    expect(result).toHaveLength(2)
    expect(result[0].label).toBe('2026-01-01')
    expect(result[0].reasons).toEqual({ draught: 1, no_electricity: 0 })
    expect(result[1].label).toBe('2026-01-02')
  })
})

describe('mapNonSubmissionToPieData', () => {
  it('returns a single entry with nonSubmissionReasonSchemeCount as reasons', () => {
    const result = mapNonSubmissionToPieData(MOCK_NON_SUBMISSION_RESPONSE)
    expect(result).toHaveLength(1)
    expect(result[0].reasons).toEqual({ app_issue: 1 })
  })
})

describe('mapNonSubmissionToHistogramData', () => {
  it('maps daily distribution to labelled chart entries', () => {
    const result = mapNonSubmissionToHistogramData(MOCK_NON_SUBMISSION_RESPONSE)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('2026-01-01')
    expect(result[0].reasons).toEqual({ app_issue: 1 })
  })
})

describe('mapSubmissionToPieData', () => {
  it('maps compliant/anomalous counts into reasons', () => {
    const result = mapSubmissionToPieData(MOCK_SUBMISSION_RESPONSE)
    expect(result).toHaveLength(1)
    expect(result[0].reasons).toEqual({ compliant: 4, anomalous: 1 })
  })
})

describe('mapSubmissionToBarData', () => {
  it('calculates regularity as percentage of submitted vs total schemes', () => {
    const result = mapSubmissionToBarData(MOCK_SUBMISSION_RESPONSE)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('2026-01-01')
    expect(result[0].regularity).toBeCloseTo(50) // 1/2 * 100
    expect(result[1].regularity).toBeCloseTo(100) // 2/2 * 100
  })

  it('caps regularity at 100', () => {
    const res: SubmissionStatusResponse = {
      ...MOCK_SUBMISSION_RESPONSE,
      schemeCount: 1,
      dailySubmissionSchemeDistribution: [{ date: '2026-01-01', submittedSchemeCount: 5 }],
    }
    const result = mapSubmissionToBarData(res)
    expect(result[0].regularity).toBe(100)
  })

  it('guards against schemeCount of 0 by treating it as 1', () => {
    const res: SubmissionStatusResponse = {
      ...MOCK_SUBMISSION_RESPONSE,
      schemeCount: 0,
      dailySubmissionSchemeDistribution: [{ date: '2026-01-01', submittedSchemeCount: 2 }],
    }
    expect(() => mapSubmissionToBarData(res)).not.toThrow()
    const result = mapSubmissionToBarData(res)
    expect(Number.isFinite(result[0].regularity)).toBe(true)
  })
})

// ── API call tests ─────────────────────────────────────────────────────────────

describe('overviewApi.getSchemesCount', () => {
  it('calls the correct endpoint and returns schemeCount', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: { data: { schemeCount: 5 } },
    })

    const result = await overviewApi.getSchemesCount('15', 'nl')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/pumpoperator/person/15/schemes/count', {
      params: { tenantCode: 'nl' },
    })
    expect(result).toEqual({ schemeCount: 5 })
  })

  it('propagates errors', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockRejectedValue(
      new Error('Network error')
    )
    await expect(overviewApi.getSchemesCount('15', 'nl')).rejects.toThrow('Network error')
  })
})

describe('overviewApi.getOutageReasons', () => {
  it('calls the correct endpoint and returns mapped pie and histogram data', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: { data: MOCK_OUTAGE_RESPONSE },
    })

    const result = await overviewApi.getOutageReasons('2026-01-01', '2026-01-31')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/analytics/outage-reasons/user', {
      params: { start_date: '2026-01-01', end_date: '2026-01-31' },
    })
    expect(result.pieData).toHaveLength(1)
    expect(result.histogramData).toHaveLength(2)
  })
})

describe('overviewApi.getNonSubmissionReasons', () => {
  it('calls the correct endpoint and returns mapped data', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: { data: MOCK_NON_SUBMISSION_RESPONSE },
    })

    const result = await overviewApi.getNonSubmissionReasons('2026-01-01', '2026-01-31')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/analytics/non-submission-reasons/user', {
      params: { start_date: '2026-01-01', end_date: '2026-01-31' },
    })
    expect(result.pieData).toHaveLength(1)
    expect(result.histogramData).toHaveLength(1)
  })
})

describe('overviewApi.getSubmissionStatus', () => {
  it('calls the correct endpoint and returns mapped pie and bar data', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: { data: MOCK_SUBMISSION_RESPONSE },
    })

    const result = await overviewApi.getSubmissionStatus('2026-01-01', '2026-01-31')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/analytics/submission-status/user', {
      params: { start_date: '2026-01-01', end_date: '2026-01-31' },
    })
    expect(result.pieData).toHaveLength(1)
    expect(result.barData).toHaveLength(2)
  })
})

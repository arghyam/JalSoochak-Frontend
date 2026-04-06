import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { apiClient } from '@/shared/lib/axios'
import { schemesApi, formatTimestamp } from './schemes-api'

jest.mock('@/shared/lib/axios', () => ({
  __esModule: true,
  apiClient: { get: jest.fn() },
  default: { get: jest.fn() },
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGet = apiClient.get as jest.MockedFunction<(...args: any[]) => Promise<any>>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('formatTimestamp', () => {
  it('formats an ISO timestamp to dd-mm-yyyy, HH:MM', () => {
    expect(formatTimestamp('2026-04-04T08:46:32.148617')).toBe('04-04-2026, 08:46')
  })

  it('pads single-digit day and month with zeros', () => {
    expect(formatTimestamp('2026-01-05T09:05:00')).toBe('05-01-2026, 09:05')
  })
})

describe('schemesApi.getSchemesList', () => {
  const MOCK_RESPONSE = {
    content: [
      {
        schemeId: 1,
        stateSchemeId: 'SS-001',
        schemeName: 'Test Scheme 1',
        pumpOperatorNames: ['pump operator'],
        lastReading: 2722,
        lastReadingAt: '2026-04-04T08:46:32.148617',
        yesterdayReading: 0,
        lastWaterSupplied: null,
      },
    ],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
  }

  it('calls the correct URL with required params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_RESPONSE } })

    const result = await schemesApi.getSchemesList({
      personId: '42',
      tenantCode: 'nl',
      page: 0,
      size: 10,
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/person/42/schemes', {
      params: { tenantCode: 'nl', page: 0, size: 10 },
    })
    expect(result).toEqual(MOCK_RESPONSE)
  })

  it('includes schemeName param when provided', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_RESPONSE } })

    await schemesApi.getSchemesList({
      personId: '42',
      tenantCode: 'nl',
      page: 0,
      size: 10,
      schemeName: 'test',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/person/42/schemes', {
      params: { tenantCode: 'nl', page: 0, size: 10, schemeName: 'test' },
    })
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))
    await expect(
      schemesApi.getSchemesList({ personId: '42', tenantCode: 'nl', page: 0, size: 10 })
    ).rejects.toThrow('Network error')
  })
})

describe('schemesApi.getSchemeDetails', () => {
  const MOCK_DETAILS = {
    schemeId: 1,
    stateSchemeId: 'SS-001',
    schemeName: 'Test Scheme 1',
    lastSubmissionAt: '2026-04-04T08:46:32.148617',
    reportingRatePercent: 62.5,
  }

  it('calls the correct URL with tenantCode param', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_DETAILS } })

    const result = await schemesApi.getSchemeDetails({ schemeId: '1', tenantCode: 'nl' })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/schemes/1/details', {
      params: { tenantCode: 'nl' },
    })
    expect(result).toEqual(MOCK_DETAILS)
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'))
    await expect(schemesApi.getSchemeDetails({ schemeId: '99', tenantCode: 'nl' })).rejects.toThrow(
      'Not found'
    )
  })
})

describe('schemesApi.getSchemeReadings', () => {
  const MOCK_READINGS = {
    content: [
      {
        pumpOperatorId: 13,
        pumpOperatorName: 'pump operator',
        submittedAt: '2026-04-02T07:12:31.057227',
        readingValue: 4050,
        waterSupplied: -37417,
      },
    ],
    totalElements: 15,
    totalPages: 3,
    size: 5,
    number: 1,
  }

  it('calls the correct URL with pagination params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_READINGS } })

    const result = await schemesApi.getSchemeReadings({
      schemeId: '1',
      tenantCode: 'nl',
      page: 1,
      size: 5,
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/schemes/1/reading-submissions', {
      params: { tenantCode: 'nl', page: 1, size: 5 },
    })
    expect(result).toEqual(MOCK_READINGS)
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Server error'))
    await expect(
      schemesApi.getSchemeReadings({ schemeId: '1', tenantCode: 'nl', page: 0, size: 5 })
    ).rejects.toThrow('Server error')
  })
})

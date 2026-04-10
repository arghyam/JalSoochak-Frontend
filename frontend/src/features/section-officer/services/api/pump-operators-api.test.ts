import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { apiClient } from '@/shared/lib/axios'
import { pumpOperatorsApi } from './pump-operators-api'

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

describe('pumpOperatorsApi.getPumpOperatorsList', () => {
  const MOCK_RESPONSE = {
    content: [
      {
        id: 13,
        uuid: '94f7dffa-ba0a-4b82-b1a4-6da7bbd8ab7d',
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

  it('calls the correct URL with required params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_RESPONSE } })

    const result = await pumpOperatorsApi.getPumpOperatorsList({
      personId: '15',
      tenantCode: 'nl',
      page: 0,
      size: 10,
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/person/15/pump-operators', {
      params: { tenantCode: 'nl', page: 0, size: 10 },
    })
    expect(result).toEqual(MOCK_RESPONSE)
  })

  it('includes optional filter params when provided', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_RESPONSE } })

    await pumpOperatorsApi.getPumpOperatorsList({
      personId: '15',
      tenantCode: 'nl',
      page: 0,
      size: 10,
      name: 'ravi',
      status: 'ACTIVE',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/person/15/pump-operators', {
      params: {
        tenantCode: 'nl',
        page: 0,
        size: 10,
        name: 'ravi',
        status: 'ACTIVE',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      },
    })
  })

  it('omits optional params when not provided', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_RESPONSE } })

    await pumpOperatorsApi.getPumpOperatorsList({
      personId: '15',
      tenantCode: 'nl',
      page: 0,
      size: 10,
    })

    const callParams = mockGet.mock.calls[0][1] as { params: Record<string, unknown> }
    expect(callParams.params).not.toHaveProperty('name')
    expect(callParams.params).not.toHaveProperty('status')
    expect(callParams.params).not.toHaveProperty('startDate')
    expect(callParams.params).not.toHaveProperty('endDate')
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))
    await expect(
      pumpOperatorsApi.getPumpOperatorsList({ personId: '15', tenantCode: 'nl', page: 0, size: 10 })
    ).rejects.toThrow('Network error')
  })
})

describe('pumpOperatorsApi.getPumpOperatorDetails', () => {
  const MOCK_DETAILS = {
    id: 3,
    uuid: '4c3d5550-a181-4bb3-91b7-1c527c424de2',
    name: 'Shyam Singh',
    email: 'po_9919420001@pump-operator.local',
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

  it('calls the correct URL with tenantCode param', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_DETAILS } })

    const result = await pumpOperatorsApi.getPumpOperatorDetails({
      operatorId: '3',
      tenantCode: 'nl',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/pump-operators/3', {
      params: { tenantCode: 'nl' },
    })
    expect(result).toEqual(MOCK_DETAILS)
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'))
    await expect(
      pumpOperatorsApi.getPumpOperatorDetails({ operatorId: '99', tenantCode: 'nl' })
    ).rejects.toThrow('Not found')
  })
})

describe('pumpOperatorsApi.getPumpOperatorReadings', () => {
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
    totalElements: 3,
    totalPages: 1,
    size: 10,
    number: 0,
  }

  it('calls the correct URL with pagination params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_READINGS } })

    const result = await pumpOperatorsApi.getPumpOperatorReadings({
      operatorId: '1',
      tenantCode: 'nl',
      page: 0,
      size: 10,
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/pump-operators/1/readings', {
      params: { tenantCode: 'nl', page: 0, size: 10 },
    })
    expect(result).toEqual(MOCK_READINGS)
  })

  it('includes schemeName param when provided', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_READINGS } })

    await pumpOperatorsApi.getPumpOperatorReadings({
      operatorId: '1',
      tenantCode: 'nl',
      page: 0,
      size: 10,
      schemeName: 'Test',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/pumpoperator/pump-operators/1/readings', {
      params: { tenantCode: 'nl', page: 0, size: 10, schemeName: 'Test' },
    })
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Server error'))
    await expect(
      pumpOperatorsApi.getPumpOperatorReadings({
        operatorId: '1',
        tenantCode: 'nl',
        page: 0,
        size: 10,
      })
    ).rejects.toThrow('Server error')
  })
})

describe('pumpOperatorsApi.getOperatorAttendance', () => {
  const MOCK_ATTENDANCE = [
    { date: '2026-03-01', attendance: 0 },
    { date: '2026-03-02', attendance: 0 },
    { date: '2026-03-03', attendance: 1 },
  ]

  it('calls the correct URL with uuid and date range params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_ATTENDANCE } })

    const result = await pumpOperatorsApi.getOperatorAttendance({
      uuid: '4c3d5550-a181-4bb3-91b7-1c527c424de2',
      startDate: '2026-03-01',
      endDate: '2026-03-03',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/operator-attendance', {
      params: {
        uuid: '4c3d5550-a181-4bb3-91b7-1c527c424de2',
        start_date: '2026-03-01',
        end_date: '2026-03-03',
      },
    })
    expect(result).toEqual(MOCK_ATTENDANCE)
  })

  it('returns the unwrapped data array', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: MOCK_ATTENDANCE } })

    const result = await pumpOperatorsApi.getOperatorAttendance({
      uuid: 'test-uuid',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    })

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Unauthorized'))
    await expect(
      pumpOperatorsApi.getOperatorAttendance({
        uuid: 'test-uuid',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      })
    ).rejects.toThrow('Unauthorized')
  })
})

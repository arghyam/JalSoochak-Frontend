import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { apiClient } from '@/shared/lib/axios'
import { anomaliesApi } from './anomalies-api'

jest.mock('@/shared/lib/axios', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

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

describe('anomaliesApi.getAnomaliesList', () => {
  it('calls the correct endpoint with required params', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: MOCK_RESPONSE,
    })

    const result = await anomaliesApi.getAnomaliesList({
      userId: '2',
      tenantId: '50',
      page: 1,
      limit: 10,
    })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/analytics/anomalies', {
      params: {
        user_id: '2',
        tenant_id: '50',
        page_number: 1,
        limit: 10,
      },
    })
    expect(result).toEqual(MOCK_RESPONSE)
  })

  it('includes optional filters when provided', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: MOCK_RESPONSE,
    })

    await anomaliesApi.getAnomaliesList({
      userId: '2',
      tenantId: '50',
      page: 1,
      limit: 10,
      schemeName: 'Test',
      status: 'Pending',
      startDate: '2026-03-01',
      endDate: '2026-04-01',
    })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/analytics/anomalies', {
      params: {
        user_id: '2',
        tenant_id: '50',
        page_number: 1,
        limit: 10,
        scheme_name: 'Test',
        status: 'Pending',
        start_date: '2026-03-01',
        end_date: '2026-04-01',
      },
    })
  })

  it('omits undefined optional filters', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: MOCK_RESPONSE,
    })

    await anomaliesApi.getAnomaliesList({
      userId: '2',
      tenantId: '50',
      page: 1,
      limit: 10,
      schemeName: undefined,
      status: undefined,
    })

    const callParams = (apiClient.get as jest.MockedFunction<typeof apiClient.get>).mock.calls[0][1]
      ?.params as Record<string, unknown>
    expect(callParams).not.toHaveProperty('scheme_name')
    expect(callParams).not.toHaveProperty('status')
  })

  it('propagates errors from the API client', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockRejectedValue(
      new Error('Network error')
    )

    await expect(
      anomaliesApi.getAnomaliesList({ userId: '2', tenantId: '50', page: 1, limit: 10 })
    ).rejects.toThrow('Network error')
  })
})

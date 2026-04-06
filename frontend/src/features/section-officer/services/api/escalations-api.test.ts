import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { apiClient } from '@/shared/lib/axios'
import { escalationsApi } from './escalations-api'

jest.mock('@/shared/lib/axios', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

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

describe('escalationsApi.getEscalationsList', () => {
  it('calls the correct endpoint with required params', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: MOCK_RESPONSE,
    })

    const result = await escalationsApi.getEscalationsList({
      userId: '2',
      tenantId: '50',
      page: 1,
      limit: 10,
    })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/analytics/escalations', {
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

    await escalationsApi.getEscalationsList({
      userId: '2',
      tenantId: '50',
      page: 1,
      limit: 10,
      schemeName: 'Swajal',
      status: 'Resolved',
      startDate: '2026-03-01',
      endDate: '2026-04-01',
    })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/analytics/escalations', {
      params: {
        user_id: '2',
        tenant_id: '50',
        page_number: 1,
        limit: 10,
        scheme_name: 'Swajal',
        status: 'Resolved',
        start_date: '2026-03-01',
        end_date: '2026-04-01',
      },
    })
  })

  it('omits undefined optional filters', async () => {
    ;(apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValue({
      data: MOCK_RESPONSE,
    })

    await escalationsApi.getEscalationsList({
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
      escalationsApi.getEscalationsList({ userId: '2', tenantId: '50', page: 1, limit: 10 })
    ).rejects.toThrow('Network error')
  })
})

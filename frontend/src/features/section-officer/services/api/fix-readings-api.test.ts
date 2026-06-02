import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { fixReadingsApi } from './fix-readings-api'

const mockGet = jest.fn<(url: string, config?: unknown) => Promise<unknown>>()
const mockPatch = jest.fn<(url: string, data?: unknown, config?: unknown) => Promise<unknown>>()

jest.mock('@/shared/lib/axios', () => ({
  apiClient: {
    get: (url: string, config?: unknown) => mockGet(url, config),
    patch: (url: string, data?: unknown, config?: unknown) => mockPatch(url, data, config),
  },
}))

describe('fixReadingsApi.searchSchemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls GET with correct URL and params', async () => {
    const mockResponse = {
      data: {
        content: [
          {
            schemeId: 28443,
            schemeName: 'S2604141918',
            yesterdayFinalReading: 0,
            phoneNumber: '917050624279',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
      },
    }
    mockGet.mockResolvedValueOnce(mockResponse)

    const result = await fixReadingsApi.searchSchemes('S26', 'AS')

    expect(mockGet).toHaveBeenCalledWith('/api/v1/scheme/schemes/yesterday-final-readings', {
      params: { schemeName: 'S26', tenantCode: 'AS' },
    })
    expect(result.content).toHaveLength(1)
    expect(result.content[0].schemeName).toBe('S2604141918')
    expect(result.totalElements).toBe(1)
  })

  it('returns empty content when no matches', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 },
    })

    const result = await fixReadingsApi.searchSchemes('ZZZ', 'AS')

    expect(result.content).toHaveLength(0)
  })
})

describe('fixReadingsApi.updateFinalReading', () => {
  const successResponse = {
    data: {
      success: true,
      schemeId: 28442,
      readingDate: '2026-06-02',
      finalReading: 300500,
      message: 'OK',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls PATCH with correct URL, payload, and X-Tenant-Code header', async () => {
    mockPatch.mockResolvedValueOnce(successResponse)

    await fixReadingsApi.updateFinalReading(
      28442,
      { phoneNumber: '917050624278', reading: 300500 },
      'AS'
    )

    expect(mockPatch).toHaveBeenCalledWith(
      '/api/v1/telemetry/schemes/28442/yesterday-final-reading',
      { phoneNumber: '917050624278', reading: 300500 },
      { headers: { 'X-Tenant-Code': 'AS' } }
    )
  })

  it('returns the response data on success', async () => {
    mockPatch.mockResolvedValueOnce(successResponse)

    const result = await fixReadingsApi.updateFinalReading(
      28442,
      { phoneNumber: '917050624278', reading: 300500 },
      'AS'
    )

    expect(result.success).toBe(true)
    expect(result.finalReading).toBe(300500)
  })

  it('throws with the API message when success is false', async () => {
    mockPatch.mockResolvedValueOnce({
      data: {
        success: false,
        schemeId: 28442,
        readingDate: null,
        finalReading: 100,
        message: 'reading must be greater than last confirmed reading (2026-05-31)',
      },
    })

    await expect(
      fixReadingsApi.updateFinalReading(28442, { phoneNumber: '917050624278', reading: 100 }, 'AS')
    ).rejects.toThrow('reading must be greater than last confirmed reading (2026-05-31)')
  })

  it('propagates network errors from the API', async () => {
    const apiError = new Error('Network error')
    mockPatch.mockRejectedValueOnce(apiError)

    await expect(
      fixReadingsApi.updateFinalReading(28442, { phoneNumber: '917050624278', reading: 100 }, 'AS')
    ).rejects.toThrow('Network error')
  })
})

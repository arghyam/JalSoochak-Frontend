import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { fixReadingsApi, UpdateFinalReadingError } from './fix-readings-api'

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

function axiosErrorWith(status: number, data?: unknown) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  })
}

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

  it('calls PATCH on the staff route with only the reading and no tenant header', async () => {
    mockPatch.mockResolvedValueOnce(successResponse)

    await fixReadingsApi.updateFinalReading(28442, { reading: 300500 })

    expect(mockPatch).toHaveBeenCalledWith(
      '/api/v1/telemetry/staff/schemes/28442/yesterday-final-reading',
      { reading: 300500 },
      undefined
    )
  })

  it('returns the response data on success', async () => {
    mockPatch.mockResolvedValueOnce(successResponse)

    const result = await fixReadingsApi.updateFinalReading(28442, { reading: 300500 })

    expect(result.success).toBe(true)
    expect(result.finalReading).toBe(300500)
  })

  it('throws a rejected error with the API message when success is false', async () => {
    mockPatch.mockResolvedValueOnce({
      data: {
        success: false,
        schemeId: 28442,
        readingDate: null,
        finalReading: 100,
        message: 'reading must be greater than last confirmed reading (2026-05-31)',
      },
    })

    await expect(fixReadingsApi.updateFinalReading(28442, { reading: 100 })).rejects.toMatchObject({
      kind: 'rejected',
      message: 'reading must be greater than last confirmed reading (2026-05-31)',
    })
  })

  it.each([400, 404])(
    'throws a rejected error with the envelope message on HTTP %i',
    async (status) => {
      mockPatch.mockRejectedValueOnce(
        axiosErrorWith(status, {
          success: false,
          schemeId: 28442,
          readingDate: null,
          finalReading: 200,
          message: 'reading must be greater than last confirmed reading (2026-05-31)',
        })
      )

      await expect(
        fixReadingsApi.updateFinalReading(28442, { reading: 200 })
      ).rejects.toMatchObject({
        kind: 'rejected',
        message: 'reading must be greater than last confirmed reading (2026-05-31)',
      })
    }
  )

  it('throws an unauthorized error on HTTP 401 with no body', async () => {
    mockPatch.mockRejectedValueOnce(axiosErrorWith(401))

    const error = await fixReadingsApi.updateFinalReading(28442, { reading: 100 }).catch((e) => e)

    expect(error).toBeInstanceOf(UpdateFinalReadingError)
    expect((error as UpdateFinalReadingError).kind).toBe('unauthorized')
  })

  it('throws a forbidden error on HTTP 403 regardless of body', async () => {
    mockPatch.mockRejectedValueOnce(axiosErrorWith(403, { message: 'raw server detail' }))

    await expect(fixReadingsApi.updateFinalReading(28442, { reading: 100 })).rejects.toMatchObject({
      kind: 'forbidden',
    })
  })

  it('wraps network errors as unknown', async () => {
    mockPatch.mockRejectedValueOnce(new Error('Network error'))

    await expect(fixReadingsApi.updateFinalReading(28442, { reading: 100 })).rejects.toMatchObject({
      kind: 'unknown',
      message: 'Network error',
    })
  })
})

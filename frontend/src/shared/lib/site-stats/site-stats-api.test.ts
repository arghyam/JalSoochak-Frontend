import { beforeEach, describe, expect, it, jest } from '@jest/globals'

type Params = { params: { key: string } }

const mockGet = jest.fn(
  async (_url: string, _config: Params): Promise<{ data: unknown }> => ({
    data: {},
  })
)
const mockPost = jest.fn(
  async (_url: string, _body: unknown, _config: Params): Promise<{ data: unknown }> => ({
    data: {},
  })
)
const mockGetFirebaseConfig = jest.fn<() => unknown>()

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({ get: mockGet, post: mockPost }),
  },
}))

jest.mock('@/config/server-config', () => ({
  getFirebaseConfig: () => mockGetFirebaseConfig(),
}))

const PROJECT_ID = 'jalsoochak-dashboard-assam'
const API_KEY = 'test-api-key'
const DOCUMENTS_URL = `/projects/${PROJECT_ID}/databases/(default)/documents`
const VISIT_FLAG_KEY = 'jalsoochak:visitor-counted'

async function loadApi() {
  return import('./site-stats-api')
}

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
  sessionStorage.clear()
  mockGetFirebaseConfig.mockReturnValue({ projectId: PROJECT_ID, apiKey: API_KEY })
  mockGet.mockImplementation(async () => ({
    data: { fields: { count: { integerValue: '20015' } } },
  }))
  mockPost.mockImplementation(async () => ({ data: {} }))
})

describe('getVisitorCount', () => {
  it('reads the visitors document with the api key as a query param', async () => {
    const { getVisitorCount } = await loadApi()

    await getVisitorCount()

    expect(mockGet).toHaveBeenCalledWith(`${DOCUMENTS_URL}/siteStats/visitors`, {
      params: { key: API_KEY },
    })
  })

  it('converts the string integerValue Firestore returns into a number', async () => {
    const { getVisitorCount } = await loadApi()

    await expect(getVisitorCount()).resolves.toBe(20015)
  })

  it('reads a doubleValue when Firestore reports one instead', async () => {
    mockGet.mockImplementation(async () => ({ data: { fields: { count: { doubleValue: 42 } } } }))
    const { getVisitorCount } = await loadApi()

    await expect(getVisitorCount()).resolves.toBe(42)
  })

  it('accepts a zero count rather than treating it as missing', async () => {
    mockGet.mockImplementation(async () => ({
      data: { fields: { count: { integerValue: '0' } } },
    }))
    const { getVisitorCount } = await loadApi()

    await expect(getVisitorCount()).resolves.toBe(0)
  })

  it('rejects when the count field is absent', async () => {
    mockGet.mockImplementation(async () => ({ data: { fields: {} } }))
    const { getVisitorCount, SiteStatsError } = await loadApi()

    await expect(getVisitorCount()).rejects.toBeInstanceOf(SiteStatsError)
  })

  it('rejects when the count is not a finite number', async () => {
    mockGet.mockImplementation(async () => ({
      data: { fields: { count: { integerValue: 'not-a-number' } } },
    }))
    const { getVisitorCount, SiteStatsError } = await loadApi()

    await expect(getVisitorCount()).rejects.toBeInstanceOf(SiteStatsError)
  })

  it('hides the raw server message behind a normalised error', async () => {
    mockGet.mockImplementation(async () => {
      throw new Error('PERMISSION_DENIED: Missing or insufficient permissions')
    })
    const { getVisitorCount } = await loadApi()

    await expect(getVisitorCount()).rejects.toThrow('Could not read the visitor count.')
  })

  it('rejects without a request when Firebase is not configured', async () => {
    mockGetFirebaseConfig.mockReturnValue(undefined)
    const { getVisitorCount } = await loadApi()

    await expect(getVisitorCount()).rejects.toThrow('Visitor counter is not configured.')
    expect(mockGet).not.toHaveBeenCalled()
  })
})

describe('incrementVisitorCount', () => {
  it('commits an atomic increment transform of exactly one', async () => {
    const { incrementVisitorCount } = await loadApi()

    await incrementVisitorCount()

    expect(mockPost).toHaveBeenCalledWith(
      `${DOCUMENTS_URL}:commit`,
      {
        writes: [
          {
            transform: {
              document: `projects/${PROJECT_ID}/databases/(default)/documents/siteStats/visitors`,
              fieldTransforms: [{ fieldPath: 'count', increment: { integerValue: '1' } }],
            },
          },
        ],
      },
      { params: { key: API_KEY } }
    )
  })

  it('normalises a rules rejection', async () => {
    mockPost.mockImplementation(async () => {
      throw new Error('PERMISSION_DENIED')
    })
    const { incrementVisitorCount } = await loadApi()

    await expect(incrementVisitorCount()).rejects.toThrow('Could not record the visit.')
  })
})

describe('registerVisitAndGetCount', () => {
  it('counts the visit and returns the count on a first visit', async () => {
    const { registerVisitAndGetCount } = await loadApi()

    await expect(registerVisitAndGetCount()).resolves.toBe(20015)

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('marks the session before writing, so a retry cannot double-count', async () => {
    let flagWhenPosting: string | null = null
    mockPost.mockImplementation(async () => {
      flagWhenPosting = sessionStorage.getItem(VISIT_FLAG_KEY)
      return { data: {} }
    })
    const { registerVisitAndGetCount } = await loadApi()

    await registerVisitAndGetCount()

    expect(flagWhenPosting).toBe('1')
  })

  it('does not increment again within the same session', async () => {
    const { registerVisitAndGetCount } = await loadApi()

    await registerVisitAndGetCount()
    await registerVisitAndGetCount()

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledTimes(2)
  })

  it('still returns the count when the increment fails', async () => {
    mockPost.mockImplementation(async () => {
      throw new Error('PERMISSION_DENIED')
    })
    const { registerVisitAndGetCount } = await loadApi()

    await expect(registerVisitAndGetCount()).resolves.toBe(20015)
  })

  it('does not count a visit when storage is unavailable', async () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    const { registerVisitAndGetCount } = await loadApi()

    await expect(registerVisitAndGetCount()).resolves.toBe(20015)

    // Failing closed: a visitor who cannot be tracked is never counted repeatedly.
    expect(mockPost).not.toHaveBeenCalled()
    getItem.mockRestore()
  })
})

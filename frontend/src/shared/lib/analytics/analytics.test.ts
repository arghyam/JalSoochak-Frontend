import { beforeEach, describe, expect, it, jest } from '@jest/globals'

type EventParams = Record<string, string | number | boolean>

const mockGetFirebaseConfig = jest.fn<() => unknown>()
const mockInitializeApp = jest.fn((_config: unknown): unknown => ({ name: 'test-app' }))
const mockGetAnalytics = jest.fn((_app: unknown): unknown => ({ app: 'test-app' }))
const mockIsSupported = jest.fn(async () => true)
const mockLogEvent = jest.fn((_instance: unknown, _name: string, _params: EventParams) => {})
const mockSetUserProperties = jest.fn((_instance: unknown, _properties: EventParams) => {})

/** Counts SDK loads so the "never downloaded when disabled" guarantee can be asserted. */
let firebaseAppImports = 0
let firebaseAnalyticsImports = 0

jest.mock('@/config/server-config', () => ({
  getFirebaseConfig: () => mockGetFirebaseConfig(),
}))

jest.mock('firebase/app', () => {
  firebaseAppImports += 1
  return { initializeApp: (config: unknown) => mockInitializeApp(config) }
})

jest.mock('firebase/analytics', () => {
  firebaseAnalyticsImports += 1
  return {
    getAnalytics: (app: unknown) => mockGetAnalytics(app),
    isSupported: () => mockIsSupported(),
    logEvent: (instance: unknown, name: string, params: EventParams) =>
      mockLogEvent(instance, name, params),
    setUserProperties: (instance: unknown, properties: EventParams) =>
      mockSetUserProperties(instance, properties),
  }
})

const VALID_CONFIG = {
  apiKey: 'test-api-key',
  projectId: 'test-project',
  appId: 'test-app-id',
  measurementId: 'G-TEST',
}

/** Fresh module instance so the memoised SDK promise does not leak between tests. */
async function loadAnalytics() {
  return import('./analytics')
}

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
  firebaseAppImports = 0
  firebaseAnalyticsImports = 0
  // clearAllMocks clears recorded calls but keeps implementations, so the failure-path
  // tests below would otherwise leak their throwing stubs into later tests.
  mockIsSupported.mockImplementation(async () => true)
  mockInitializeApp.mockImplementation(() => ({ name: 'test-app' }))
  mockGetAnalytics.mockImplementation(() => ({ app: 'test-app' }))
  mockLogEvent.mockImplementation(() => {})
  mockSetUserProperties.mockImplementation(() => {})
})

describe('analytics — disabled without Firebase config', () => {
  beforeEach(() => {
    mockGetFirebaseConfig.mockReturnValue(undefined)
  })

  it('never imports the Firebase SDK', async () => {
    const { initAnalytics } = await loadAnalytics()

    initAnalytics()
    await Promise.resolve()

    expect(firebaseAppImports).toBe(0)
    expect(firebaseAnalyticsImports).toBe(0)
    expect(mockInitializeApp).not.toHaveBeenCalled()
  })

  it('makes trackEvent a no-op', async () => {
    const { trackEvent } = await loadAnalytics()

    trackEvent('quick_link_click', { link: 'glossary', external: false })
    await Promise.resolve()

    expect(mockLogEvent).not.toHaveBeenCalled()
    expect(firebaseAnalyticsImports).toBe(0)
  })

  it('makes setAnalyticsUserProperties a no-op', async () => {
    const { setAnalyticsUserProperties } = await loadAnalytics()

    setAnalyticsUserProperties({ language: 'hi' })
    await Promise.resolve()

    expect(mockSetUserProperties).not.toHaveBeenCalled()
  })
})

describe('analytics — enabled with Firebase config', () => {
  beforeEach(() => {
    mockGetFirebaseConfig.mockReturnValue(VALID_CONFIG)
  })

  it('initialises the SDK with the runtime config', async () => {
    const { initAnalytics } = await loadAnalytics()

    initAnalytics()
    await new Promise(process.nextTick)

    expect(mockInitializeApp).toHaveBeenCalledWith(VALID_CONFIG)
    expect(mockGetAnalytics).toHaveBeenCalledTimes(1)
  })

  it('loads the SDK once across repeated init calls', async () => {
    const { initAnalytics } = await loadAnalytics()

    initAnalytics()
    initAnalytics()
    initAnalytics()
    await new Promise(process.nextTick)

    expect(mockInitializeApp).toHaveBeenCalledTimes(1)
  })

  it('reports an event with its params', async () => {
    const { trackEvent } = await loadAnalytics()

    trackEvent('dashboard_level_view', {
      level: 'village',
      hierarchy: 'administrative',
      depth: 5,
      tenancy: 'single',
      village_name: 'bangti',
    })
    await new Promise(process.nextTick)

    expect(mockLogEvent).toHaveBeenCalledWith(expect.anything(), 'dashboard_level_view', {
      level: 'village',
      hierarchy: 'administrative',
      depth: 5,
      tenancy: 'single',
      village_name: 'bangti',
    })
  })

  it('queues events fired before init resolves', async () => {
    const { trackEvent } = await loadAnalytics()

    // No initAnalytics() call: the first trackEvent must trigger the load itself.
    trackEvent('filter_tab_switch', { from: 'administrative', to: 'departmental' })
    await new Promise(process.nextTick)

    expect(mockLogEvent).toHaveBeenCalledTimes(1)
  })

  it('sets user properties', async () => {
    const { setAnalyticsUserProperties } = await loadAnalytics()

    setAnalyticsUserProperties({ language: 'as', tenancy: 'single' })
    await new Promise(process.nextTick)

    expect(mockSetUserProperties).toHaveBeenCalledWith(expect.anything(), {
      language: 'as',
      tenancy: 'single',
    })
  })
})

describe('analytics — parameter sanitising', () => {
  beforeEach(() => {
    mockGetFirebaseConfig.mockReturnValue(VALID_CONFIG)
  })

  it('drops undefined and empty params so reports show no blank dimensions', async () => {
    const { trackEvent } = await loadAnalytics()

    trackEvent('duration_change', {
      days: 7,
      preset_id: undefined,
      is_custom: false,
    })
    await new Promise(process.nextTick)

    expect(mockLogEvent).toHaveBeenCalledWith(expect.anything(), 'duration_change', {
      days: 7,
      is_custom: false,
    })
  })

  it('keeps false and zero, which are meaningful values', async () => {
    const { trackEvent } = await loadAnalytics()

    trackEvent('dashboard_level_view', {
      level: 'national',
      hierarchy: 'administrative',
      depth: 0,
      tenancy: 'multi',
    })
    await new Promise(process.nextTick)

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      'dashboard_level_view',
      expect.objectContaining({ depth: 0 })
    )
  })

  it('truncates strings to the GA4 100-character limit', async () => {
    const { trackEvent } = await loadAnalytics()

    trackEvent('location_search', {
      search_term: 'a'.repeat(150),
      level: 'state',
      hierarchy: 'administrative',
    })
    await new Promise(process.nextTick)

    const params = mockLogEvent.mock.calls[0][2]
    expect(params.search_term).toHaveLength(100)
  })

  it('trims surrounding whitespace and drops whitespace-only values', async () => {
    const { trackEvent } = await loadAnalytics()

    trackEvent('location_search', {
      search_term: '  bajali  ',
      level: 'state',
      hierarchy: '   ' as 'administrative',
    })
    await new Promise(process.nextTick)

    expect(mockLogEvent).toHaveBeenCalledWith(expect.anything(), 'location_search', {
      search_term: 'bajali',
      level: 'state',
    })
  })
})

describe('analytics — failure handling', () => {
  beforeEach(() => {
    mockGetFirebaseConfig.mockReturnValue(VALID_CONFIG)
  })

  it('does not throw or report when the browser is unsupported', async () => {
    mockIsSupported.mockImplementation(async () => false)
    const { initAnalytics, trackEvent } = await loadAnalytics()

    initAnalytics()
    expect(() =>
      trackEvent('quick_link_click', { link: 'glossary', external: false })
    ).not.toThrow()
    await new Promise(process.nextTick)

    expect(mockGetAnalytics).not.toHaveBeenCalled()
    expect(mockLogEvent).not.toHaveBeenCalled()
  })

  it('swallows an SDK initialisation failure', async () => {
    mockInitializeApp.mockImplementation(() => {
      throw new Error('boom')
    })
    const { trackEvent } = await loadAnalytics()

    expect(() =>
      trackEvent('quick_link_click', { link: 'glossary', external: false })
    ).not.toThrow()
    await new Promise(process.nextTick)

    expect(mockLogEvent).not.toHaveBeenCalled()
  })

  it('swallows a logEvent failure without an unhandled rejection', async () => {
    const unhandled = jest.fn()
    process.on('unhandledRejection', unhandled)
    mockLogEvent.mockImplementation(() => {
      throw new Error('network down')
    })
    const { trackEvent } = await loadAnalytics()

    expect(() =>
      trackEvent('quick_link_click', { link: 'glossary', external: false })
    ).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 0))

    // The throw happened inside the SDK call and was caught, not left dangling.
    expect(mockLogEvent).toHaveBeenCalledTimes(1)
    expect(unhandled).not.toHaveBeenCalled()
    process.off('unhandledRejection', unhandled)
  })
})

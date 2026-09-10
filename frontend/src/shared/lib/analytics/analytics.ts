/**
 * Firebase Analytics (GA4) boundary.
 *
 * The only module that touches the Firebase SDK. Two properties matter:
 *
 * - **Production only.** With no FIREBASE block in config.js this module is a permanent
 *   no-op and `import('firebase/*')` is never evaluated, so dev and staging download
 *   nothing and report nothing.
 * - **Never throws.** Analytics is not worth breaking a page over, so every failure path
 *   degrades to a dev-only console message.
 */

import { getFirebaseConfig } from '@/config/server-config'
import type {
  AnalyticsEventName,
  AnalyticsEventParamMap,
  AnalyticsUserProperties,
} from './analytics-events'

/** GA4 truncates string parameter values beyond this length. */
const MAX_PARAM_LENGTH = 100

type FirebaseAnalytics = import('firebase/analytics').Analytics

interface AnalyticsRuntime {
  instance: FirebaseAnalytics
  logEvent: typeof import('firebase/analytics').logEvent
  setUserProperties: typeof import('firebase/analytics').setUserProperties
}

/**
 * Resolves to the live SDK, or to `null` when analytics is disabled or unavailable.
 * Memoised so repeated `initAnalytics()` calls (StrictMode double-invokes an effect) load
 * the SDK once.
 */
let runtimePromise: Promise<AnalyticsRuntime | null> | null = null

function logDevWarning(message: string, error?: unknown): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug(`[Analytics] ${message}`, error ?? '')
  }
}

async function loadRuntime(): Promise<AnalyticsRuntime | null> {
  const config = getFirebaseConfig()
  if (!config) return null

  try {
    const [{ initializeApp }, { getAnalytics, isSupported, logEvent, setUserProperties }] =
      await Promise.all([import('firebase/app'), import('firebase/analytics')])

    // Unsupported in SSR, some in-app webviews, and browsers with cookies disabled.
    if (!(await isSupported())) {
      logDevWarning('Firebase Analytics is not supported in this environment.')
      return null
    }

    return {
      instance: getAnalytics(initializeApp(config)),
      logEvent,
      setUserProperties,
    }
  } catch (error) {
    logDevWarning('Failed to initialise Firebase Analytics.', error)
    return null
  }
}

function getRuntime(): Promise<AnalyticsRuntime | null> {
  runtimePromise ??= loadRuntime()
  return runtimePromise
}

/**
 * Strips params GA4 would reject or report as noise, and enforces its length limit.
 * `null`/`undefined`/empty strings are dropped so absent hierarchy levels do not show up as
 * blank dimensions in reports.
 */
function sanitizeParams(params: object): Record<string, string | number | boolean> {
  const sanitized: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) continue
      sanitized[key] = trimmed.slice(0, MAX_PARAM_LENGTH)
      continue
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) continue
      sanitized[key] = value
      continue
    }

    if (typeof value === 'boolean') {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Loads and initialises Firebase Analytics when configured. Idempotent and fire-and-forget;
 * safe to call from an effect that React may invoke twice.
 */
export function initAnalytics(): void {
  void getRuntime()
}

/**
 * Reports one event. No-op when analytics is disabled.
 *
 * Chains off the init promise, so events fired during startup are queued rather than lost.
 */
export function trackEvent<TName extends AnalyticsEventName>(
  name: TName,
  params: AnalyticsEventParamMap[TName]
): void {
  void getRuntime()
    .then((runtime) => {
      if (!runtime) return
      runtime.logEvent(runtime.instance, name, sanitizeParams(params))
    })
    .catch((error: unknown) => {
      logDevWarning(`Failed to report "${name}".`, error)
    })
}

/** Attaches user-scoped properties so every subsequent event can be segmented by them. */
export function setAnalyticsUserProperties(properties: AnalyticsUserProperties): void {
  void getRuntime()
    .then((runtime) => {
      if (!runtime) return
      runtime.setUserProperties(runtime.instance, sanitizeParams(properties))
    })
    .catch((error: unknown) => {
      logDevWarning('Failed to set user properties.', error)
    })
}

/** Test-only: clears the memoised SDK promise so a fresh config can be picked up. */
export function resetAnalyticsForTesting(): void {
  runtimePromise = null
}

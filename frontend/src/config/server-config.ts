/**
 * Server configuration accessed from runtime config loaded via /config.js.
 */

import { getRuntimeConfig, type FirebaseRuntimeConfig } from './runtime-config'

export function isSingleTenantMode(): boolean {
  return getRuntimeConfig().SINGLE_TENANT_MODE
}

/** Credentials Firebase cannot initialise without. A partial block is treated as absent. */
const REQUIRED_FIREBASE_KEYS = ['apiKey', 'projectId', 'appId', 'measurementId'] as const

/**
 * Fully-configured Firebase credentials, or `undefined` when analytics should stay off.
 *
 * Single source of truth for the analytics gate: dev and staging ship a config.js with no
 * FIREBASE block, so nothing is tracked, no visitor is counted, and the SDK is never fetched.
 */
export function getFirebaseConfig(): FirebaseRuntimeConfig | undefined {
  const firebase = getRuntimeConfig().FIREBASE
  if (!firebase) return undefined

  const hasAllRequiredKeys = REQUIRED_FIREBASE_KEYS.every((key) => {
    const value = firebase[key]
    return typeof value === 'string' && value.trim().length > 0
  })

  return hasAllRequiredKeys ? firebase : undefined
}

export function isAnalyticsEnabled(): boolean {
  return getFirebaseConfig() !== undefined
}

export function isCaptchaEnabled(): boolean {
  return getRuntimeConfig().CAPTCHA_ENABLED === true
}

export function getRecaptchaSiteKey(): string {
  return getRuntimeConfig().RECAPTCHA_SITE_KEY ?? ''
}

export function shouldShowSupplyOutageCharts(): boolean {
  return getRuntimeConfig().SHOW_SUPPLY_OUTAGE_CHARTS === true
}

export function shouldShowStaffOverviewSupplyOutageCharts(): boolean {
  return getRuntimeConfig().SHOW_STAFF_OVERVIEW_SUPPLY_OUTAGE_CHARTS === true
}

export function shouldShowStaffOverviewNonSubmissionCharts(): boolean {
  return getRuntimeConfig().SHOW_STAFF_OVERVIEW_NON_SUBMISSION_CHARTS === true
}

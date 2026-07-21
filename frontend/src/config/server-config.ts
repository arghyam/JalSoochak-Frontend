/**
 * Server configuration accessed from runtime config loaded via /config.js.
 */

import { getRuntimeConfig } from './runtime-config'

export function isSingleTenantMode(): boolean {
  return getRuntimeConfig().SINGLE_TENANT_MODE
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

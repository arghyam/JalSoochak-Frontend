/**
 * Server configuration accessed from runtime config loaded via /config.js.
 */

import { getRuntimeConfig } from './runtime-config'

export function isSingleTenantMode(): boolean {
  return getRuntimeConfig().JALSOOCHAK_SERVER_MODE === 'single_tenant_mode'
}

export function getSingleTenantId(): number | null {
  const tenantId = getRuntimeConfig().JALSOOCHAK_TENANT_ID
  if (tenantId == null || tenantId === '') {
    return null
  }
  const parsed = Number.parseInt(String(tenantId), 10)
  return Number.isNaN(parsed) ? null : parsed
}

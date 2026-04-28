/**
 * Server configuration accessed from runtime config loaded via /config.js.
 */

import { getRuntimeConfig } from './runtime-config'

export function isSingleTenantMode(): boolean {
  return getRuntimeConfig().SINGLE_TENANT_MODE
}

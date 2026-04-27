/**
 * Server configuration accessed from runtime config loaded via /config.js.
 */

import { getRuntimeConfig } from './runtime-config'

export function isSingleTenantMode(): boolean {
  return getRuntimeConfig().JALSOOCHAK_SERVER_MODE === 'single_tenant_mode'
}

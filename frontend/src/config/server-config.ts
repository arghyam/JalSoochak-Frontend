/**
 * Server configuration accessed from environment variables.
 * __SERVER_MODE__ and __TENANT_ID__ are injected at build time by Vite via `define`,
 * and provided as globals in Jest via jest.config.cjs `globals`.
 */

declare const __SERVER_MODE__: string
declare const __TENANT_ID__: string

export function isSingleTenantMode(): boolean {
  return __SERVER_MODE__ === 'single_tenant_mode'
}

export function getSingleTenantId(): number | null {
  if (!__TENANT_ID__) {
    return null
  }
  const parsed = Number.parseInt(__TENANT_ID__, 10)
  return Number.isNaN(parsed) ? null : parsed
}

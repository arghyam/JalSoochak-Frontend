/**
 * Server configuration accessed from environment variables.
 * __SERVER_MODE__ is injected at build time by Vite via `define`,
 * and provided as a global in Jest via jest.config.cjs `globals`.
 */

declare const __SERVER_MODE__: string

export function isSingleTenantMode(): boolean {
  return __SERVER_MODE__ === 'single_tenant_mode'
}

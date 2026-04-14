import { describe, expect, it, afterEach } from '@jest/globals'

type ServerGlobals = { __SERVER_MODE__: string; __TENANT_ID__: string }

const g = globalThis as unknown as ServerGlobals

describe('server-config', () => {
  const modeBefore = g.__SERVER_MODE__
  const tenantBefore = g.__TENANT_ID__

  afterEach(() => {
    g.__SERVER_MODE__ = modeBefore
    g.__TENANT_ID__ = tenantBefore
    jest.resetModules()
  })

  it('isSingleTenantMode is true only when global matches single_tenant_mode', async () => {
    g.__SERVER_MODE__ = ''
    let { isSingleTenantMode } = await import('./server-config')
    expect(isSingleTenantMode()).toBe(false)

    jest.resetModules()
    g.__SERVER_MODE__ = 'single_tenant_mode'
    ;({ isSingleTenantMode } = await import('./server-config'))
    expect(isSingleTenantMode()).toBe(true)
  })

  it('getSingleTenantId returns null for empty or invalid tenant id global', async () => {
    g.__TENANT_ID__ = ''
    let { getSingleTenantId } = await import('./server-config')
    expect(getSingleTenantId()).toBeNull()

    jest.resetModules()
    g.__TENANT_ID__ = 'not-a-number'
    ;({ getSingleTenantId } = await import('./server-config'))
    expect(getSingleTenantId()).toBeNull()
  })

  it('getSingleTenantId parses numeric tenant id', async () => {
    g.__TENANT_ID__ = '42'
    const { getSingleTenantId } = await import('./server-config')
    expect(getSingleTenantId()).toBe(42)
  })
})

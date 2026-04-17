import { describe, expect, it, afterEach } from '@jest/globals'

type TestWindow = Window & {
  APP_CONFIG?: {
    JALSOOCHAK_SERVER_MODE?: string
    JALSOOCHAK_TENANT_ID?: string | number
  }
}

describe('server-config', () => {
  const w = window as TestWindow
  const appConfigBefore = w.APP_CONFIG

  afterEach(() => {
    w.APP_CONFIG = appConfigBefore
    jest.resetModules()
  })

  it('isSingleTenantMode is true only when runtime config matches single_tenant_mode', async () => {
    w.APP_CONFIG = { API_BASE_URL: '', JALSOOCHAK_SERVER_MODE: '' }
    let { isSingleTenantMode } = await import('./server-config')
    expect(isSingleTenantMode()).toBe(false)

    jest.resetModules()
    w.APP_CONFIG = { API_BASE_URL: '', JALSOOCHAK_SERVER_MODE: 'single_tenant_mode' }
    ;({ isSingleTenantMode } = await import('./server-config'))
    expect(isSingleTenantMode()).toBe(true)
  })

  it('getSingleTenantId returns null for empty or invalid tenant id runtime config', async () => {
    w.APP_CONFIG = { API_BASE_URL: '', JALSOOCHAK_TENANT_ID: '' }
    let { getSingleTenantId } = await import('./server-config')
    expect(getSingleTenantId()).toBeNull()

    jest.resetModules()
    w.APP_CONFIG = { API_BASE_URL: '', JALSOOCHAK_TENANT_ID: 'not-a-number' }
    ;({ getSingleTenantId } = await import('./server-config'))
    expect(getSingleTenantId()).toBeNull()
  })

  it('getSingleTenantId parses numeric tenant id', async () => {
    w.APP_CONFIG = { API_BASE_URL: '', JALSOOCHAK_TENANT_ID: '42' }
    const { getSingleTenantId } = await import('./server-config')
    expect(getSingleTenantId()).toBe(42)
  })
})

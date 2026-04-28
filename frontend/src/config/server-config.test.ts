import { describe, expect, it, afterEach } from '@jest/globals'

type TestWindow = Window & {
  APP_CONFIG?: {
    API_BASE_URL: string
    SINGLE_TENANT_MODE?: boolean
  }
}

describe('server-config', () => {
  const w = window as TestWindow
  const appConfigBefore = w.APP_CONFIG

  afterEach(() => {
    w.APP_CONFIG = appConfigBefore
    jest.resetModules()
  })

  it('isSingleTenantMode returns boolean value from SINGLE_TENANT_MODE config', async () => {
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false }
    let { isSingleTenantMode } = await import('./server-config')
    expect(isSingleTenantMode()).toBe(false)

    jest.resetModules()
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: true }
    ;({ isSingleTenantMode } = await import('./server-config'))
    expect(isSingleTenantMode()).toBe(true)
  })
})

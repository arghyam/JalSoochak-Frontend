import { describe, expect, it, afterEach } from '@jest/globals'

type TestWindow = Window & {
  APP_CONFIG?: {
    JALSOOCHAK_SERVER_MODE?: string
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
})

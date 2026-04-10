import { describe, expect, it } from '@jest/globals'
import { stateAdminQueryKeys } from './state-admin-query-keys'

describe('stateAdminQueryKeys', () => {
  it('builds stable staff list keys including params object', () => {
    const params = {
      roles: ['X'],
      page: 1,
      limit: 20,
      tenantCode: 'TN',
    }
    expect(stateAdminQueryKeys.staffList(params)).toEqual(['state-admin', 'staff-list', params])
  })

  it('includes tenant code in scheme counts key', () => {
    expect(stateAdminQueryKeys.schemeCounts('MH')).toEqual(['state-admin', 'scheme-counts', 'MH'])
  })
})

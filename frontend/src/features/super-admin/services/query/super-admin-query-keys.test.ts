import { describe, expect, it } from '@jest/globals'
import { superAdminQueryKeys } from './super-admin-query-keys'

describe('superAdminQueryKeys', () => {
  it('exposes stable root key', () => {
    expect(superAdminQueryKeys.all).toEqual(['super-admin'])
  })

  it('builds tenants summary and states keys', () => {
    expect(superAdminQueryKeys.tenantsSummary()).toEqual(['super-admin', 'tenants-summary'])
    expect(superAdminQueryKeys.statesUTs()).toEqual(['super-admin', 'states-uts'])
    expect(superAdminQueryKeys.statesUTsPaged(1, 20, 'mh', 'ACTIVE')).toEqual([
      'super-admin',
      'states-uts',
      1,
      20,
      'mh',
      'ACTIVE',
    ])
  })

  it('builds state admin and super user keys', () => {
    expect(superAdminQueryKeys.stateAdmins(1, 10, 'ann', 'all')).toEqual([
      'super-admin',
      'state-admins',
      1,
      10,
      'ann',
      'all',
    ])
    expect(superAdminQueryKeys.stateAdminsByTenant('TN')).toEqual([
      'super-admin',
      'state-admins',
      'by-tenant',
      'TN',
    ])
    expect(superAdminQueryKeys.superUsers(2, 25, 'active')).toEqual([
      'super-admin',
      'super-users',
      2,
      25,
      'active',
    ])
    expect(superAdminQueryKeys.superUserById('u1')).toEqual(['super-admin', 'super-users', 'u1'])
  })

  it('builds nested states-uts helper keys', () => {
    expect(superAdminQueryKeys.assignedStateNames()).toEqual([
      'super-admin',
      'states-uts',
      'assigned-state-names',
    ])
    expect(superAdminQueryKeys.stateUTOptions()).toEqual(['super-admin', 'states-uts', 'options'])
  })

  it('builds system configuration key', () => {
    expect(superAdminQueryKeys.systemConfiguration()).toEqual([
      'super-admin',
      'system-configuration',
    ])
  })
})

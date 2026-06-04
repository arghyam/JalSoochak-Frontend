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

  it('builds stable staff list keys with optional status parameter', () => {
    const params = {
      roles: ['X'],
      status: 'active',
      page: 1,
      limit: 20,
      tenantCode: 'TN',
    }
    expect(stateAdminQueryKeys.staffList(params)).toEqual(['state-admin', 'staff-list', params])
  })

  it('includes tenant code in scheme counts key', () => {
    expect(stateAdminQueryKeys.schemeCounts('MH')).toEqual(['state-admin', 'scheme-counts', 'MH'])
  })

  it('exposes stable root and simple configuration keys', () => {
    expect(stateAdminQueryKeys.all).toEqual(['state-admin'])
    expect(stateAdminQueryKeys.languageConfiguration()).toEqual([
      'state-admin',
      'language-configuration',
    ])
    expect(stateAdminQueryKeys.integrationConfiguration()).toEqual([
      'state-admin',
      'integration-configuration',
    ])
    expect(stateAdminQueryKeys.waterNormsConfiguration()).toEqual([
      'state-admin',
      'water-norms-configuration',
    ])
    expect(stateAdminQueryKeys.messageTemplates()).toEqual(['state-admin', 'message-templates'])
    expect(stateAdminQueryKeys.configuration()).toEqual(['state-admin', 'configuration'])
    expect(stateAdminQueryKeys.escalationRules()).toEqual(['state-admin', 'escalation-rules'])
    expect(stateAdminQueryKeys.lgdHierarchy()).toEqual(['state-admin', 'lgd-hierarchy'])
    expect(stateAdminQueryKeys.departmentHierarchy()).toEqual([
      'state-admin',
      'department-hierarchy',
    ])
    expect(stateAdminQueryKeys.lgdEditConstraints()).toEqual([
      'state-admin',
      'lgd-edit-constraints',
    ])
    expect(stateAdminQueryKeys.departmentEditConstraints()).toEqual([
      'state-admin',
      'department-edit-constraints',
    ])
    expect(stateAdminQueryKeys.configStatus()).toEqual(['state-admin', 'config-status'])
    expect(stateAdminQueryKeys.logo()).toEqual(['state-admin', 'logo'])
    expect(stateAdminQueryKeys.systemChannels()).toEqual(['system', 'channels'])
    expect(stateAdminQueryKeys.staffCounts()).toEqual(['state-admin', 'staff-counts'])
  })

  it('builds stable keys for state UT admin listings', () => {
    expect(stateAdminQueryKeys.stateUtAdmins(1, 20, 'acme', 'active')).toEqual([
      'state-admin',
      'state-ut-admins',
      1,
      20,
      'acme',
      'active',
    ])
    expect(stateAdminQueryKeys.stateUtAdminById('admin-1')).toEqual([
      'state-admin',
      'state-ut-admins',
      'admin-1',
    ])
  })

  it('builds stable scheme list and scheme mappings keys from params', () => {
    const schemeListParams = {
      tenantCode: 'MH',
      page: 1,
      limit: 10,
      schemeName: 'alpha',
    }
    expect(stateAdminQueryKeys.schemeList(schemeListParams)).toEqual([
      'state-admin',
      'scheme-list',
      schemeListParams,
    ])

    const schemeMappingsParams = {
      tenantCode: 'MH',
      page: 1,
      limit: 10,
      sortDir: 'asc',
    }
    expect(stateAdminQueryKeys.schemeMappingsList(schemeMappingsParams)).toEqual([
      'state-admin',
      'scheme-mappings-list',
      schemeMappingsParams,
    ])
  })
})

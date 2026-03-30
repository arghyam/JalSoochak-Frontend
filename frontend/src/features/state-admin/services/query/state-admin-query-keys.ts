export const stateAdminQueryKeys = {
  all: ['state-admin'] as const,
  languageConfiguration: () => [...stateAdminQueryKeys.all, 'language-configuration'] as const,
  integrationConfiguration: () =>
    [...stateAdminQueryKeys.all, 'integration-configuration'] as const,
  waterNormsConfiguration: () => [...stateAdminQueryKeys.all, 'water-norms-configuration'] as const,
  messageTemplates: () => [...stateAdminQueryKeys.all, 'message-templates'] as const,
  staffList: (params: {
    roles: string[]
    status?: string
    page: number
    limit: number
    tenantCode: string
  }) => [...stateAdminQueryKeys.all, 'staff-list', params] as const,
  configuration: () => [...stateAdminQueryKeys.all, 'configuration'] as const,
  stateUtAdmins: (page: number, size: number) =>
    [...stateAdminQueryKeys.all, 'state-ut-admins', page, size] as const,
  stateUtAdminById: (id: string) => [...stateAdminQueryKeys.all, 'state-ut-admins', id] as const,
  escalationRules: () => [...stateAdminQueryKeys.all, 'escalation-rules'] as const,
  lgdHierarchy: () => [...stateAdminQueryKeys.all, 'lgd-hierarchy'] as const,
  departmentHierarchy: () => [...stateAdminQueryKeys.all, 'department-hierarchy'] as const,
  lgdEditConstraints: () => [...stateAdminQueryKeys.all, 'lgd-edit-constraints'] as const,
  departmentEditConstraints: () =>
    [...stateAdminQueryKeys.all, 'department-edit-constraints'] as const,
  configStatus: () => [...stateAdminQueryKeys.all, 'config-status'] as const,
  logo: () => [...stateAdminQueryKeys.all, 'logo'] as const,
  staffCounts: () => [...stateAdminQueryKeys.all, 'staff-counts'] as const,
  schemeCounts: (tenantCode: string) =>
    [...stateAdminQueryKeys.all, 'scheme-counts', tenantCode] as const,
  schemeList: (params: {
    tenantCode: string
    page: number
    limit: number
    workStatus?: string
    operatingStatus?: string
  }) => [...stateAdminQueryKeys.all, 'scheme-list', params] as const,
  schemeMappingsList: (params: { tenantCode: string; page: number; limit: number }) =>
    [...stateAdminQueryKeys.all, 'scheme-mappings-list', params] as const,
}

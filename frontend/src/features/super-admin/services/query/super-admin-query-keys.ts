export const superAdminQueryKeys = {
  all: ['super-admin'] as const,
  overview: () => [...superAdminQueryKeys.all, 'overview'] as const,
  systemRulesConfiguration: () =>
    [...superAdminQueryKeys.all, 'system-rules-configuration'] as const,
  ingestionMonitor: (stateFilter: string, timeFilter: string) =>
    [...superAdminQueryKeys.all, 'ingestion-monitor', stateFilter, timeFilter] as const,
  apiCredentials: () => [...superAdminQueryKeys.all, 'api-credentials'] as const,
  statesUTs: () => [...superAdminQueryKeys.all, 'states-uts'] as const,
  statesUTsPaged: (page: number, size: number, search: string, status: string) =>
    [...superAdminQueryKeys.all, 'states-uts', page, size, search, status] as const,
  stateAdmins: (page: number, size: number) =>
    [...superAdminQueryKeys.all, 'state-admins', page, size] as const,
  stateAdminsByTenant: (tenantCode: string) =>
    [...superAdminQueryKeys.all, 'state-admins', 'by-tenant', tenantCode] as const,
  assignedStateNames: () => [...superAdminQueryKeys.statesUTs(), 'assigned-state-names'] as const,
  stateUTOptions: () => [...superAdminQueryKeys.statesUTs(), 'options'] as const,
  superUsers: (page: number, size: number) =>
    [...superAdminQueryKeys.all, 'super-users', page, size] as const,
  superUserById: (id: string) => [...superAdminQueryKeys.all, 'super-users', id] as const,
  systemConfiguration: () => [...superAdminQueryKeys.all, 'system-configuration'] as const,
  tenantsSummary: () => [...superAdminQueryKeys.all, 'tenants-summary'] as const,
}

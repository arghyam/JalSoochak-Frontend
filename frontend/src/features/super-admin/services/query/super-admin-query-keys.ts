export const superAdminQueryKeys = {
  all: ['super-admin'] as const,
  statesUTs: () => [...superAdminQueryKeys.all, 'states-uts'] as const,
  statesUTsPaged: (page: number, size: number, search: string, status: string) =>
    [...superAdminQueryKeys.all, 'states-uts', page, size, search, status] as const,
  stateAdmins: (page: number, size: number, name: string, status: string) =>
    [...superAdminQueryKeys.all, 'state-admins', page, size, name, status] as const,
  stateAdminsByTenant: (tenantCode: string) =>
    [...superAdminQueryKeys.all, 'state-admins', 'by-tenant', tenantCode] as const,
  assignedStateNames: () => [...superAdminQueryKeys.statesUTs(), 'assigned-state-names'] as const,
  stateUTOptions: () => [...superAdminQueryKeys.statesUTs(), 'options'] as const,
  superUsers: (page: number, size: number, status: string) =>
    [...superAdminQueryKeys.all, 'super-users', page, size, status] as const,
  superUserById: (id: string) => [...superAdminQueryKeys.all, 'super-users', id] as const,
  systemConfiguration: () => [...superAdminQueryKeys.all, 'system-configuration'] as const,
  tenantsSummary: () => [...superAdminQueryKeys.all, 'tenants-summary'] as const,
}

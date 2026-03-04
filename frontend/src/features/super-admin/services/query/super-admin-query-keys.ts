export const superAdminQueryKeys = {
  all: ['super-admin'] as const,
  overview: () => [...superAdminQueryKeys.all, 'overview'] as const,
  systemRulesConfiguration: () =>
    [...superAdminQueryKeys.all, 'system-rules-configuration'] as const,
  ingestionMonitor: (stateFilter: string, timeFilter: string) =>
    [...superAdminQueryKeys.all, 'ingestion-monitor', stateFilter, timeFilter] as const,
  apiCredentials: () => [...superAdminQueryKeys.all, 'api-credentials'] as const,
  statesUTs: () => [...superAdminQueryKeys.all, 'states-uts'] as const,
  stateAdmins: () => [...superAdminQueryKeys.all, 'state-admins'] as const,
  stateUTById: (id: string) => [...superAdminQueryKeys.statesUTs(), id] as const,
  assignedStateNames: () => [...superAdminQueryKeys.statesUTs(), 'assigned-state-names'] as const,
  stateUTOptions: () => [...superAdminQueryKeys.statesUTs(), 'options'] as const,
}

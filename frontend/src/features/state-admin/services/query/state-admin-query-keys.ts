export const stateAdminQueryKeys = {
  all: ['state-admin'] as const,
  overview: () => [...stateAdminQueryKeys.all, 'overview'] as const,
  activity: () => [...stateAdminQueryKeys.all, 'activity'] as const,
  languageConfiguration: () => [...stateAdminQueryKeys.all, 'language-configuration'] as const,
  integrationConfiguration: () =>
    [...stateAdminQueryKeys.all, 'integration-configuration'] as const,
  waterNormsConfiguration: () => [...stateAdminQueryKeys.all, 'water-norms-configuration'] as const,
  escalations: () => [...stateAdminQueryKeys.all, 'escalations'] as const,
  escalationById: (id: string) => [...stateAdminQueryKeys.escalations(), id] as const,
  thresholdConfiguration: () => [...stateAdminQueryKeys.all, 'threshold-configuration'] as const,
  nudgeTemplates: () => [...stateAdminQueryKeys.all, 'nudge-templates'] as const,
  staffSync: () => [...stateAdminQueryKeys.all, 'staff-sync'] as const,
}

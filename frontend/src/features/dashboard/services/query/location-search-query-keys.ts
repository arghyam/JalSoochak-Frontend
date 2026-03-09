export const locationSearchQueryKeys = {
  all: ['dashboard', 'location-search'] as const,
  statesUts: () => ['dashboard', 'location-search', 'states-uts'] as const,
  tenants: () => ['dashboard', 'location-search', 'tenants'] as const,
}

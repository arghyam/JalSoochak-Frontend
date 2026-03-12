export const locationSearchQueryKeys = {
  all: ['dashboard', 'location-search'] as const,
  statesUts: () => ['dashboard', 'location-search', 'states-uts'] as const,
  hierarchy: (tenantId?: number, hierarchyType?: string) =>
    ['dashboard', 'location-search', 'hierarchy', tenantId, hierarchyType] as const,
  children: (tenantId?: number, hierarchyType?: string, parentId?: number) =>
    ['dashboard', 'location-search', 'children', tenantId, hierarchyType, parentId] as const,
}

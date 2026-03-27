export const locationSearchQueryKeys = {
  all: ['dashboard', 'location-search'] as const,
  statesUts: () => ['dashboard', 'location-search', 'states-uts'] as const,
  hierarchy: (tenantId?: number, hierarchyType?: string) =>
    ['dashboard', 'location-search', 'hierarchy', tenantId, hierarchyType] as const,
  children: (tenantId?: number, hierarchyType?: string, parentId?: number) =>
    ['dashboard', 'location-search', 'children', tenantId, hierarchyType, parentId] as const,
  districtSchemeBlockLookup: (tenantId?: number, hierarchyType?: string, districtId?: number) =>
    [
      'dashboard',
      'location-search',
      'district-scheme-block-lookup',
      tenantId,
      hierarchyType,
      districtId,
    ] as const,
  blockSchemePanchayatLookup: (tenantId?: number, hierarchyType?: string, blockId?: number) =>
    [
      'dashboard',
      'location-search',
      'block-scheme-panchayat-lookup',
      tenantId,
      hierarchyType,
      blockId,
    ] as const,
}

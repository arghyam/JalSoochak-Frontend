export const sectionOfficerQueryKeys = {
  all: ['section-officer'] as const,
  schemesList: (personId: string, page: number, pageSize: number, schemeName: string) =>
    [...sectionOfficerQueryKeys.all, 'schemes', personId, page, pageSize, schemeName] as const,
  schemeDetails: (schemeId: string) =>
    [...sectionOfficerQueryKeys.all, 'scheme-details', schemeId] as const,
  schemeReadings: (schemeId: string, page: number, pageSize: number) =>
    [...sectionOfficerQueryKeys.all, 'scheme-readings', schemeId, page, pageSize] as const,
}

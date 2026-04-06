export const sectionOfficerQueryKeys = {
  all: ['section-officer'] as const,
  schemesList: (personId: string, page: number, pageSize: number, schemeName: string) =>
    [...sectionOfficerQueryKeys.all, 'schemes', personId, page, pageSize, schemeName] as const,
  schemeDetails: (schemeId: string) =>
    [...sectionOfficerQueryKeys.all, 'scheme-details', schemeId] as const,
  schemeReadings: (schemeId: string, page: number, pageSize: number) =>
    [...sectionOfficerQueryKeys.all, 'scheme-readings', schemeId, page, pageSize] as const,
  pumpOperatorsList: (
    personId: string,
    page: number,
    pageSize: number,
    name: string,
    status: string,
    startDate: string,
    endDate: string
  ) =>
    [
      ...sectionOfficerQueryKeys.all,
      'pump-operators',
      personId,
      page,
      pageSize,
      name,
      status,
      startDate,
      endDate,
    ] as const,
  pumpOperatorDetails: (operatorId: string) =>
    [...sectionOfficerQueryKeys.all, 'pump-operator-details', operatorId] as const,
  pumpOperatorReadings: (operatorId: string, page: number, pageSize: number, schemeName: string) =>
    [
      ...sectionOfficerQueryKeys.all,
      'pump-operator-readings',
      operatorId,
      page,
      pageSize,
      schemeName,
    ] as const,
}

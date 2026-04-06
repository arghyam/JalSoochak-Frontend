export const sectionOfficerQueryKeys = {
  all: ['section-officer'] as const,
  schemesList: (
    tenantCode: string,
    personId: string,
    page: number,
    pageSize: number,
    schemeName: string
  ) =>
    [
      ...sectionOfficerQueryKeys.all,
      'schemes',
      tenantCode,
      personId,
      page,
      pageSize,
      schemeName,
    ] as const,
  schemeDetails: (tenantCode: string, schemeId: string) =>
    [...sectionOfficerQueryKeys.all, 'scheme-details', tenantCode, schemeId] as const,
  schemeReadings: (tenantCode: string, schemeId: string, page: number, pageSize: number) =>
    [
      ...sectionOfficerQueryKeys.all,
      'scheme-readings',
      tenantCode,
      schemeId,
      page,
      pageSize,
    ] as const,
  pumpOperatorsList: (
    tenantCode: string,
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
      tenantCode,
      personId,
      page,
      pageSize,
      name,
      status,
      startDate,
      endDate,
    ] as const,
  pumpOperatorDetails: (tenantCode: string, operatorId: string) =>
    [...sectionOfficerQueryKeys.all, 'pump-operator-details', tenantCode, operatorId] as const,
  pumpOperatorReadings: (
    tenantCode: string,
    operatorId: string,
    page: number,
    pageSize: number,
    schemeName: string
  ) =>
    [
      ...sectionOfficerQueryKeys.all,
      'pump-operator-readings',
      tenantCode,
      operatorId,
      page,
      pageSize,
      schemeName,
    ] as const,
}

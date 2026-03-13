import type { AverageWaterSupplyPerRegionQueryParams, DashboardLevel } from '../../types'

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  data: (level: DashboardLevel, entityId?: string) =>
    ['dashboard', 'data', level, entityId] as const,
  averageWaterSupplyPerRegion: (params: AverageWaterSupplyPerRegionQueryParams | null) =>
    [
      'dashboard',
      'analytics',
      'average-water-supply-per-region',
      params?.tenantId,
      params?.parentLgdId,
      params?.parentDepartmentId,
      params?.scope,
      params?.startDate,
      params?.endDate,
    ] as const,
}

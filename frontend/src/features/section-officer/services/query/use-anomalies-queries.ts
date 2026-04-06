import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth-store'
import { anomaliesApi } from '../api/anomalies-api'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

export function useAnomaliesListQuery(
  page: number,
  pageSize: number,
  schemeName: string,
  status: string,
  startDate: string,
  endDate: string
) {
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.anomaliesList(
      userId,
      tenantId,
      page,
      pageSize,
      schemeName,
      status,
      startDate,
      endDate
    ),
    queryFn: () =>
      anomaliesApi.getAnomaliesList({
        userId,
        tenantId,
        page,
        limit: pageSize,
        schemeName: schemeName || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: Boolean(userId) && Boolean(tenantId),
    placeholderData: keepPreviousData,
  })
}

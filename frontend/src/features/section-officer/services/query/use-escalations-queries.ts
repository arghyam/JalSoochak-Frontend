import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth-store'
import { escalationsApi } from '../api/escalations-api'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

export function useEscalationStatusesQuery() {
  return useQuery({
    queryKey: sectionOfficerQueryKeys.escalationStatuses(),
    queryFn: () => escalationsApi.getEscalationStatuses(),
    staleTime: Infinity,
  })
}

export function useEscalationsListQuery(
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
    queryKey: sectionOfficerQueryKeys.escalationsList(
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
      escalationsApi.getEscalationsList({
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

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth-store'
import { pumpOperatorsApi } from '../api/pump-operators-api'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

export function usePumpOperatorsListQuery(
  page: number,
  pageSize: number,
  name: string,
  status: string,
  startDate: string,
  endDate: string
) {
  const personId = useAuthStore((state) => state.user?.personId ?? '')
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.pumpOperatorsList(
      personId,
      page,
      pageSize,
      name,
      status,
      startDate,
      endDate
    ),
    queryFn: () =>
      pumpOperatorsApi.getPumpOperatorsList({
        personId,
        tenantCode,
        page: page - 1,
        size: pageSize,
        name: name || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: Boolean(personId) && Boolean(tenantCode),
    placeholderData: keepPreviousData,
  })
}

export function usePumpOperatorDetailsQuery(operatorId: string | undefined) {
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.pumpOperatorDetails(operatorId ?? ''),
    queryFn: () => pumpOperatorsApi.getPumpOperatorDetails({ operatorId: operatorId!, tenantCode }),
    enabled: Boolean(operatorId) && Boolean(tenantCode),
  })
}

export function usePumpOperatorReadingsQuery(
  operatorId: string | undefined,
  page: number,
  pageSize: number,
  schemeName: string
) {
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.pumpOperatorReadings(
      operatorId ?? '',
      page,
      pageSize,
      schemeName
    ),
    queryFn: () =>
      pumpOperatorsApi.getPumpOperatorReadings({
        operatorId: operatorId!,
        tenantCode,
        page: page - 1,
        size: pageSize,
        schemeName: schemeName || undefined,
      }),
    enabled: Boolean(operatorId) && Boolean(tenantCode),
  })
}

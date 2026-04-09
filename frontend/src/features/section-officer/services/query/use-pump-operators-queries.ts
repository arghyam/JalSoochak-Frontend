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
      tenantCode,
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
    queryKey: sectionOfficerQueryKeys.pumpOperatorDetails(tenantCode, operatorId ?? ''),
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
      tenantCode,
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

const getAttendanceDateRange = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const startDate = new Date(yesterday)
  startDate.setDate(startDate.getDate() - 89) // 90 days total including yesterday

  const format = (d: Date) => d.toISOString().split('T')[0]
  return { startDate: format(startDate), endDate: format(yesterday) }
}

export function useOperatorAttendanceQuery(uuid: string | undefined) {
  const { startDate, endDate } = getAttendanceDateRange()

  return useQuery({
    queryKey: sectionOfficerQueryKeys.operatorAttendance(uuid ?? '', startDate, endDate),
    queryFn: () => {
      if (!uuid) {
        return Promise.reject(new Error('Missing operator uuid'))
      }
      return pumpOperatorsApi.getOperatorAttendance({
        uuid,
        startDate,
        endDate,
      })
    },
    enabled: false,
  })
}

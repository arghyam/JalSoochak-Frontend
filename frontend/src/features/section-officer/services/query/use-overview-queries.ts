import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth-store'
import { overviewApi } from '../api/overview-api'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

export function useSchemesCountQuery() {
  const personId = useAuthStore((state) => state.user?.personId ?? '')
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.schemesCount(personId, tenantCode),
    queryFn: () => overviewApi.getSchemesCount(personId, tenantCode),
    enabled: Boolean(personId) && Boolean(tenantCode),
  })
}

export function useOutageReasonsQuery(startDate: string, endDate: string) {
  return useQuery({
    queryKey: sectionOfficerQueryKeys.outageReasons(startDate, endDate),
    queryFn: () => overviewApi.getOutageReasons(startDate, endDate),
    enabled: Boolean(startDate) && Boolean(endDate),
  })
}

export function useNonSubmissionReasonsQuery(startDate: string, endDate: string) {
  return useQuery({
    queryKey: sectionOfficerQueryKeys.nonSubmissionReasons(startDate, endDate),
    queryFn: () => overviewApi.getNonSubmissionReasons(startDate, endDate),
    enabled: Boolean(startDate) && Boolean(endDate),
  })
}

export function useSubmissionStatusQuery(startDate: string, endDate: string) {
  return useQuery({
    queryKey: sectionOfficerQueryKeys.submissionStatus(startDate, endDate),
    queryFn: () => overviewApi.getSubmissionStatus(startDate, endDate),
    enabled: Boolean(startDate) && Boolean(endDate),
  })
}

export function useDashboardStatsQuery(startDate: string, endDate: string) {
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? '')
  const userId = useAuthStore((state) => state.user?.id ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.dashboardStats(tenantId, userId, startDate, endDate),
    queryFn: () => overviewApi.getDashboardStats(tenantId, userId, startDate, endDate),
    enabled: Boolean(tenantId) && Boolean(userId) && Boolean(startDate) && Boolean(endDate),
  })
}

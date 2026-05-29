import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth-store'
import { fixReadingsApi } from '../api/fix-readings-api'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'
import type { UpdateFinalReadingPayload } from '../../types/fix-readings'

export function useYesterdayFinalReadingsQuery(schemeName: string) {
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')
  const normalized = schemeName.trim()
  return useQuery({
    queryKey: sectionOfficerQueryKeys.yesterdayFinalReadings(tenantCode, normalized),
    queryFn: () => fixReadingsApi.searchSchemes(normalized, tenantCode),
    enabled: normalized.length >= 1 && tenantCode.length > 0,
  })
}

export function useUpdateFinalReadingMutation() {
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')
  return useMutation({
    mutationFn: ({ schemeId, payload }: { schemeId: number; payload: UpdateFinalReadingPayload }) =>
      fixReadingsApi.updateFinalReading(schemeId, payload, tenantCode),
  })
}

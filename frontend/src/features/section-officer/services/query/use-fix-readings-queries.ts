import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth-store'
import { fixReadingsApi, UpdateFinalReadingError } from '../api/fix-readings-api'
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
  return useMutation({
    mutationFn: ({ schemeId, payload }: { schemeId: number; payload: UpdateFinalReadingPayload }) =>
      fixReadingsApi.updateFinalReading(schemeId, payload),
    onError: (error) => {
      // The axios interceptor already attempted a refresh; a 401 here means the token is
      // unrecoverable, so end the session and let ProtectedRoute send the user to login.
      if (error instanceof UpdateFinalReadingError && error.kind === 'unauthorized') {
        useAuthStore.getState().setSessionExpired()
      }
    },
  })
}

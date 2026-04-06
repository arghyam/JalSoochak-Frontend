import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth-store'
import { schemesApi } from '../api/schemes-api'
import { sectionOfficerQueryKeys } from './section-officer-query-keys'

export function useSchemesListQuery(page: number, pageSize: number, schemeName: string) {
  const personId = useAuthStore((state) => state.user?.personId ?? '')
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.schemesList(tenantCode, personId, page, pageSize, schemeName),
    queryFn: () =>
      schemesApi.getSchemesList({
        personId,
        tenantCode,
        page: page - 1,
        size: pageSize,
        schemeName: schemeName || undefined,
      }),
    enabled: Boolean(personId) && Boolean(tenantCode),
    placeholderData: keepPreviousData,
  })
}

export function useSchemeDetailsQuery(schemeId: string | undefined) {
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.schemeDetails(tenantCode, schemeId ?? ''),
    queryFn: () => schemesApi.getSchemeDetails({ schemeId: schemeId!, tenantCode }),
    enabled: Boolean(schemeId) && Boolean(tenantCode),
  })
}

export function useSchemeReadingsQuery(
  schemeId: string | undefined,
  page: number,
  pageSize: number
) {
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')

  return useQuery({
    queryKey: sectionOfficerQueryKeys.schemeReadings(tenantCode, schemeId ?? '', page, pageSize),
    queryFn: () =>
      schemesApi.getSchemeReadings({
        schemeId: schemeId!,
        tenantCode,
        page: page - 1,
        size: pageSize,
      }),
    enabled: Boolean(schemeId) && Boolean(tenantCode),
  })
}

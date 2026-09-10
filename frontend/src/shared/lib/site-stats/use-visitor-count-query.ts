import { useQuery } from '@tanstack/react-query'
import { isAnalyticsEnabled } from '@/config/server-config'
import { registerVisitAndGetCount } from './site-stats-api'

export const siteStatsQueryKeys = {
  all: ['site-stats'] as const,
  visitors: () => [...siteStatsQueryKeys.all, 'visitors'] as const,
}

/**
 * Counts this session once and reads the public visitor total.
 *
 * `enabled` carries the production gate, so an unconfigured deployment issues no request at
 * all. The count is fetched once per page load and never refetched — it is a footer vanity
 * number, not live data worth polling for.
 */
export function useVisitorCountQuery() {
  return useQuery({
    queryKey: siteStatsQueryKeys.visitors(),
    queryFn: registerVisitAndGetCount,
    enabled: isAnalyticsEnabled(),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })
}

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { OnboardedRegionsQueryParams, OnboardedRegionsResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseOnboardedRegionsQueryOptions = {
  params: OnboardedRegionsQueryParams | null
  enabled?: boolean
}

/**
 * Which children of one parent the dashboard may show (phased rollout). Callers must treat
 * loading and error as "unresolved" and hide the children: see `toOnboardedPredicate`.
 */
export function useOnboardedRegionsQuery(options: UseOnboardedRegionsQueryOptions) {
  const { params, enabled = true } = options

  const query = useQuery<OnboardedRegionsResponse>({
    queryKey: dashboardQueryKeys.onboardedRegions(params),
    queryFn: () => {
      if (!params) {
        throw new Error('onboarded regions params are required')
      }

      return dashboardApi.getOnboardedRegions(params)
    },
    enabled: enabled && Boolean(params),
    // A 404 means the parent isn't onboarded; retrying can't change that.
    retry: false,
  })

  // A failed refetch keeps the last successful list in `data`. Drop it so the dashboard fails
  // closed instead of trusting a list the server no longer confirms; `error` stays available.
  return query.isError ? { ...query, data: undefined } : query
}

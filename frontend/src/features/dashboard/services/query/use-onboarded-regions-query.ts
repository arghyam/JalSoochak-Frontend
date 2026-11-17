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

  return useQuery<OnboardedRegionsResponse>({
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
}

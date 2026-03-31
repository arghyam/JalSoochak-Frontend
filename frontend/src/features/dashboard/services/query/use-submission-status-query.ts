import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { SubmissionStatusQueryParams, SubmissionStatusResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseSubmissionStatusQueryOptions = {
  params: SubmissionStatusQueryParams | null
  enabled?: boolean
}

export function useSubmissionStatusQuery(options: UseSubmissionStatusQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<SubmissionStatusResponse>({
    queryKey: dashboardQueryKeys.submissionStatus(params),
    queryFn: () => {
      if (!params) {
        throw new Error('submission status params are required')
      }

      return dashboardApi.getSubmissionStatus(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}

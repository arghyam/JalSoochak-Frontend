import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { ReadingSubmissionRateQueryParams, ReadingSubmissionRateResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseReadingSubmissionRateQueryOptions = {
  params: ReadingSubmissionRateQueryParams | null
  enabled?: boolean
}

export function useReadingSubmissionRateQuery(options: UseReadingSubmissionRateQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<ReadingSubmissionRateResponse>({
    queryKey: dashboardQueryKeys.readingSubmissionRate(params),
    queryFn: () => {
      if (!params) {
        throw new Error('reading submission rate params are required')
      }

      return dashboardApi.getReadingSubmissionRate(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}

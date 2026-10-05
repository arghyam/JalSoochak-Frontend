import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type {
  HourlySubmissionActivityQueryParams,
  HourlySubmissionActivityResponse,
} from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseHourlySubmissionActivityQueryOptions = {
  params: HourlySubmissionActivityQueryParams | null
  enabled?: boolean
}

export function useHourlySubmissionActivityQuery(options: UseHourlySubmissionActivityQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<HourlySubmissionActivityResponse>({
    queryKey: dashboardQueryKeys.hourlySubmissionActivity(params),
    queryFn: () => {
      if (!params) {
        throw new Error('hourly submission activity params are required')
      }

      return dashboardApi.getHourlySubmissionActivity(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}

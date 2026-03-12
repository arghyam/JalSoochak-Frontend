import { useQuery } from '@tanstack/react-query'
import { locationSearchApi } from '../api/location-search-api'
import type { StateUtSearchResponse } from '../../types'
import { locationSearchQueryKeys } from './location-search-query-keys'

type UseLocationSearchQueryOptions = {
  enabled?: boolean
  trigger?: number
}

export function useLocationSearchQuery(options: UseLocationSearchQueryOptions = {}) {
  const { enabled = true, trigger = 0 } = options

  return useQuery<StateUtSearchResponse>({
    queryKey: locationSearchQueryKeys.statesUts(trigger),
    queryFn: () => locationSearchApi.getStatesUts(),
    enabled,
  })
}

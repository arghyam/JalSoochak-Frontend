import { useQuery } from '@tanstack/react-query'
import { locationSearchApi } from '../api/location-search-api'
import type { StateUtSearchResponse } from '../../types'
import { locationSearchQueryKeys } from './location-search-query-keys'

type UseLocationSearchQueryOptions = {
  enabled?: boolean
}

export function useLocationSearchQuery(options: UseLocationSearchQueryOptions = {}) {
  const { enabled = true } = options

  return useQuery<StateUtSearchResponse>({
    queryKey: locationSearchQueryKeys.statesUts(),
    queryFn: () => locationSearchApi.getStatesUts(),
    enabled,
  })
}

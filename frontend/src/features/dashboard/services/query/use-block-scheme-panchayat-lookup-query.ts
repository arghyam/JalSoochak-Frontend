import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { HierarchyType } from '../api/dashboard-api'
import {
  addLocationTitleToLookup,
  createLocationTitleLookup,
  type LocationTitleLookup,
} from './location-title-lookup'
import { locationSearchQueryKeys } from './location-search-query-keys'

type UseBlockSchemePanchayatLookupQueryOptions = {
  tenantId?: number
  hierarchyType: HierarchyType
  blockId?: number
  tenantCode?: string
  enabled?: boolean
}

const VILLAGE_LOOKUP_CONCURRENCY = 5

export function useBlockSchemePanchayatLookupQuery(
  options: UseBlockSchemePanchayatLookupQueryOptions
) {
  const { tenantId, hierarchyType, blockId, tenantCode, enabled = true } = options

  return useQuery<LocationTitleLookup>({
    queryKey: locationSearchQueryKeys.blockSchemePanchayatLookup(tenantId, hierarchyType, blockId),
    queryFn: async () => {
      if (tenantId === undefined || blockId === undefined) {
        throw new Error('tenantId and blockId are required for block scheme panchayat lookup')
      }

      const gramPanchayatsResponse = await dashboardApi.getTenantChildLocations({
        tenantId,
        hierarchyType,
        parentId: blockId,
        tenantCode,
      })

      const gramPanchayats = gramPanchayatsResponse.data ?? []
      const lookup = createLocationTitleLookup()

      for (let index = 0; index < gramPanchayats.length; index += VILLAGE_LOOKUP_CONCURRENCY) {
        const gramPanchayatChunk = gramPanchayats.slice(index, index + VILLAGE_LOOKUP_CONCURRENCY)

        await Promise.all(
          gramPanchayatChunk.map(async (gramPanchayat) => {
            const gramPanchayatId =
              typeof gramPanchayat.id === 'number' ? gramPanchayat.id : undefined
            const gramPanchayatTitle = gramPanchayat.title?.trim() ?? ''

            addLocationTitleToLookup(lookup, gramPanchayat, gramPanchayatTitle)

            if (gramPanchayatId === undefined) {
              return
            }

            const villagesResponse = await dashboardApi.getTenantChildLocations({
              tenantId,
              hierarchyType,
              parentId: gramPanchayatId,
              tenantCode,
            })

            for (const village of villagesResponse.data ?? []) {
              addLocationTitleToLookup(lookup, village, gramPanchayatTitle)
            }
          })
        )
      }

      return lookup
    },
    enabled: enabled && tenantId !== undefined && blockId !== undefined,
  })
}

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { HierarchyType } from '../api/dashboard-api'
import {
  addLocationTitleToLookup,
  createLocationTitleLookup,
  type LocationTitleLookup,
} from './location-title-lookup'
import { locationSearchQueryKeys } from './location-search-query-keys'

type UseDistrictSchemeBlockLookupQueryOptions = {
  tenantId?: number
  hierarchyType: HierarchyType
  districtId?: number
  tenantCode?: string
  enabled?: boolean
}

const LOCATION_LOOKUP_CONCURRENCY = 5

export function useDistrictSchemeBlockLookupQuery(
  options: UseDistrictSchemeBlockLookupQueryOptions
) {
  const { tenantId, hierarchyType, districtId, tenantCode, enabled = true } = options

  return useQuery<LocationTitleLookup>({
    queryKey: locationSearchQueryKeys.districtSchemeBlockLookup(
      tenantId,
      hierarchyType,
      districtId
    ),
    queryFn: async () => {
      if (tenantId === undefined || districtId === undefined) {
        throw new Error('tenantId and districtId are required for district scheme block lookup')
      }

      const blocksResponse = await dashboardApi.getTenantChildLocations({
        tenantId,
        hierarchyType,
        parentId: districtId,
        tenantCode,
      })

      const blocks = blocksResponse.data ?? []
      const lookup = createLocationTitleLookup()

      for (
        let blockIndex = 0;
        blockIndex < blocks.length;
        blockIndex += LOCATION_LOOKUP_CONCURRENCY
      ) {
        const blockChunk = blocks.slice(blockIndex, blockIndex + LOCATION_LOOKUP_CONCURRENCY)

        await Promise.all(
          blockChunk.map(async (block) => {
            const blockId = typeof block.id === 'number' ? block.id : undefined
            const blockTitle = block.title?.trim() ?? ''

            addLocationTitleToLookup(lookup, block, blockTitle)

            if (blockId === undefined) {
              return
            }

            const gramPanchayatsResponse = await dashboardApi.getTenantChildLocations({
              tenantId,
              hierarchyType,
              parentId: blockId,
              tenantCode,
            })

            const gramPanchayats = gramPanchayatsResponse.data ?? []

            for (
              let gramPanchayatIndex = 0;
              gramPanchayatIndex < gramPanchayats.length;
              gramPanchayatIndex += LOCATION_LOOKUP_CONCURRENCY
            ) {
              const gramPanchayatChunk = gramPanchayats.slice(
                gramPanchayatIndex,
                gramPanchayatIndex + LOCATION_LOOKUP_CONCURRENCY
              )

              await Promise.all(
                gramPanchayatChunk.map(async (gramPanchayat) => {
                  const gramPanchayatId =
                    typeof gramPanchayat.id === 'number' ? gramPanchayat.id : undefined

                  addLocationTitleToLookup(lookup, gramPanchayat, blockTitle)

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
                    addLocationTitleToLookup(lookup, village, blockTitle)
                  }
                })
              )
            }
          })
        )
      }

      return lookup
    },
    enabled: enabled && tenantId !== undefined && districtId !== undefined,
  })
}

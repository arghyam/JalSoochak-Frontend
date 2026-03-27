import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { HierarchyType, TenantChildLocation } from '../api/dashboard-api'
import { locationSearchQueryKeys } from './location-search-query-keys'

type BlockSchemePanchayatLookup = Record<number, string>

type UseBlockSchemePanchayatLookupQueryOptions = {
  tenantId?: number
  hierarchyType: HierarchyType
  blockId?: number
  tenantCode?: string
  enabled?: boolean
}

const VILLAGE_LOOKUP_CONCURRENCY = 5

const addLocationToLookup = (
  lookup: BlockSchemePanchayatLookup,
  location: TenantChildLocation,
  gramPanchayatTitle: string
) => {
  if (!gramPanchayatTitle) {
    return
  }

  if (typeof location.id === 'number' && Number.isFinite(location.id)) {
    lookup[location.id] = gramPanchayatTitle
  }

  if (typeof location.lgdCode === 'number' && Number.isFinite(location.lgdCode)) {
    lookup[location.lgdCode] = gramPanchayatTitle
  }
}

export function useBlockSchemePanchayatLookupQuery(
  options: UseBlockSchemePanchayatLookupQueryOptions
) {
  const { tenantId, hierarchyType, blockId, tenantCode, enabled = true } = options

  return useQuery<BlockSchemePanchayatLookup>({
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
      const lookup: BlockSchemePanchayatLookup = {}

      for (let index = 0; index < gramPanchayats.length; index += VILLAGE_LOOKUP_CONCURRENCY) {
        const gramPanchayatChunk = gramPanchayats.slice(index, index + VILLAGE_LOOKUP_CONCURRENCY)

        await Promise.all(
          gramPanchayatChunk.map(async (gramPanchayat) => {
            const gramPanchayatId =
              typeof gramPanchayat.id === 'number' ? gramPanchayat.id : undefined
            const gramPanchayatTitle = gramPanchayat.title?.trim() ?? ''

            addLocationToLookup(lookup, gramPanchayat, gramPanchayatTitle)

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
              addLocationToLookup(lookup, village, gramPanchayatTitle)
            }
          })
        )
      }

      return lookup
    },
    enabled: enabled && tenantId !== undefined && blockId !== undefined,
  })
}

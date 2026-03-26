import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { HierarchyType, TenantChildLocation } from '../api/dashboard-api'
import { locationSearchQueryKeys } from './location-search-query-keys'

type DistrictSchemeBlockLookup = Record<number, string>

type UseDistrictSchemeBlockLookupQueryOptions = {
  tenantId?: number
  hierarchyType: HierarchyType
  districtId?: number
  tenantCode?: string
  enabled?: boolean
}

const addLocationToLookup = (
  lookup: DistrictSchemeBlockLookup,
  location: TenantChildLocation,
  blockTitle: string
) => {
  if (!blockTitle) {
    return
  }

  if (typeof location.id === 'number' && Number.isFinite(location.id)) {
    lookup[location.id] = blockTitle
  }

  if (typeof location.lgdCode === 'number' && Number.isFinite(location.lgdCode)) {
    lookup[location.lgdCode] = blockTitle
  }
}

export function useDistrictSchemeBlockLookupQuery(
  options: UseDistrictSchemeBlockLookupQueryOptions
) {
  const { tenantId, hierarchyType, districtId, tenantCode, enabled = true } = options

  return useQuery<DistrictSchemeBlockLookup>({
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
      const lookup: DistrictSchemeBlockLookup = {}

      await Promise.all(
        blocks.map(async (block) => {
          const blockId = typeof block.id === 'number' ? block.id : undefined
          const blockTitle = block.title?.trim() ?? ''

          addLocationToLookup(lookup, block, blockTitle)

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

          await Promise.all(
            gramPanchayats.map(async (gramPanchayat) => {
              const gramPanchayatId =
                typeof gramPanchayat.id === 'number' ? gramPanchayat.id : undefined

              addLocationToLookup(lookup, gramPanchayat, blockTitle)

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
                addLocationToLookup(lookup, village, blockTitle)
              }
            })
          )
        })
      )

      return lookup
    },
    enabled: enabled && tenantId !== undefined && districtId !== undefined,
  })
}

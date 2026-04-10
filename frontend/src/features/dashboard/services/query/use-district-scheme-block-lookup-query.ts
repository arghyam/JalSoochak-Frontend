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
  /** Accepts numeric strings for stable cache keys after normalization. */
  targetLgdIds?: (number | string)[]
  tenantCode?: string
  enabled?: boolean
}

function normalizePositiveTargetLgdIds(
  targetLgdIds: readonly (number | string)[] | undefined
): number[] {
  return Array.from(
    new Set(
      (targetLgdIds ?? [])
        .map((locationId) => {
          if (typeof locationId === 'number') {
            return Number.isFinite(locationId) && locationId > 0 ? locationId : NaN
          }
          if (typeof locationId === 'string') {
            const trimmed = locationId.trim()
            if (!trimmed) return NaN
            const parsed = Number(trimmed)
            return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN
          }
          return NaN
        })
        .filter((n): n is number => Number.isFinite(n))
    )
  ).sort((left, right) => left - right)
}

export function useDistrictSchemeBlockLookupQuery(
  options: UseDistrictSchemeBlockLookupQueryOptions
) {
  const { tenantId, hierarchyType, districtId, targetLgdIds, tenantCode, enabled = true } = options
  const normalizedTargetLgdIds = normalizePositiveTargetLgdIds(targetLgdIds)
  const targetLgdIdsKey =
    normalizedTargetLgdIds.length > 0 ? normalizedTargetLgdIds.join(',') : undefined

  return useQuery<LocationTitleLookup>({
    queryKey: locationSearchQueryKeys.districtSchemeBlockLookup(
      tenantId,
      hierarchyType,
      districtId,
      targetLgdIdsKey
    ),
    queryFn: async () => {
      if (tenantId === undefined || districtId === undefined) {
        throw new Error('tenantId and districtId are required for district scheme block lookup')
      }

      if (normalizedTargetLgdIds.length === 0) {
        return createLocationTitleLookup()
      }

      const blocksResponse = await dashboardApi.getTenantChildLocations({
        tenantId,
        hierarchyType,
        parentId: districtId,
        tenantCode,
      })

      const blocks = blocksResponse.data ?? []
      const lookup = createLocationTitleLookup()
      const pendingLgdIds = new Set(normalizedTargetLgdIds)

      for (const block of blocks) {
        const blockId = typeof block.id === 'number' ? block.id : undefined
        const blockTitle = block.title?.trim() ?? ''

        addLocationTitleToLookup(lookup, block, blockTitle)

        if (blockId !== undefined && pendingLgdIds.has(blockId)) {
          pendingLgdIds.delete(blockId)
        }

        if (pendingLgdIds.size === 0 || blockId === undefined) {
          if (pendingLgdIds.size === 0) {
            break
          }
          continue
        }

        const gramPanchayatsResponse = await dashboardApi.getTenantChildLocations({
          tenantId,
          hierarchyType,
          parentId: blockId,
          tenantCode,
        })

        for (const gramPanchayat of gramPanchayatsResponse.data ?? []) {
          const gramPanchayatId =
            typeof gramPanchayat.id === 'number' ? gramPanchayat.id : undefined

          addLocationTitleToLookup(lookup, gramPanchayat, blockTitle)

          if (gramPanchayatId !== undefined && pendingLgdIds.has(gramPanchayatId)) {
            pendingLgdIds.delete(gramPanchayatId)
          }

          if (pendingLgdIds.size === 0 || gramPanchayatId === undefined) {
            if (pendingLgdIds.size === 0) {
              break
            }
            continue
          }

          const villagesResponse = await dashboardApi.getTenantChildLocations({
            tenantId,
            hierarchyType,
            parentId: gramPanchayatId,
            tenantCode,
          })

          for (const village of villagesResponse.data ?? []) {
            const villageId = typeof village.id === 'number' ? village.id : undefined
            addLocationTitleToLookup(lookup, village, blockTitle)
            if (villageId !== undefined && pendingLgdIds.has(villageId)) {
              pendingLgdIds.delete(villageId)
            }
          }

          if (pendingLgdIds.size === 0) {
            break
          }
        }

        if (pendingLgdIds.size === 0) {
          break
        }
      }

      return lookup
    },
    enabled:
      enabled &&
      tenantId !== undefined &&
      districtId !== undefined &&
      normalizedTargetLgdIds.length > 0,
  })
}

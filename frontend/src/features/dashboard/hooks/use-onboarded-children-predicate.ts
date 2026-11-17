import { useMemo } from 'react'
import type { HierarchyType } from '../services/api/dashboard-api'
import { useOnboardedRegionsQuery } from '../services/query/use-onboarded-regions-query'
import { type OnboardedPredicate, toOnboardedPredicate } from '../utils/onboarded-regions'

type UseOnboardedChildrenParams = {
  tenantId?: number
  hierarchyType: HierarchyType
  parentId?: number
}

type OnboardedChildren = {
  /** `undefined` while unknown: loading, failed, or no tenant or parent to ask about. */
  isOnboarded: OnboardedPredicate | undefined
  /** The onboarded list for this parent is being fetched and none is cached yet. */
  isLoading: boolean
}

/** Which children of `parentId` a phased rollout allows, and whether that is still loading. */
export function useOnboardedChildren({
  tenantId,
  hierarchyType,
  parentId,
}: UseOnboardedChildrenParams): OnboardedChildren {
  const hasParent = typeof parentId === 'number' && parentId > 0
  const params =
    tenantId && hasParent
      ? hierarchyType === 'LGD'
        ? { tenantId, parentLgdId: parentId }
        : { tenantId, parentDepartmentId: parentId }
      : null
  const { data, isLoading = false } = useOnboardedRegionsQuery({ params })
  const isOnboarded = useMemo(() => toOnboardedPredicate(data), [data])

  return { isOnboarded, isLoading }
}

/**
 * Which children of `parentId` a phased rollout allows. `undefined` while that is unknown:
 * loading, failed, or no tenant or parent to ask about.
 */
export function useOnboardedChildrenPredicate(
  params: UseOnboardedChildrenParams
): OnboardedPredicate | undefined {
  return useOnboardedChildren(params).isOnboarded
}

import { useMemo } from 'react'
import type { HierarchyType } from '../services/api/dashboard-api'
import { useOnboardedRegionsQuery } from '../services/query/use-onboarded-regions-query'
import { type OnboardedPredicate, toOnboardedPredicate } from '../utils/onboarded-regions'

type UseOnboardedChildrenPredicateParams = {
  tenantId?: number
  hierarchyType: HierarchyType
  parentId?: number
}

/**
 * Which children of `parentId` a phased rollout allows. `undefined` while that is unknown:
 * loading, failed, or no tenant or parent to ask about.
 */
export function useOnboardedChildrenPredicate({
  tenantId,
  hierarchyType,
  parentId,
}: UseOnboardedChildrenPredicateParams): OnboardedPredicate | undefined {
  const hasParent = typeof parentId === 'number' && parentId > 0
  const params =
    tenantId && hasParent
      ? hierarchyType === 'LGD'
        ? { tenantId, parentLgdId: parentId }
        : { tenantId, parentDepartmentId: parentId }
      : null
  const { data } = useOnboardedRegionsQuery({ params })

  return useMemo(() => toOnboardedPredicate(data), [data])
}

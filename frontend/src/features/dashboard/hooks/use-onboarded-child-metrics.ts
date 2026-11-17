import type { HierarchyType } from '../services/api/dashboard-api'
import {
  type ChildRegionHierarchy,
  type ChildRegionIds,
  type OnboardedPredicate,
  getChildRegionId,
  noRegionOnboarded,
  retainOnboardedChildren,
} from '../utils/onboarded-regions'
import { useOnboardedChildren } from './use-onboarded-children-predicate'

type UseOnboardedChildMetricsParams = {
  tenantId?: number
  hierarchyType: HierarchyType
  /** The parent whose child-region metrics are fetched. */
  parentId?: number
}

type OnboardedChildMetrics = {
  /** `undefined` while unknown, or when there is no parent to ask about. */
  isOnboarded: OnboardedPredicate | undefined
  /** Whether one child of the parent is shown, by the same rule as `retainOnboarded`. */
  isOnboardedChild: (region: ChildRegionIds) => boolean
  isLoading: boolean
  /** A copy of `response` holding only the children the rollout shows. */
  retainOnboarded: <TResponse extends { childRegions: ChildRegionIds[] }>(
    response: TResponse | undefined
  ) => TResponse | undefined
}

/**
 * Phased rollout for the child-region metrics of one parent, so tables, charts and the map
 * read only onboarded children. While that is unknown no child is kept; `isLoading` lets the
 * views show their loading state meanwhile. Without a parent, responses pass through unchanged.
 */
export function useOnboardedChildMetrics({
  tenantId,
  hierarchyType,
  parentId,
}: UseOnboardedChildMetricsParams): OnboardedChildMetrics {
  const hasParent = Boolean(tenantId) && typeof parentId === 'number' && parentId > 0
  const { isOnboarded, isLoading } = useOnboardedChildren({ tenantId, hierarchyType, parentId })
  const childHierarchy: ChildRegionHierarchy = hierarchyType === 'LGD' ? 'LGD' : 'DEPARTMENT'

  return {
    isOnboarded,
    isOnboardedChild: (region) =>
      !hasParent || (isOnboarded ?? noRegionOnboarded)(getChildRegionId(region, childHierarchy)),
    isLoading,
    retainOnboarded: (response) =>
      response && hasParent
        ? retainOnboardedChildren(response, isOnboarded ?? noRegionOnboarded, childHierarchy)
        : response,
  }
}

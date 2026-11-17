import type { OnboardedRegionsResponse } from '../types'
import type { LocationSelectionLevel } from './dashboard-level'

/**
 * Whether a child region may be shown on the dashboard (phased rollout). An id that is
 * missing or not positive passes only while the rollout is off.
 */
export type OnboardedPredicate = (childId: number | undefined) => boolean

/**
 * For each level of the active hierarchy, which regions of the selected parent may be shown.
 * A level is absent or `undefined` while that is unknown.
 */
export type OnboardedPredicatesByLevel = Partial<
  Record<LocationSelectionLevel, OnboardedPredicate | undefined>
>

/** Picks which id field identifies a child: LGD and department children carry both. */
export type ChildRegionHierarchy = 'LGD' | 'DEPARTMENT'

type ChildRegionIds = {
  lgdId?: number | null
  departmentId?: number | null
  childLgdId?: number | null
  childDepartmentId?: number | null
}

const isPositiveId = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

/** Allows every region: the rollout is off, or there is no parent to ask about. */
export const everyRegionOnboarded: OnboardedPredicate = () => true

/**
 * Turns an onboarded-regions response into a predicate over its parent's child ids.
 *
 * Returns `undefined` while the response is unresolved (loading or failed): callers keep the
 * dependent view in its loading or empty state, so the dashboard fails closed.
 */
export const toOnboardedPredicate = (
  response: OnboardedRegionsResponse | undefined
): OnboardedPredicate | undefined => {
  if (!response) return undefined
  if (!response.phasedRollout) return everyRegionOnboarded

  const onboardedIds = new Set(response.onboardedChildIds ?? [])
  return (childId) => isPositiveId(childId) && onboardedIds.has(childId)
}

// Not `??` across both hierarchies: the normalisers leave the other hierarchy's id as 0 or null.
const getChildRegionId = (
  region: ChildRegionIds,
  hierarchy: ChildRegionHierarchy
): number | undefined => {
  const candidates =
    hierarchy === 'LGD'
      ? [region.childLgdId, region.lgdId]
      : [region.childDepartmentId, region.departmentId]

  return candidates.find(isPositiveId)
}

/**
 * Keeps only the onboarded children of a metric response, so tables, KPIs and charts never
 * read the others. Returns `response` itself when nothing is removed, which keeps memoised
 * consumers stable while the rollout is off. Count fields are left as the server sent them.
 */
export const retainOnboardedChildren = <TResponse extends { childRegions: ChildRegionIds[] }>(
  response: TResponse,
  isOnboarded: OnboardedPredicate,
  hierarchy: ChildRegionHierarchy
): TResponse => {
  const childRegions = response.childRegions.filter((region) =>
    isOnboarded(getChildRegionId(region, hierarchy))
  )

  return childRegions.length === response.childRegions.length
    ? response
    : { ...response, childRegions }
}

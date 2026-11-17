import { useMemo } from 'react'
import type { HierarchyType } from '../services/api/dashboard-api'
import type { OnboardedPredicate } from '../utils/onboarded-regions'
import { useOnboardedChildrenPredicate } from './use-onboarded-children-predicate'

type UseOnboardedLocationOptionsParams<TOption extends { locationId?: number }> = {
  tenantId?: number
  hierarchyType: HierarchyType
  /** The parent `options` were fetched for. */
  parentId?: number
  options: TOption[]
}

type OnboardedLocationOptions<TOption> = {
  options: TOption[]
  /** `undefined` until the onboarded list for `parentId` has loaded. */
  isOnboarded: OnboardedPredicate | undefined
}

/**
 * Keeps the location options a phased rollout allows under `parentId`. The list is empty
 * while the onboarded regions are loading or failed, so dropdowns fail closed.
 *
 * Without a parent there is nothing to ask, so options pass through unchanged: that is the
 * root list, and the state itself is always onboarded.
 */
export function useOnboardedLocationOptions<TOption extends { locationId?: number }>({
  tenantId,
  hierarchyType,
  parentId,
  options,
}: UseOnboardedLocationOptionsParams<TOption>): OnboardedLocationOptions<TOption> {
  const hasParent = typeof parentId === 'number' && parentId > 0
  const isOnboarded = useOnboardedChildrenPredicate({ tenantId, hierarchyType, parentId })
  const onboardedOptions = useMemo(
    () => (isOnboarded ? options.filter((option) => isOnboarded(option.locationId)) : []),
    [isOnboarded, options]
  )

  return hasParent
    ? { options: onboardedOptions, isOnboarded }
    : { options, isOnboarded: undefined }
}

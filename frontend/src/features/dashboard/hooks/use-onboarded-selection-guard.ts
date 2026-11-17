import { useEffect, useRef } from 'react'
import type { HierarchyType } from '../services/api/dashboard-api'
import { parseLocationId } from '../utils/central-dashboard-helpers'
import {
  ADMINISTRATIVE_LEVEL_PARAMS,
  DEPARTMENTAL_LEVEL_PARAMS,
  type LocationSelectionLevel,
} from '../utils/dashboard-level'
import type { OnboardedPredicatesByLevel } from '../utils/onboarded-regions'

type UseOnboardedSelectionGuardParams = {
  hierarchyType: HierarchyType
  /** Each level's selection as held in the URL or restored filters, not the breadcrumb trail. */
  selections: Record<LocationSelectionLevel, string>
  isOnboardedByLevel: OnboardedPredicatesByLevel
  clearSelectionFrom: (level: LocationSelectionLevel) => void
}

/**
 * The shallowest selected level the rollout doesn't allow. Stops at the first level whose
 * onboarded list is still unknown, because the levels below it hang off that selection.
 */
const findFirstNonOnboardedLevel = (
  levels: readonly LocationSelectionLevel[],
  selections: Record<LocationSelectionLevel, string>,
  isOnboardedByLevel: OnboardedPredicatesByLevel
): LocationSelectionLevel | undefined => {
  for (const level of levels) {
    const value = selections[level]
    if (!value) continue

    const isOnboarded = isOnboardedByLevel[level]
    if (!isOnboarded) return undefined
    if (!isOnboarded(parseLocationId(value))) return level
  }
  return undefined
}

/**
 * Drops a selected region that a phased rollout doesn't allow, with every level below it. Such
 * a selection can arrive by deep link or restored filters. A level is judged only once its
 * onboarded list has loaded.
 */
export function useOnboardedSelectionGuard({
  hierarchyType,
  selections,
  isOnboardedByLevel,
  clearSelectionFrom,
}: UseOnboardedSelectionGuardParams): void {
  const levels = hierarchyType === 'LGD' ? ADMINISTRATIVE_LEVEL_PARAMS : DEPARTMENTAL_LEVEL_PARAMS
  const blockedLevel = findFirstNonOnboardedLevel(levels, selections, isOnboardedByLevel)
  const blockedSelection = blockedLevel ? `${blockedLevel}=${selections[blockedLevel]}` : null
  const lastClearedSelectionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!blockedLevel || !blockedSelection) {
      lastClearedSelectionRef.current = null
      return
    }
    // The URL changes after a later render, so the same selection can come round again first.
    if (lastClearedSelectionRef.current === blockedSelection) return

    lastClearedSelectionRef.current = blockedSelection
    clearSelectionFrom(blockedLevel)
  }, [blockedLevel, blockedSelection, clearSelectionFrom])
}

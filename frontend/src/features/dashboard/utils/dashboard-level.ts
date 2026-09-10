/**
 * Resolves which hierarchy level a dashboard URL is showing.
 *
 * The whole drilldown lives on one route (`/` or `/:stateSlug`) with the level carried in
 * search params, so the level has to be derived from those params.
 *
 * Deliberately does **not** read "the last key in the URL": `navigateWithUpdatedFilters`
 * builds each URL with `new URLSearchParams(snapshot)` + `.set()`, and `.set()` preserves an
 * existing key's original position. After drilling down and back up, `village` can still sit
 * after a later-set key. Walking an ordered array instead makes this order-independent.
 */

import type {
  AdministrativeLevel,
  DashboardHierarchy,
  DashboardLevel,
  DepartmentalLevel,
} from '@/shared/lib/analytics/analytics-events'
import { parseStableLocationValue } from './stable-location-value'

/** Administrative search-param keys, shallowest first. */
export const ADMINISTRATIVE_LEVEL_PARAMS: readonly AdministrativeLevel[] = [
  'district',
  'block',
  'gramPanchayat',
  'village',
]

/** Departmental search-param keys, shallowest first. */
export const DEPARTMENTAL_LEVEL_PARAMS: readonly DepartmentalLevel[] = [
  'departmentZone',
  'departmentCircle',
  'departmentDivision',
  'departmentSubdivision',
  'departmentVillage',
]

/** Maps each level to the GA4 param carrying its name. */
const LEVEL_NAME_PARAM: Record<AdministrativeLevel | DepartmentalLevel, string> = {
  district: 'district_name',
  block: 'block_name',
  gramPanchayat: 'gram_panchayat_name',
  village: 'village_name',
  departmentZone: 'zone_name',
  departmentCircle: 'circle_name',
  departmentDivision: 'division_name',
  departmentSubdivision: 'subdivision_name',
  departmentVillage: 'department_village_name',
}

export interface DashboardLevelView {
  level: DashboardLevel
  hierarchy: DashboardHierarchy
  /** 0 = national, 1 = state, 2..6 = successively deeper. */
  depth: number
  /** Present only in multi-tenant mode, where the state is part of the path. */
  state?: string
  /**
   * Human-readable slug per selected level, keyed by its GA4 param name. Numeric ids from
   * the `locationId:analyticsId:slug` encoding are intentionally dropped.
   */
  names: Record<string, string>
}

export interface ResolveDashboardLevelArgs {
  searchParams: URLSearchParams
  /** The `:stateSlug` path segment, empty on the national landing view. */
  stateSlug: string
  isSingleTenant: boolean
}

/** Reads a param, treating whitespace-only values as absent. */
function readParam(searchParams: URLSearchParams, key: string): string {
  return (searchParams.get(key) ?? '').trim()
}

/** Extracts the display slug from a `locationId:analyticsId:slug` value. */
function toLocationName(value: string): string {
  return parseStableLocationValue(value).lastSegment ?? ''
}

/**
 * Walks an ordered level list and returns the deepest selected level.
 *
 * Applies the same cascade guard the dashboard itself uses when reading these params
 * (use-central-dashboard-filters.ts): a child only counts when its parent is set, so
 * `?block=x` with no `district` resolves to the state level rather than to `block`.
 */
function resolveDeepestLevel<TLevel extends AdministrativeLevel | DepartmentalLevel>(
  searchParams: URLSearchParams,
  orderedParams: readonly TLevel[],
  { enforceCascade }: { enforceCascade: boolean }
): { level?: TLevel; depth: number; names: Record<string, string> } {
  const names: Record<string, string> = {}
  let deepest: TLevel | undefined
  let depth = 0

  for (const [index, param] of orderedParams.entries()) {
    const value = readParam(searchParams, param)

    // A gap ends the chain: nothing below an unselected parent is meaningful.
    if (!value) {
      if (enforceCascade) break
      continue
    }

    const name = toLocationName(value)
    if (name) {
      names[LEVEL_NAME_PARAM[param]] = name
    }

    deepest = param
    depth = index + 1
  }

  return { level: deepest, depth, names }
}

/**
 * Derives the level, hierarchy and selected location names from a dashboard URL.
 *
 * Hierarchy is inferred from which params are present because the URL only ever carries
 * `tab=administrative` — the departmental hierarchy is encoded as that param's absence.
 */
export function resolveDashboardLevel({
  searchParams,
  stateSlug,
  isSingleTenant,
}: ResolveDashboardLevelArgs): DashboardLevelView {
  const hasDepartmentalParams = DEPARTMENTAL_LEVEL_PARAMS.some((param) =>
    Boolean(readParam(searchParams, param))
  )
  const hierarchy: DashboardHierarchy = hasDepartmentalParams ? 'departmental' : 'administrative'

  const resolved = hasDepartmentalParams
    ? // Departmental params are not cascade-guarded on read by the dashboard, so a deeper
      // selection stands even when an intermediate level is missing.
      resolveDeepestLevel(searchParams, DEPARTMENTAL_LEVEL_PARAMS, { enforceCascade: false })
    : resolveDeepestLevel(searchParams, ADMINISTRATIVE_LEVEL_PARAMS, { enforceCascade: true })

  const trimmedStateSlug = stateSlug.trim()
  const isStateScoped = Boolean(trimmedStateSlug) || isSingleTenant

  // No level params: the view is the state itself, or the national landing view when a
  // multi-tenant deployment has no state selected yet.
  const level: DashboardLevel = resolved.level ?? (isStateScoped ? 'state' : 'national')
  const depth = resolved.level ? resolved.depth + 1 : isStateScoped ? 1 : 0

  return {
    level,
    hierarchy,
    depth,
    ...(trimmedStateSlug ? { state: trimmedStateSlug } : {}),
    names: resolved.names,
  }
}

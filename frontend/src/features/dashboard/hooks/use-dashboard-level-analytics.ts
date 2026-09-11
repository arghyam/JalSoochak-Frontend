/**
 * Reports one `dashboard_level_view` per hierarchy level the user lands on.
 *
 * Observes the URL rather than hooking the navigate helper, so it also catches deep links,
 * back/forward navigation, and the mount-time URL rewrite that restores filters from
 * localStorage (use-central-dashboard-filters.ts).
 */

import { useEffect, useMemo, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { isSingleTenantMode } from '@/config/server-config'
import { trackEvent } from '@/shared/lib/analytics'
import type { DashboardHierarchy } from '@/shared/lib/analytics'
import { stateCodeToSlug } from '@/shared/constants/states'
import { resolveDashboardLevel } from '../utils/dashboard-level'

/** Long enough to absorb the localStorage filter restore, short enough to feel immediate. */
const LEVEL_VIEW_DEBOUNCE_MS = 300

export function useDashboardLevelAnalytics(activeHierarchy?: DashboardHierarchy): void {
  const { search } = useLocation()
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()
  const isSingleTenant = isSingleTenantMode()

  const view = useMemo(
    () =>
      resolveDashboardLevel({
        searchParams: new URLSearchParams(search),
        // The path carries a 2-letter code; report the readable slug instead.
        stateSlug: stateSlug ? (stateCodeToSlug(stateSlug) ?? stateSlug) : '',
        isSingleTenant,
        activeHierarchy,
      }),
    [search, stateSlug, isSingleTenant, activeHierarchy]
  )

  const signature = useMemo(() => JSON.stringify(view), [view])
  const lastReportedSignature = useRef<string | null>(null)

  useEffect(() => {
    if (lastReportedSignature.current === signature) return

    // Trailing edge only, including the very first value: the filter restore rewrites the
    // URL right after mount, and reporting the pre-restore level too would double-count.
    const timer = setTimeout(() => {
      lastReportedSignature.current = signature

      const { level, hierarchy, depth, state, names } = JSON.parse(signature) as typeof view

      trackEvent('dashboard_level_view', {
        level,
        hierarchy,
        depth,
        tenancy: isSingleTenant ? 'single' : 'multi',
        ...(state ? { state } : {}),
        ...names,
      })
    }, LEVEL_VIEW_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [signature, isSingleTenant])
}

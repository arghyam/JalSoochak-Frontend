/**
 * Reports location searches, debounced to the term the user settled on rather than one
 * event per keystroke.
 *
 * Returns a callback to hand to `SearchLayout`'s `onSearchTermChange`.
 */

import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { isSingleTenantMode } from '@/config/server-config'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { trackEvent } from '@/shared/lib/analytics'
import type { AnalyticsEventParamMap, DashboardHierarchy } from '@/shared/lib/analytics'
import { stateCodeToSlug } from '@/shared/constants/states'
import { resolveDashboardLevel } from '../utils/dashboard-level'

/** Long enough that typing a place name reports once, not once per letter. */
const SEARCH_DEBOUNCE_MS = 600

type PendingSearch = AnalyticsEventParamMap['location_search']

export function useLocationSearchAnalytics(
  activeHierarchy?: DashboardHierarchy
): (term: string) => void {
  const { search } = useLocation()
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()

  const [pendingSearch, setPendingSearch] = useState<PendingSearch | null>(null)
  const debouncedSearch = useDebounce(pendingSearch, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    if (!debouncedSearch) return
    trackEvent('location_search', debouncedSearch)
  }, [debouncedSearch])

  // The level is resolved when the term is typed, not when the debounce settles, so the
  // event reports the level the user actually searched from.
  return useCallback(
    (term: string) => {
      const trimmed = term.trim()
      if (!trimmed) {
        setPendingSearch(null)
        return
      }

      const { level, hierarchy } = resolveDashboardLevel({
        searchParams: new URLSearchParams(search),
        stateSlug: stateSlug ? (stateCodeToSlug(stateSlug) ?? stateSlug) : '',
        isSingleTenant: isSingleTenantMode(),
        activeHierarchy,
      })

      // Only the length travels: the term itself is untrusted free text.
      setPendingSearch({ search_term_length: trimmed.length, level, hierarchy })
    },
    [search, stateSlug, activeHierarchy]
  )
}

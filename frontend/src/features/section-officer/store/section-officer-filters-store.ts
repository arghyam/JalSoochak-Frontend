import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DateRange } from '@/shared/components/common'

/**
 * Cross-route filter state for the Section Officer module.
 *
 * - The date range is SHARED across every section-officer page (Overview, Pump
 *   Operators, Anomalies, Escalations) — changing it on one page reflects on all.
 * - Search text and status are persisted PER PAGE (each page keeps its own).
 *
 * State is persisted to `sessionStorage` so it survives refresh/navigation but
 * clears automatically when the tab/session ends. It is also cleared explicitly
 * on logout / session expiry via {@link clearSectionOfficerFilters}.
 */

export const SECTION_OFFICER_PAGE_KEYS = {
  OVERVIEW: 'overview',
  PUMP_OPERATORS: 'pump-operators',
  ANOMALIES: 'anomalies',
  ESCALATIONS: 'escalations',
} as const

export type SectionOfficerPageKey =
  (typeof SECTION_OFFICER_PAGE_KEYS)[keyof typeof SECTION_OFFICER_PAGE_KEYS]

export interface SectionOfficerPageFilters {
  searchQuery: string
  statusFilter: string
}

/** Default per-page filter values (empty search + status). */
const EMPTY_PAGE_FILTERS: SectionOfficerPageFilters = {
  searchQuery: '',
  statusFilter: '',
}

/** Default shared date range: the last 30 days (inclusive of today). */
export function getDefaultSectionOfficerDateRange(): DateRange {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const start = new Date(now)
  start.setDate(now.getDate() - 29)
  return { startDate: toIso(start), endDate: toIso(now) }
}

function createEmptyPageFilters(): Record<SectionOfficerPageKey, SectionOfficerPageFilters> {
  return {
    [SECTION_OFFICER_PAGE_KEYS.OVERVIEW]: { ...EMPTY_PAGE_FILTERS },
    [SECTION_OFFICER_PAGE_KEYS.PUMP_OPERATORS]: { ...EMPTY_PAGE_FILTERS },
    [SECTION_OFFICER_PAGE_KEYS.ANOMALIES]: { ...EMPTY_PAGE_FILTERS },
    [SECTION_OFFICER_PAGE_KEYS.ESCALATIONS]: { ...EMPTY_PAGE_FILTERS },
  }
}

export interface SectionOfficerFiltersState {
  /** Shared across all section-officer pages. */
  dateRange: DateRange | null
  setDateRange: (range: DateRange | null) => void
  /** Per-page search + status filters. */
  pageFilters: Record<SectionOfficerPageKey, SectionOfficerPageFilters>
  setPageFilter: (key: SectionOfficerPageKey, partial: Partial<SectionOfficerPageFilters>) => void
  clearPageFilter: (key: SectionOfficerPageKey) => void
  /** Restore defaults: last-30-days date range + empty per-page filters. */
  resetAll: () => void
}

export const SECTION_OFFICER_FILTERS_STORAGE_KEY = 'section-officer-filters'

export const useSectionOfficerFiltersStore = create<SectionOfficerFiltersState>()(
  persist(
    (set) => ({
      dateRange: getDefaultSectionOfficerDateRange(),
      pageFilters: createEmptyPageFilters(),

      setDateRange: (range) => set({ dateRange: range }),

      setPageFilter: (key, partial) =>
        set((state) => ({
          pageFilters: {
            ...state.pageFilters,
            [key]: { ...state.pageFilters[key], ...partial },
          },
        })),

      clearPageFilter: (key) =>
        set((state) => ({
          pageFilters: {
            ...state.pageFilters,
            [key]: { ...EMPTY_PAGE_FILTERS },
          },
        })),

      resetAll: () =>
        set({
          dateRange: getDefaultSectionOfficerDateRange(),
          pageFilters: createEmptyPageFilters(),
        }),
    }),
    {
      name: SECTION_OFFICER_FILTERS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the data, not the action functions.
      partialize: (state) => ({
        dateRange: state.dateRange,
        pageFilters: state.pageFilters,
      }),
    }
  )
)

/**
 * Resets section-officer filters and clears their persisted `sessionStorage`
 * entry. Called from the auth store on logout / session expiry. Implemented as a
 * standalone function so non-React modules can invoke it without a hook.
 */
export function clearSectionOfficerFilters(): void {
  useSectionOfficerFiltersStore.getState().resetAll()
  try {
    useSectionOfficerFiltersStore.persist.clearStorage()
  } catch {
    // Ignore storage errors (quota / private mode / SSR).
  }
}

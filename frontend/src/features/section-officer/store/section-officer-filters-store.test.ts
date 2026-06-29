import { describe, expect, it, beforeEach } from '@jest/globals'
import {
  SECTION_OFFICER_FILTERS_STORAGE_KEY,
  SECTION_OFFICER_PAGE_KEYS,
  clearSectionOfficerFilters,
  getDefaultSectionOfficerDateRange,
  useSectionOfficerFiltersStore,
} from './section-officer-filters-store'

function getState() {
  return useSectionOfficerFiltersStore.getState()
}

describe('section-officer-filters-store', () => {
  beforeEach(() => {
    sessionStorage.clear()
    getState().resetAll()
  })

  it('defaults the shared date range to the last 30 days', () => {
    const expected = getDefaultSectionOfficerDateRange()
    expect(getState().dateRange).toEqual(expected)
    // 29 days back + today = 30-day inclusive window
    const start = new Date(expected.startDate)
    const end = new Date(expected.endDate)
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    expect(days).toBe(29)
  })

  it('starts with empty per-page filters for every page', () => {
    for (const key of Object.values(SECTION_OFFICER_PAGE_KEYS)) {
      expect(getState().pageFilters[key]).toEqual({ searchQuery: '', statusFilter: '' })
    }
  })

  it('setDateRange updates the shared date range', () => {
    getState().setDateRange({ startDate: '2026-01-01', endDate: '2026-01-31' })
    expect(getState().dateRange).toEqual({ startDate: '2026-01-01', endDate: '2026-01-31' })
  })

  it('setPageFilter updates a single page without affecting others', () => {
    getState().setPageFilter(SECTION_OFFICER_PAGE_KEYS.PUMP_OPERATORS, { searchQuery: 'ravi' })
    getState().setPageFilter(SECTION_OFFICER_PAGE_KEYS.PUMP_OPERATORS, { statusFilter: 'ACTIVE' })

    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.PUMP_OPERATORS]).toEqual({
      searchQuery: 'ravi',
      statusFilter: 'ACTIVE',
    })
    // Anomalies untouched
    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.ANOMALIES]).toEqual({
      searchQuery: '',
      statusFilter: '',
    })
  })

  it('clearPageFilter empties only the given page', () => {
    getState().setPageFilter(SECTION_OFFICER_PAGE_KEYS.PUMP_OPERATORS, { searchQuery: 'ravi' })
    getState().setPageFilter(SECTION_OFFICER_PAGE_KEYS.ANOMALIES, { searchQuery: 'leak' })

    getState().clearPageFilter(SECTION_OFFICER_PAGE_KEYS.PUMP_OPERATORS)

    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.PUMP_OPERATORS]).toEqual({
      searchQuery: '',
      statusFilter: '',
    })
    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.ANOMALIES].searchQuery).toBe('leak')
  })

  it('resetAll restores default date range and clears all page filters', () => {
    getState().setDateRange({ startDate: '2020-01-01', endDate: '2020-01-02' })
    getState().setPageFilter(SECTION_OFFICER_PAGE_KEYS.ESCALATIONS, { statusFilter: 'OPEN' })

    getState().resetAll()

    expect(getState().dateRange).toEqual(getDefaultSectionOfficerDateRange())
    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.ESCALATIONS]).toEqual({
      searchQuery: '',
      statusFilter: '',
    })
  })

  it('persists state to sessionStorage under the configured key', () => {
    getState().setPageFilter(SECTION_OFFICER_PAGE_KEYS.ANOMALIES, { searchQuery: 'leak' })
    const raw = sessionStorage.getItem(SECTION_OFFICER_FILTERS_STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.pageFilters[SECTION_OFFICER_PAGE_KEYS.ANOMALIES].searchQuery).toBe('leak')
  })

  it('clearSectionOfficerFilters resets state and clears the sessionStorage entry', () => {
    getState().setPageFilter(SECTION_OFFICER_PAGE_KEYS.ANOMALIES, { searchQuery: 'leak' })
    getState().setDateRange({ startDate: '2020-01-01', endDate: '2020-01-02' })

    clearSectionOfficerFilters()

    expect(getState().dateRange).toEqual(getDefaultSectionOfficerDateRange())
    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.ANOMALIES].searchQuery).toBe('')
    expect(sessionStorage.getItem(SECTION_OFFICER_FILTERS_STORAGE_KEY)).toBeNull()
  })
})

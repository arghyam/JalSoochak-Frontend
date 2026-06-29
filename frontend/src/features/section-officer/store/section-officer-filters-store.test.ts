import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
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

const FIXED_NOW = new Date('2026-06-15T12:00:00.000Z')

describe('section-officer-filters-store', () => {
  beforeEach(() => {
    sessionStorage.clear()
    getState().resetAll()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('defaults the shared date range to the last 30 days', () => {
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_NOW)
    getState().resetAll()

    const expected = getDefaultSectionOfficerDateRange()
    expect(getState().dateRange).toEqual(expected)
    expect(expected.endDate).toBe('2026-06-15')
    expect(expected.startDate).toBe('2026-05-17')
    // 29 days back + today = 30-day inclusive window
    const days = Math.round(
      (new Date(expected.endDate).getTime() - new Date(expected.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
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
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_NOW)

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
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_NOW)

    getState().setPageFilter(SECTION_OFFICER_PAGE_KEYS.ANOMALIES, { searchQuery: 'leak' })
    getState().setDateRange({ startDate: '2020-01-01', endDate: '2020-01-02' })

    clearSectionOfficerFilters()

    expect(getState().dateRange).toEqual(getDefaultSectionOfficerDateRange())
    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.ANOMALIES].searchQuery).toBe('')
    expect(sessionStorage.getItem(SECTION_OFFICER_FILTERS_STORAGE_KEY)).toBeNull()
  })

  it('hydrates state from sessionStorage on initialization', () => {
    const storedPayload = {
      state: {
        dateRange: { startDate: '2026-01-01', endDate: '2026-01-31' },
        pageFilters: {
          [SECTION_OFFICER_PAGE_KEYS.OVERVIEW]: { searchQuery: '', statusFilter: '' },
          [SECTION_OFFICER_PAGE_KEYS.PUMP_OPERATORS]: { searchQuery: '', statusFilter: '' },
          [SECTION_OFFICER_PAGE_KEYS.ANOMALIES]: { searchQuery: 'leak', statusFilter: '' },
          [SECTION_OFFICER_PAGE_KEYS.ESCALATIONS]: { searchQuery: '', statusFilter: '' },
        },
      },
      version: 1,
    }
    sessionStorage.setItem(SECTION_OFFICER_FILTERS_STORAGE_KEY, JSON.stringify(storedPayload))

    useSectionOfficerFiltersStore.persist.rehydrate()

    expect(getState().dateRange).toEqual({ startDate: '2026-01-01', endDate: '2026-01-31' })
    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.ANOMALIES].searchQuery).toBe('leak')
    expect(getState().pageFilters[SECTION_OFFICER_PAGE_KEYS.OVERVIEW].searchQuery).toBe('')
  })
})

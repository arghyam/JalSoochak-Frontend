import { toLocalIsoDate } from './date-format'

/**
 * Quick-range presets, extracted from the picker so both the UI and the filter state
 * owner resolve a preset the same way. A preset is a *rule*, so it must always be
 * re-resolved against a caller-supplied base date — never cached as a fixed range.
 */
export const DATE_PRESET_IDS = [
  'today',
  'yesterday',
  'this-week',
  'last-week',
  'this-month',
  'last-month',
] as const

export type DatePresetId = (typeof DATE_PRESET_IDS)[number]

export type IsoDateRange = {
  startDate: string
  endDate: string
}

// The id is the stable identity; the label is derived at render time. Storing the
// translated label instead would make identity language-dependent.
export const DATE_PRESET_LABELS: Record<DatePresetId, { key: string; defaultLabel: string }> = {
  today: { key: 'filters.dateRangePicker.presets.today', defaultLabel: 'Today' },
  yesterday: { key: 'filters.dateRangePicker.presets.yesterday', defaultLabel: 'Yesterday' },
  'this-week': { key: 'filters.dateRangePicker.presets.thisWeek', defaultLabel: 'This week' },
  'last-week': { key: 'filters.dateRangePicker.presets.lastWeek', defaultLabel: 'Last week' },
  'this-month': { key: 'filters.dateRangePicker.presets.thisMonth', defaultLabel: 'This month' },
  'last-month': { key: 'filters.dateRangePicker.presets.lastMonth', defaultLabel: 'Last month' },
}

// Weeks start on Monday: Sunday (day 0) belongs to the week that began six days earlier.
const startOfWeek = (date: Date) => {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(date)
  start.setDate(date.getDate() + diff)
  return start
}

const endOfWeek = (date: Date) => {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

// Day 0 of the next month is the last day of this one.
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)

const addDays = (date: Date, days: number) => {
  const shifted = new Date(date)
  shifted.setDate(date.getDate() + days)
  return shifted
}

const PRESET_RANGE_RESOLVERS: Record<DatePresetId, (baseDate: Date) => IsoDateRange> = {
  today: (baseDate) => ({
    startDate: toLocalIsoDate(baseDate),
    endDate: toLocalIsoDate(baseDate),
  }),
  yesterday: (baseDate) => {
    const yesterday = addDays(baseDate, -1)
    return {
      startDate: toLocalIsoDate(yesterday),
      endDate: toLocalIsoDate(yesterday),
    }
  },
  'this-week': (baseDate) => ({
    startDate: toLocalIsoDate(startOfWeek(baseDate)),
    endDate: toLocalIsoDate(endOfWeek(baseDate)),
  }),
  'last-week': (baseDate) => {
    const lastWeek = addDays(baseDate, -7)
    return {
      startDate: toLocalIsoDate(startOfWeek(lastWeek)),
      endDate: toLocalIsoDate(endOfWeek(lastWeek)),
    }
  },
  'this-month': (baseDate) => ({
    startDate: toLocalIsoDate(startOfMonth(baseDate)),
    endDate: toLocalIsoDate(endOfMonth(baseDate)),
  }),
  'last-month': (baseDate) => {
    const lastMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1)
    return {
      startDate: toLocalIsoDate(startOfMonth(lastMonth)),
      endDate: toLocalIsoDate(endOfMonth(lastMonth)),
    }
  },
}

// localStorage and URLs are untrusted, so a persisted preset id must be narrowed
// before it is used to resolve a range.
export const isDatePresetId = (value: unknown): value is DatePresetId =>
  typeof value === 'string' && DATE_PRESET_IDS.includes(value as DatePresetId)

export const resolveDatePresetRange = (
  presetId: DatePresetId,
  baseDate: Date = new Date()
): IsoDateRange => PRESET_RANGE_RESOLVERS[presetId](baseDate)

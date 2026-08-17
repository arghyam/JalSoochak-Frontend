import { describe, expect, it } from '@jest/globals'
import {
  DATE_PRESET_IDS,
  DATE_PRESET_LABELS,
  isDatePresetId,
  resolveDatePresetRange,
} from './date-presets'

describe('resolveDatePresetRange', () => {
  // Thursday 13 Aug 2026. Week runs Mon 10 Aug – Sun 16 Aug.
  const thursday = new Date('2026-08-13T10:00:00')

  it('resolves today to a single day', () => {
    expect(resolveDatePresetRange('today', thursday)).toEqual({
      startDate: '2026-08-13',
      endDate: '2026-08-13',
    })
  })

  it('resolves yesterday to the previous single day', () => {
    expect(resolveDatePresetRange('yesterday', thursday)).toEqual({
      startDate: '2026-08-12',
      endDate: '2026-08-12',
    })
  })

  it('resolves this week from Monday to Sunday', () => {
    expect(resolveDatePresetRange('this-week', thursday)).toEqual({
      startDate: '2026-08-10',
      endDate: '2026-08-16',
    })
  })

  it('treats Sunday as the last day of the week it started, not the first', () => {
    const sunday = new Date('2026-08-09T10:00:00')

    expect(resolveDatePresetRange('this-week', sunday)).toEqual({
      startDate: '2026-08-03',
      endDate: '2026-08-09',
    })
  })

  it('resolves last week to the preceding Monday-Sunday block', () => {
    expect(resolveDatePresetRange('last-week', thursday)).toEqual({
      startDate: '2026-08-03',
      endDate: '2026-08-09',
    })
  })

  it('resolves this month to the full calendar month', () => {
    expect(resolveDatePresetRange('this-month', thursday)).toEqual({
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    })
  })

  it('resolves last month to the full preceding calendar month', () => {
    expect(resolveDatePresetRange('last-month', thursday)).toEqual({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })
  })

  it('resolves last month across a year boundary', () => {
    expect(resolveDatePresetRange('last-month', new Date('2026-01-15T10:00:00'))).toEqual({
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    })
  })

  it('resolves a short last month without overflowing into the next one', () => {
    expect(resolveDatePresetRange('last-month', new Date('2026-03-01T10:00:00'))).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    })
  })

  it('is a pure function of the base date and never mutates it', () => {
    const baseDate = new Date('2026-08-13T10:00:00')

    DATE_PRESET_IDS.forEach((id) => resolveDatePresetRange(id, baseDate))

    expect(baseDate.toISOString()).toBe(new Date('2026-08-13T10:00:00').toISOString())
  })

  it('resolves every preset to a well-ordered range with a label', () => {
    DATE_PRESET_IDS.forEach((id) => {
      const { startDate, endDate } = resolveDatePresetRange(id, thursday)

      expect(startDate <= endDate).toBe(true)
      expect(DATE_PRESET_LABELS[id].defaultLabel.length).toBeGreaterThan(0)
    })
  })
})

describe('isDatePresetId', () => {
  it('accepts every known preset id', () => {
    DATE_PRESET_IDS.forEach((id) => {
      expect(isDatePresetId(id)).toBe(true)
    })
  })

  it('rejects values that are not known preset ids', () => {
    expect(isDatePresetId('Yesterday')).toBe(false)
    expect(isDatePresetId('last-fortnight')).toBe(false)
    expect(isDatePresetId(undefined)).toBe(false)
    expect(isDatePresetId(null)).toBe(false)
    expect(isDatePresetId(7)).toBe(false)
    expect(isDatePresetId({ id: 'today' })).toBe(false)
  })
})

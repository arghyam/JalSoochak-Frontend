import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { localizeDepartmentHierarchyLabel, normalizeHierarchyLabel } from './hierarchy-label'

describe('normalizeHierarchyLabel', () => {
  it('trims, lowercases, and replaces hyphens with spaces', () => {
    expect(normalizeHierarchyLabel('  Sub-Division  ')).toBe('sub division')
  })
})

describe('localizeDepartmentHierarchyLabel', () => {
  const t = jest.fn((key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key)

  beforeEach(() => {
    t.mockClear()
  })

  it('returns raw value when UI language is not Hindi', () => {
    expect(localizeDepartmentHierarchyLabel('Zone', 'singular', { language: 'en' }, t)).toBe('Zone')
    expect(t).not.toHaveBeenCalled()
  })

  it('translates zone/circle/division/sub-division for Hindi UI', () => {
    localizeDepartmentHierarchyLabel('zone', 'plural', { resolvedLanguage: 'hi-IN' }, t)
    expect(t).toHaveBeenCalledWith('performanceCharts.viewBy.zones', { defaultValue: 'Zones' })

    t.mockClear()
    localizeDepartmentHierarchyLabel('Circle', 'singular', { language: 'HI' }, t)
    expect(t).toHaveBeenCalledWith('performanceCharts.viewBy.circle', { defaultValue: 'Circle' })

    t.mockClear()
    localizeDepartmentHierarchyLabel('Division', 'plural', { resolvedLanguage: 'hi' }, t)
    expect(t).toHaveBeenCalledWith('performanceCharts.viewBy.divisions', {
      defaultValue: 'Divisions',
    })

    t.mockClear()
    localizeDepartmentHierarchyLabel('Sub-division', 'singular', { language: 'hi' }, t)
    expect(t).toHaveBeenCalledWith('performanceCharts.viewBy.subDivision', {
      defaultValue: 'Sub Division',
    })

    t.mockClear()
    localizeDepartmentHierarchyLabel('subdivision', 'plural', { language: 'hi' }, t)
    expect(t).toHaveBeenCalledWith('performanceCharts.viewBy.subDivisions', {
      defaultValue: 'Sub Divisions',
    })
  })

  it('returns original value for unknown Hindi labels', () => {
    expect(localizeDepartmentHierarchyLabel('Custom', 'singular', { language: 'hi' }, t)).toBe(
      'Custom'
    )
    expect(t).not.toHaveBeenCalled()
  })
})

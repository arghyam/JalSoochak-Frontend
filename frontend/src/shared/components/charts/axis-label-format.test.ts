import { describe, expect, it } from '@jest/globals'
import { formatAxisLabel, formatIsoDateToDayFirst } from './axis-label-format'

describe('axis-label-format', () => {
  describe('formatIsoDateToDayFirst', () => {
    it('converts ISO date string to day-first format', () => {
      expect(formatIsoDateToDayFirst('2026-04-16')).toBe('16-04-2026')
    })

    it('returns original value for non-ISO date string', () => {
      expect(formatIsoDateToDayFirst('16/04/2026')).toBe('16/04/2026')
      expect(formatIsoDateToDayFirst('Kerala')).toBe('Kerala')
    })

    it('supports leading and trailing whitespace in ISO date string', () => {
      expect(formatIsoDateToDayFirst(' 2026-01-09 ')).toBe('09-01-2026')
    })
  })

  describe('formatAxisLabel', () => {
    it('returns empty string for blank input', () => {
      expect(formatAxisLabel('   ')).toBe('')
    })

    it('formats ISO date labels as day-month-year', () => {
      expect(formatAxisLabel('2026-04-16')).toBe('16-04-2026')
    })

    it('splits multi-word labels into max two lines', () => {
      expect(formatAxisLabel('South Salmara Mankachar')).toBe('South Salmara\nMankachar')
    })

    it('truncates overflow with ellipsis on the last visible line', () => {
      expect(formatAxisLabel('Dadra and Nagar Haveli and Daman and Diu')).toBe(
        'Dadra and\nNagar Havel...'
      )
    })

    it('honors custom max line length and max lines', () => {
      expect(formatAxisLabel('alpha beta gamma delta', 5, 2)).toBe('alpha\nbe...')
    })
  })
})

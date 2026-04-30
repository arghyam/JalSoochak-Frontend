import {
  formatIsoDateForDisplay,
  normalizeDateFormat,
  parseDisplayDateToIso,
  parseDisplayDateToIsoWithFallback,
} from './date-format'

describe('formatIsoDateForDisplay', () => {
  it('formats ISO dates with month abbreviation and four-digit year', () => {
    expect(formatIsoDateForDisplay('2026-04-30', 'DD/MON/YYYY')).toBe('30/APR/2026')
  })

  it('formats ISO dates with month abbreviation and two-digit year', () => {
    expect(formatIsoDateForDisplay('2026-04-30', 'DD/MON/YY')).toBe('30/APR/26')
  })
})

describe('normalizeDateFormat', () => {
  it('keeps supported month abbreviation formats', () => {
    expect(normalizeDateFormat('DD/MON/YYYY')).toBe('DD/MON/YYYY')
    expect(normalizeDateFormat('DD/MON/YY')).toBe('DD/MON/YY')
  })
})

describe('parseDisplayDateToIso', () => {
  it('parses month abbreviation dates with four-digit years', () => {
    expect(parseDisplayDateToIso('30/APR/2026', 'DD/MON/YYYY')).toBe('2026-04-30')
  })

  it('parses month abbreviation dates with two-digit years', () => {
    expect(parseDisplayDateToIso('30/APR/26', 'DD/MON/YY')).toBe('2026-04-30')
  })

  it('parses month abbreviations case-insensitively', () => {
    expect(parseDisplayDateToIso('30/apr/2026', 'DD/MON/YYYY')).toBe('2026-04-30')
  })
})

describe('parseDisplayDateToIsoWithFallback', () => {
  it('prefers short-year fallback derived from the preferred MM/DD/YYYY format', () => {
    expect(parseDisplayDateToIsoWithFallback('01/02/24', 'MM/DD/YYYY')).toBe('2024-01-02')
  })

  it('prefers short-year fallback derived from the preferred DD/MM/YYYY format', () => {
    expect(parseDisplayDateToIsoWithFallback('01/02/24', 'DD/MM/YYYY')).toBe('2024-02-01')
  })

  it('prefers short-year fallback derived from the preferred DD/MON/YYYY format', () => {
    expect(parseDisplayDateToIsoWithFallback('30/APR/26', 'DD/MON/YYYY')).toBe('2026-04-30')
  })
})

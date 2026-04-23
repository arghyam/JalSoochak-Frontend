import { parseDisplayDateToIsoWithFallback } from './date-format'

describe('parseDisplayDateToIsoWithFallback', () => {
  it('prefers short-year fallback derived from the preferred MM/DD/YYYY format', () => {
    expect(parseDisplayDateToIsoWithFallback('01/02/24', 'MM/DD/YYYY')).toBe('2024-01-02')
  })

  it('prefers short-year fallback derived from the preferred DD/MM/YYYY format', () => {
    expect(parseDisplayDateToIsoWithFallback('01/02/24', 'DD/MM/YYYY')).toBe('2024-02-01')
  })
})

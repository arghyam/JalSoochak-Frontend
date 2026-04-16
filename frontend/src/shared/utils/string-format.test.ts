import { formatScreamingSnakeCase } from './string-format'

describe('formatScreamingSnakeCase', () => {
  it('should convert SCREAMING_SNAKE_CASE to Title Case with spaces', () => {
    expect(formatScreamingSnakeCase('WATER_LEAKAGE')).toBe('Water Leakage')
    expect(formatScreamingSnakeCase('PUMP_FAILURE')).toBe('Pump Failure')
  })

  it('should handle single word strings', () => {
    expect(formatScreamingSnakeCase('WATER')).toBe('Water')
    expect(formatScreamingSnakeCase('PUMP')).toBe('Pump')
  })

  it('should handle lowercase input', () => {
    expect(formatScreamingSnakeCase('water_leakage')).toBe('Water Leakage')
  })

  it('should handle mixed case input', () => {
    expect(formatScreamingSnakeCase('Water_LEAKAGE')).toBe('Water Leakage')
  })

  it('should handle empty string', () => {
    expect(formatScreamingSnakeCase('')).toBe('')
  })

  it('should handle multiple underscores', () => {
    expect(formatScreamingSnakeCase('WATER_LEAKAGE_DETECTED')).toBe('Water Leakage Detected')
  })
})

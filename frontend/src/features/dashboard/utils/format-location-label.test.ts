import { describe, expect, it } from '@jest/globals'
import { sanitizeLocationLabel, slugify, toCapitalizedWords } from './format-location-label'

describe('sanitizeLocationLabel', () => {
  it('drops labels containing HTML-like delimiters', () => {
    expect(sanitizeLocationLabel('<script>alert(1)</script>')).toBe('')
  })

  it('normalizes whitespace for valid labels', () => {
    expect(sanitizeLocationLabel('  Niz   Bahari  ')).toBe('Niz Bahari')
  })
})

describe('toCapitalizedWords', () => {
  it('capitalizes ASCII words after supported separators', () => {
    expect(toCapitalizedWords('andhra-pradesh')).toBe('Andhra-Pradesh')
    expect(toCapitalizedWords("o'neill")).toBe("O'Neill")
  })

  it('capitalizes non-ASCII letters at word boundaries', () => {
    expect(toCapitalizedWords('école française')).toBe('École Française')
    expect(toCapitalizedWords('niño/são tomé')).toBe('Niño/São Tomé')
  })
})

describe('slugify', () => {
  it('normalizes values to URL-safe lowercase slugs', () => {
    expect(slugify(' Assam ')).toBe('assam')
    expect(slugify('Ranga Reddy')).toBe('ranga-reddy')
    expect(slugify('North/East (Zone)')).toBe('north-east-zone')
  })

  it('preserves Unicode letters and numbers in non-empty stable slugs', () => {
    expect(slugify('São Tomé')).toBe('são-tomé')
    expect(slugify('São Tomé')).not.toBe('')
    expect(slugify('Niño')).toBe('niño')
    expect(slugify('Niño')).not.toBe('')
  })
})

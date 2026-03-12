import { describe, expect, it } from '@jest/globals'
import { slugify, toCapitalizedWords } from './format-location-label'

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
})

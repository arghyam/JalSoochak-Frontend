import { describe, expect, it } from '@jest/globals'
import { toCapitalizedWords } from './format-location-label'

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

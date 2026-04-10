import { describe, expect, it } from '@jest/globals'
import { sanitizeCsvCell, sanitizeCsvData } from './csv-sanitizer'

describe('sanitizeCsvCell', () => {
  it('prefixes formula-like strings with a single quote', () => {
    expect(sanitizeCsvCell('=1+1')).toBe("'=1+1")
    expect(sanitizeCsvCell('+123')).toBe("'+123")
    expect(sanitizeCsvCell('-42')).toBe("'-42")
    expect(sanitizeCsvCell('@ref')).toBe("'@ref")
  })

  it('leaves safe values unchanged', () => {
    expect(sanitizeCsvCell('plain')).toBe('plain')
    expect(sanitizeCsvCell(99)).toBe('99')
    expect(sanitizeCsvCell(true)).toBe('true')
  })
})

describe('sanitizeCsvData', () => {
  it('sanitizes every cell in a 2D array', () => {
    expect(
      sanitizeCsvData([
        ['ok', '=cmd'],
        [1, false],
      ])
    ).toEqual([
      ['ok', "'=cmd"],
      ['1', 'false'],
    ])
  })
})

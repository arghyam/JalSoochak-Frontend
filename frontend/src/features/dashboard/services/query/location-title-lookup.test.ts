import { describe, expect, it } from '@jest/globals'
import {
  addLocationTitleToLookup,
  createLocationTitleLookup,
  getLocationTitleFromLookup,
} from './location-title-lookup'

describe('location-title-lookup', () => {
  it('createLocationTitleLookup returns empty lookups', () => {
    const lookup = createLocationTitleLookup()
    expect(lookup.idLookup).toEqual({})
    expect(lookup.lgdLookup).toEqual({})
  })

  it('addLocationTitleToLookup skips empty string title only', () => {
    const lookup = createLocationTitleLookup()
    addLocationTitleToLookup(lookup, { id: 1, lgdCode: 2 }, '')
    expect(lookup.idLookup).toEqual({})
    expect(lookup.lgdLookup).toEqual({})
  })

  it('addLocationTitleToLookup keeps whitespace-only titles', () => {
    const lookup = createLocationTitleLookup()
    addLocationTitleToLookup(lookup, { id: 1 }, '   ')
    expect(lookup.idLookup[1]).toBe('   ')
  })

  it('addLocationTitleToLookup writes id and lgdCode when finite', () => {
    const lookup = createLocationTitleLookup()
    addLocationTitleToLookup(lookup, { id: 10, lgdCode: 200 }, 'Block A')
    expect(lookup.idLookup[10]).toBe('Block A')
    expect(lookup.lgdLookup[200]).toBe('Block A')
  })

  it('addLocationTitleToLookup ignores non-finite id and lgdCode', () => {
    const lookup = createLocationTitleLookup()
    addLocationTitleToLookup(lookup, { id: Number.NaN }, 'X')
    addLocationTitleToLookup(lookup, { lgdCode: Number.POSITIVE_INFINITY }, 'Y')
    expect(Object.keys(lookup.idLookup)).toHaveLength(0)
    expect(Object.keys(lookup.lgdLookup)).toHaveLength(0)
  })

  it('getLocationTitleFromLookup prefers lgdLookup then idLookup', () => {
    const lookup = createLocationTitleLookup()
    lookup.lgdLookup[1] = 'LGD'
    lookup.idLookup[1] = 'ID'
    expect(getLocationTitleFromLookup(lookup, 1)).toBe('LGD')
    const onlyId = createLocationTitleLookup()
    onlyId.idLookup[2] = 'FromId'
    expect(getLocationTitleFromLookup(onlyId, 2)).toBe('FromId')
  })

  it('getLocationTitleFromLookup returns undefined for invalid lookup or key', () => {
    expect(getLocationTitleFromLookup(undefined, 1)).toBeUndefined()
    expect(getLocationTitleFromLookup(createLocationTitleLookup(), null)).toBeUndefined()
    expect(getLocationTitleFromLookup(createLocationTitleLookup(), Number.NaN)).toBeUndefined()
  })
})

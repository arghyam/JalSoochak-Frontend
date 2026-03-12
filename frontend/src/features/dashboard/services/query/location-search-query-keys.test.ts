import { describe, expect, it } from '@jest/globals'
import { locationSearchQueryKeys } from './location-search-query-keys'

describe('locationSearchQueryKeys', () => {
  it('returns stable keys for location search', () => {
    expect(locationSearchQueryKeys.all).toEqual(['dashboard', 'location-search'])
    expect(locationSearchQueryKeys.statesUts()).toEqual([
      'dashboard',
      'location-search',
      'states-uts',
    ])
    expect(locationSearchQueryKeys.hierarchy(16, 'LGD')).toEqual([
      'dashboard',
      'location-search',
      'hierarchy',
      16,
      'LGD',
    ])
    expect(locationSearchQueryKeys.hierarchy(undefined, undefined)).toEqual([
      'dashboard',
      'location-search',
      'hierarchy',
      undefined,
      undefined,
    ])
    expect(locationSearchQueryKeys.children(16, 'LGD', 0)).toEqual([
      'dashboard',
      'location-search',
      'children',
      16,
      'LGD',
      0,
    ])
    expect(locationSearchQueryKeys.children(undefined, undefined, undefined)).toEqual([
      'dashboard',
      'location-search',
      'children',
      undefined,
      undefined,
      undefined,
    ])
  })
})

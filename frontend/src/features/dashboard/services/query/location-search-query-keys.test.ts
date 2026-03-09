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
    expect(locationSearchQueryKeys.tenants()).toEqual(['dashboard', 'location-search', 'tenants'])
  })
})

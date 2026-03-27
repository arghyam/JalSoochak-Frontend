import { describe, expect, it } from '@jest/globals'
import { locationSearchMockService } from './location-search-mock'

describe('locationSearchMockService', () => {
  it('returns Telangana mock state data', async () => {
    const response = await locationSearchMockService.getStatesUts()

    expect(response.totalStatesCount).toBe(36)
    expect(response.states).toEqual([{ value: 'telangana', label: 'Telangana' }])
  })
})

import { apiClient, publicApiClient, queryClient } from './index'
import { apiClient as apiClientDirect, publicApiClient as publicApiClientDirect } from './axios'
import { queryClient as queryClientDirect } from './query-client'

describe('shared/lib index exports', () => {
  it('re-exports api clients and queryClient', () => {
    expect(apiClient).toBe(apiClientDirect)
    expect(publicApiClient).toBe(publicApiClientDirect)
    expect(queryClient).toBe(queryClientDirect)
  })
})

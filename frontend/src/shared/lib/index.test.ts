import { apiClient, queryClient } from './index'
import { apiClient as apiClientDirect } from './axios'
import { queryClient as queryClientDirect } from './query-client'

describe('shared/lib index exports', () => {
  it('re-exports apiClient and queryClient', () => {
    expect(apiClient).toBe(apiClientDirect)
    expect(queryClient).toBe(queryClientDirect)
  })
})

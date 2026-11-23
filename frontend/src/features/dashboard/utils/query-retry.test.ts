import { describe, expect, it } from '@jest/globals'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { retryTransientFailures } from './query-retry'

const httpError = (status: number) => {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  }
  return error
}

describe('retryTransientFailures', () => {
  it.each([429, 500, 502, 503])('retries a %d, which a later attempt can get past', (status) => {
    expect(retryTransientFailures(0, httpError(status))).toBe(true)
    expect(retryTransientFailures(1, httpError(status))).toBe(true)
  })

  it('retries a request that got no response', () => {
    expect(retryTransientFailures(0, new AxiosError('Network Error'))).toBe(true)
  })

  it('gives up after two retries', () => {
    expect(retryTransientFailures(2, httpError(429))).toBe(false)
  })

  it.each([400, 401, 403, 404])('does not retry a %d, which no retry can change', (status) => {
    expect(retryTransientFailures(0, httpError(status))).toBe(false)
  })

  it.each([
    ['a plain error, such as an invalid payload', new Error('Invalid response')],
    ['no error', null],
  ])('does not retry %s', (_case, error) => {
    expect(retryTransientFailures(0, error)).toBe(false)
  })
})

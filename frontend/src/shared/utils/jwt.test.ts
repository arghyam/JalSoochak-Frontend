import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals'
import { extractUserFromJWT, isTokenExpired, parseJWT } from './jwt'

function encodePayload(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload)
  const b64 = Buffer.from(json, 'utf8').toString('base64')
  const base64url = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `e30.${base64url}.sig`
}

describe('parseJWT', () => {
  const consoleError = console.error

  beforeEach(() => {
    console.error = jest.fn()
  })

  afterEach(() => {
    console.error = consoleError
  })

  it('returns parsed payload for a valid token', () => {
    const token = encodePayload({
      sub: 'user-1',
      name: 'Test',
      email: 't@x.com',
      preferred_username: '+9199',
      exp: 2000000000,
    })
    expect(parseJWT(token)).toEqual(
      expect.objectContaining({
        sub: 'user-1',
        name: 'Test',
        email: 't@x.com',
        preferred_username: '+9199',
        exp: 2000000000,
      })
    )
  })

  it('returns null when payload segment is missing', () => {
    expect(parseJWT('only-one-part')).toBeNull()
  })

  it('returns null on invalid base64 payload', () => {
    expect(parseJWT('a.!!!invalid!!!.c')).toBeNull()
    expect(console.error).toHaveBeenCalled()
  })
})

describe('extractUserFromJWT', () => {
  it('maps known JWT fields to UserFromJWT', () => {
    const token = encodePayload({
      sub: '99',
      name: 'N',
      email: 'e@e.com',
      preferred_username: 'phone',
    })
    expect(extractUserFromJWT(token)).toEqual({
      id: '99',
      name: 'N',
      email: 'e@e.com',
      phoneNumber: 'phone',
    })
  })

  it('returns null when token cannot be parsed', () => {
    expect(extractUserFromJWT('bad')).toBeNull()
  })

  it('uses empty strings for optional claims', () => {
    const token = encodePayload({ sub: '1' })
    expect(extractUserFromJWT(token)).toEqual({
      id: '1',
      name: '',
      email: '',
      phoneNumber: '',
    })
  })
})

describe('isTokenExpired', () => {
  const consoleError = console.error

  beforeEach(() => {
    console.error = jest.fn()
  })

  afterEach(() => {
    console.error = consoleError
  })

  it('treats missing or unparseable token as expired', () => {
    expect(isTokenExpired('')).toBe(true)
    expect(isTokenExpired('x.y.z')).toBe(true)
  })

  it('treats missing exp as expired', () => {
    const token = encodePayload({ sub: '1' })
    expect(isTokenExpired(token)).toBe(true)
  })

  it('returns false when exp is in the future', () => {
    const farFuture = Math.floor(Date.now() / 1000) + 3600
    const token = encodePayload({ sub: '1', exp: farFuture })
    expect(isTokenExpired(token)).toBe(false)
  })

  it('returns true when exp is in the past', () => {
    const token = encodePayload({ sub: '1', exp: 1000 })
    expect(isTokenExpired(token)).toBe(true)
  })
})

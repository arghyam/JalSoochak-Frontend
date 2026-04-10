import { getCookie, setCookie, deleteCookie } from './cookies'

describe('cookies utility', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=')
      const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim()
      if (name) deleteCookie(name)
    })
  })

  describe('setCookie', () => {
    it('should set a cookie with a value', () => {
      setCookie('test_cookie', 'test_value')
      expect(getCookie('test_cookie')).toBe('test_value')
    })

    it('should encode special characters', () => {
      setCookie('test_cookie', 'value with spaces & symbols')
      expect(getCookie('test_cookie')).toBe('value with spaces & symbols')
    })

    it('should set cookie with custom max-age', () => {
      setCookie('test_cookie', 'value', { maxAge: 3600 })
      expect(getCookie('test_cookie')).toBe('value')
    })

    it('should set cookie with custom path (path filtering is environment-dependent)', () => {
      // Note: jsdom has limited cookie support and may not retrieve cookies set with non-root paths
      // We test that the function accepts path option without error
      expect(() => {
        setCookie('test_cookie', 'value', { path: '/admin' })
      }).not.toThrow()
    })

    it('should set cookie with custom sameSite', () => {
      setCookie('test_cookie', 'value', { sameSite: 'Strict' })
      expect(getCookie('test_cookie')).toBe('value')
    })
  })

  describe('getCookie', () => {
    it('should return null if cookie does not exist', () => {
      expect(getCookie('nonexistent')).toBeNull()
    })

    it('should retrieve a set cookie', () => {
      setCookie('my_cookie', 'my_value')
      expect(getCookie('my_cookie')).toBe('my_value')
    })

    it('should handle encoded values', () => {
      const encodedValue = 'value=with;special&chars'
      setCookie('encoded_cookie', encodedValue)
      expect(getCookie('encoded_cookie')).toBe(encodedValue)
    })

    it('should not match partial cookie names', () => {
      setCookie('test_cookie', 'value1')
      setCookie('test_cookie_2', 'value2')
      expect(getCookie('test_cookie')).toBe('value1')
      expect(getCookie('test_cookie_2')).toBe('value2')
    })

    it('should return null if decoding fails', () => {
      // Manually set a malformed cookie
      document.cookie = 'bad_cookie=%ZZ'
      expect(getCookie('bad_cookie')).toBeNull()
    })
  })

  describe('deleteCookie', () => {
    it('should delete an existing cookie', () => {
      setCookie('temp_cookie', 'value')
      expect(getCookie('temp_cookie')).toBe('value')
      deleteCookie('temp_cookie')
      expect(getCookie('temp_cookie')).toBeNull()
    })

    it('should not error if cookie does not exist', () => {
      expect(() => deleteCookie('nonexistent')).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      setCookie('empty_cookie', '')
      expect(getCookie('empty_cookie')).toBe('')
    })

    it('should handle very long values', () => {
      const longValue = 'x'.repeat(1000)
      setCookie('long_cookie', longValue)
      expect(getCookie('long_cookie')).toBe(longValue)
    })

    it('should handle multiple cookies simultaneously', () => {
      setCookie('cookie1', 'value1')
      setCookie('cookie2', 'value2')
      setCookie('cookie3', 'value3')
      expect(getCookie('cookie1')).toBe('value1')
      expect(getCookie('cookie2')).toBe('value2')
      expect(getCookie('cookie3')).toBe('value3')
    })
  })
})

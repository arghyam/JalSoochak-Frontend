import { describe, expect, it, jest, afterEach, beforeEach } from '@jest/globals'
import { AxiosError } from 'axios'
import { authApi, buildSetPasswordRequest, buildUpdateProfileRequest } from './auth-api'
import apiClient from '@/shared/lib/axios'
import { parseJWT } from '@/shared/utils/jwt'

jest.mock('@/shared/lib/axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn(), put: jest.fn(), patch: jest.fn() },
}))

jest.mock('@/shared/utils/jwt', () => ({
  parseJWT: jest.fn(() => ({ sub: '1', name: 'Test User', email: 't@x.com' })),
}))

const parseJWTMock = parseJWT as jest.MockedFunction<typeof parseJWT>

const mockedClient = apiClient as jest.Mocked<typeof apiClient>

const tokenPayload = {
  access_token: 'token',
  expires_in: 3600,
  token_type: 'Bearer',
  person_id: 9,
  user_role: 'STATE_ADMIN',
  phone_number: '999',
  tenant_id: 't1',
  tenant_code: 'TC',
}

describe('authApi', () => {
  beforeEach(() => {
    parseJWTMock.mockReturnValue({ sub: '1', name: 'Test User', email: 't@x.com' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('buildSetPasswordRequest omits empty tenant values', () => {
    expect(
      buildSetPasswordRequest({
        userId: '1',
        emailId: 'a@b.com',
        newPassword: 'a',
        confirmPassword: 'a',
      })
    ).toEqual({ userId: '1', emailId: 'a@b.com', newPassword: 'a', confirmPassword: 'a' })
  })

  it('buildSetPasswordRequest includes tenant fields when provided', () => {
    expect(
      buildSetPasswordRequest({
        userId: '1',
        emailId: 'a@b.com',
        newPassword: 'a',
        confirmPassword: 'a',
        tenantCode: 'MH',
        tenantId: '10',
      })
    ).toEqual({
      userId: '1',
      emailId: 'a@b.com',
      newPassword: 'a',
      confirmPassword: 'a',
      tenantCode: 'MH',
      tenantId: '10',
    })
  })

  it('maps login response to user payload', async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: { data: { ...tokenPayload, phone_number: '9' } },
    } as never)
    const res = await authApi.login({ email: 'a', password: 'b' })
    expect(res.accessToken).toBe('token')
    expect(res.user.personId).toBe('9')
    expect(res.user.tenantId).toBe('t1')
    expect(res.user.tenantCode).toBe('TC')
  })

  it('buildUserFromTokenResponse uses empty strings when JWT parse returns null', async () => {
    parseJWTMock.mockReturnValueOnce(null)
    mockedClient.post.mockResolvedValueOnce({
      data: {
        data: {
          access_token: 'tok',
          person_id: 1,
          user_role: 'X',
          phone_number: '',
        },
      },
    } as never)
    const res = await authApi.login({ email: 'a', password: 'b' })
    expect(res.user.name).toBe('')
    expect(res.user.email).toBe('')
  })

  it('refresh returns session when access_token present', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { data: tokenPayload } } as never)
    const res = await authApi.refresh()
    expect(res.accessToken).toBe('token')
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/refresh')
  })

  it('throws when login response has no access_token', async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: { data: { access_token: '', person_id: 1, user_role: 'X', phone_number: '' } },
    } as never)
    await expect(authApi.login({ email: 'a', password: 'b' })).rejects.toThrow(
      'Invalid login response'
    )
  })

  it('throws when refresh response has no access_token', async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: { data: { access_token: '', person_id: 1, user_role: 'X', phone_number: '' } },
    } as never)
    await expect(authApi.refresh()).rejects.toThrow('Invalid token response')
  })

  it('calls logout endpoint', async () => {
    mockedClient.post.mockResolvedValueOnce({} as never)
    await authApi.logout()
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/logout')
  })

  it('register posts full payload', async () => {
    mockedClient.post.mockResolvedValueOnce({} as never)
    const payload = {
      firstName: 'A',
      lastName: 'B',
      email: 'e@e.com',
      phoneNumber: '1',
      password: 'secret',
      personType: 'ADMIN',
      tenantId: '10',
    }
    await authApi.register(payload)
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/register', payload)
  })

  it('getUserByInviteId resolves known invite after delay', async () => {
    jest.useFakeTimers()
    try {
      const p = authApi.getUserByInviteId('invite-123')
      await jest.advanceTimersByTimeAsync(500)
      await expect(p).resolves.toEqual({ email: 'test@test.com' })
    } finally {
      jest.useRealTimers()
    }
  })

  it('getUserByInviteId rejects unknown id', async () => {
    jest.useFakeTimers()
    try {
      const p = authApi.getUserByInviteId('bad')
      const assertion = expect(p).rejects.toThrow(/Invalid or expired invite/)
      await jest.advanceTimersByTimeAsync(500)
      await assertion
    } finally {
      jest.useRealTimers()
    }
  })

  it('createPassword succeeds without optional headers', async () => {
    mockedClient.post.mockResolvedValueOnce({} as never)
    await authApi.createPassword({
      userId: '1',
      emailId: 'a@b.com',
      newPassword: 'x',
      confirmPassword: 'x',
    })
    expect(mockedClient.post).toHaveBeenCalledWith(
      '/api/v2/user/set-password',
      expect.objectContaining({ userId: '1' }),
      expect.objectContaining({ headers: undefined })
    )
  })

  it('createPassword sends tenant headers when provided', async () => {
    mockedClient.post.mockResolvedValueOnce({} as never)
    await authApi.createPassword({
      userId: '1',
      emailId: 'a@b.com',
      newPassword: 'x',
      confirmPassword: 'x',
      tenantCode: 'MH',
      tenantId: '9',
    })
    expect(mockedClient.post).toHaveBeenCalledWith(
      '/api/v2/user/set-password',
      expect.any(Object),
      expect.objectContaining({
        headers: { 'X-Tenant-Code': 'MH', 'tenant-id': '9' },
      })
    )
  })

  it('createPassword surfaces axios response message', async () => {
    const err = new AxiosError('fail')
    err.response = { data: { message: 'Weak password' }, status: 400 } as never
    mockedClient.post.mockRejectedValueOnce(err)
    await expect(
      authApi.createPassword({
        userId: '1',
        emailId: 'a@b.com',
        newPassword: 'x',
        confirmPassword: 'x',
      })
    ).rejects.toThrow('Weak password')
  })

  it('createPassword falls back to Error message when not axios', async () => {
    mockedClient.post.mockRejectedValueOnce(new Error('network down'))
    await expect(
      authApi.createPassword({
        userId: '1',
        emailId: 'a@b.com',
        newPassword: 'x',
        confirmPassword: 'x',
      })
    ).rejects.toThrow('network down')
  })

  it('createPassword uses generic message for non-Error rejection', async () => {
    mockedClient.post.mockRejectedValueOnce('weird')
    await expect(
      authApi.createPassword({
        userId: '1',
        emailId: 'a@b.com',
        newPassword: 'x',
        confirmPassword: 'x',
      })
    ).rejects.toThrow('Failed to create password.')
  })

  it('getUserProfile returns data on success', async () => {
    const profile = {
      userId: '1',
      firstName: 'F',
      lastName: 'L',
      primaryEmail: 'a@b.com',
      primaryNumber: '1',
      role: 'R',
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: '',
    }
    mockedClient.get.mockResolvedValueOnce({ data: profile } as never)
    await expect(authApi.getUserProfile('1')).resolves.toEqual(profile)
  })

  it('getUserProfile passes optional headers', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: {} } as never)
    await authApi.getUserProfile('1', { tenantCode: 'MH', tenantId: '9' })
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v2/user/1', {
      headers: { 'X-Tenant-Code': 'MH', 'tenant-id': '9' },
    })
  })

  it('getUserProfile maps axios error message', async () => {
    const err = new AxiosError('x')
    err.response = { data: { message: 'missing' }, status: 404 } as never
    mockedClient.get.mockRejectedValueOnce(err)
    await expect(authApi.getUserProfile('1')).rejects.toThrow('missing')
  })

  it('changePassword posts payload', async () => {
    mockedClient.post.mockResolvedValueOnce({} as never)
    await authApi.changePassword('9', {
      currentPassword: 'a',
      newPassword: 'b',
      confirmPassword: 'b',
    })
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v2/user/9/change-password', {
      currentPassword: 'a',
      newPassword: 'b',
      confirmPassword: 'b',
    })
  })

  it('changePassword prefers axios message on failure', async () => {
    const err = new AxiosError('x')
    err.response = { data: { message: 'Policy' }, status: 400 } as never
    mockedClient.post.mockRejectedValueOnce(err)
    await expect(
      authApi.changePassword('1', {
        currentPassword: 'a',
        newPassword: 'b',
        confirmPassword: 'b',
      })
    ).rejects.toThrow('Policy')
  })

  it('updateProfile puts with optional headers', async () => {
    mockedClient.put.mockResolvedValueOnce({} as never)
    const body = {
      role: 'R',
      firstname: 'F',
      lastname: 'L',
      primaryemail: 'a@b.com',
      primarynumber: '1',
    }
    await authApi.updateProfile('2', body, { tenantCode: 'TN' })
    expect(mockedClient.put).toHaveBeenCalledWith('/api/v2/user/2', body, {
      headers: { 'X-Tenant-Code': 'TN' },
    })
  })

  it('getInviteInfo returns envelope data', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: {
        data: {
          email: 'e@e.com',
          role: 'STATE_ADMIN',
          tenantName: 'T',
          firstName: 'A',
          lastName: 'B',
          phoneNumber: '1',
        },
      },
    } as never)
    const res = await authApi.getInviteInfo('tok')
    expect(res.email).toBe('e@e.com')
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/auth/invites', {
      params: { token: 'tok' },
    })
  })

  it('getInviteInfo maps backend message', async () => {
    const err = new AxiosError('x')
    err.response = { data: { message: 'Expired' }, status: 400 } as never
    mockedClient.get.mockRejectedValueOnce(err)
    await expect(authApi.getInviteInfo('bad')).rejects.toThrow('Expired')
  })

  it('getMyProfile unwraps ApiResponse', async () => {
    const me = {
      id: 1,
      email: 'e@e.com',
      firstName: 'F',
      lastName: 'L',
      phoneNumber: '1',
      role: 'R',
      tenantCode: 'TC',
      active: true,
      createdAt: '',
    }
    mockedClient.get.mockResolvedValueOnce({ data: { data: me } } as never)
    await expect(authApi.getMyProfile()).resolves.toEqual(me)
  })

  it('updateMyProfile returns updated user', async () => {
    const me = {
      id: 1,
      email: 'e@e.com',
      firstName: 'F',
      lastName: 'L',
      phoneNumber: '1',
      role: 'R',
      tenantCode: 'TC',
      active: true,
      createdAt: '',
    }
    mockedClient.patch.mockResolvedValueOnce({ data: { data: me } } as never)
    await expect(authApi.updateMyProfile({ firstName: 'G' })).resolves.toEqual(me)
  })

  it('changeMyPassword patches endpoint', async () => {
    mockedClient.patch.mockResolvedValueOnce({} as never)
    await authApi.changeMyPassword({
      currentPassword: 'a',
      newPassword: 'b',
    })
    expect(mockedClient.patch).toHaveBeenCalledWith('/api/v1/users/me/password', {
      currentPassword: 'a',
      newPassword: 'b',
    })
  })

  it('activateAccount returns login response', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { data: tokenPayload } } as never)
    const res = await authApi.activateAccount({
      inviteToken: 't',
      firstName: 'A',
      lastName: 'B',
      phoneNumber: '1',
      password: 'p',
    })
    expect(res.accessToken).toBe('token')
  })

  it('activateAccount throws when access_token missing', async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: { data: { ...tokenPayload, access_token: '' } },
    } as never)
    await expect(
      authApi.activateAccount({
        inviteToken: 't',
        firstName: 'A',
        lastName: 'B',
        phoneNumber: '1',
        password: 'p',
      })
    ).rejects.toThrow('Invalid activation response')
  })

  it('activateAccount maps axios error', async () => {
    const err = new AxiosError('x')
    err.response = { data: { message: 'Bad token' }, status: 400 } as never
    mockedClient.post.mockRejectedValueOnce(err)
    await expect(
      authApi.activateAccount({
        inviteToken: 't',
        firstName: 'A',
        lastName: 'B',
        phoneNumber: '1',
        password: 'p',
      })
    ).rejects.toThrow('Bad token')
  })

  it('forgotPassword error path uses axios message', async () => {
    const err = new AxiosError('x')
    err.response = { data: { message: 'Rate limit' }, status: 429 } as never
    mockedClient.post.mockRejectedValueOnce(err)
    await expect(authApi.forgotPassword('a@b.com')).rejects.toThrow('Rate limit')
  })

  it('resetPassword posts payload', async () => {
    mockedClient.post.mockResolvedValueOnce({} as never)
    await authApi.resetPassword({ token: 't', newPassword: 'n' })
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/reset-password', {
      token: 't',
      newPassword: 'n',
    })
  })

  it('resetPassword maps errors', async () => {
    const err = new AxiosError('x')
    err.response = { data: { message: 'Invalid token' }, status: 400 } as never
    mockedClient.post.mockRejectedValueOnce(err)
    await expect(authApi.resetPassword({ token: 't', newPassword: 'n' })).rejects.toThrow(
      'Invalid token'
    )
  })

  it('forgotPassword completes when post succeeds', async () => {
    mockedClient.post.mockResolvedValueOnce({} as never)
    await authApi.forgotPassword('a@b.com')
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
      email: 'a@b.com',
    })
  })

  it('buildUpdateProfileRequest includes non-empty secondary fields', () => {
    expect(
      buildUpdateProfileRequest({
        role: 'R',
        firstName: 'F',
        lastName: 'L',
        primaryEmail: 'a@b.com',
        primaryNumber: '999',
        secondaryEmail: 's@b.com',
        secondaryNumber: '888',
      })
    ).toEqual(
      expect.objectContaining({
        secondaryemail: 's@b.com',
        secondarynumber: '888',
      })
    )
  })

  it('buildUpdateProfileRequest excludes empty optional values', () => {
    expect(
      buildUpdateProfileRequest({
        role: 'R',
        firstName: 'F',
        lastName: 'L',
        primaryEmail: 'a@b.com',
        primaryNumber: '999',
        secondaryEmail: '',
      })
    ).toEqual({
      role: 'R',
      firstname: 'F',
      lastname: 'L',
      primaryemail: 'a@b.com',
      primarynumber: '999',
    })
  })
})

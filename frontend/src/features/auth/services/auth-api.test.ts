import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { AxiosError } from 'axios'
import { authApi, buildSetPasswordRequest, buildUpdateProfileRequest } from './auth-api'
import apiClient from '@/shared/lib/axios'

jest.mock('@/shared/lib/axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn(), put: jest.fn(), patch: jest.fn() },
}))
jest.mock('@/shared/utils/jwt', () => ({
  parseJWT: () => ({ name: 'Test User', email: 't@x.com' }),
}))

const mockedClient = apiClient as jest.Mocked<typeof apiClient>

describe('authApi', () => {
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
      data: {
        data: { access_token: 'token', person_id: 9, user_role: 'STATE_ADMIN', phone_number: '9' },
      },
    } as never)
    const res = await authApi.login({ email: 'a', password: 'b' })
    expect(res.accessToken).toBe('token')
    expect(res.user.personId).toBe('9')
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

  it('forgotPassword completes when post succeeds', async () => {
    mockedClient.post.mockResolvedValueOnce({} as never)
    await authApi.forgotPassword('a@b.com')
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
      email: 'a@b.com',
    })
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

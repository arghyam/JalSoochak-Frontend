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
  afterEach(() => jest.clearAllMocks())

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

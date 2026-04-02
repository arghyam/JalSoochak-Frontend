import { staffAuthApi } from './staff-auth-api'
import apiClient from '@/shared/lib/axios'

jest.mock('@/shared/lib/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

const mockPost = apiClient.post as jest.Mock
const mockGet = apiClient.get as jest.Mock

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.' +
  btoa(
    JSON.stringify({ sub: '1', name: 'Test User', email: 'test@example.com', exp: 9999999999 })
  ) +
  '.signature'

const MOCK_TOKEN_RESPONSE = {
  access_token: MOCK_ACCESS_TOKEN,
  expires_in: 300,
  token_type: 'Bearer',
  person_id: 15,
  tenant_id: '50',
  tenant_code: 'NL',
  user_role: 'SECTION_OFFICER',
  phone_number: '918179020960',
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('staffAuthApi.requestOtp', () => {
  it('calls POST /api/v1/auth/staff/otp with correct payload', async () => {
    const mockResponse = { data: { status: 200, message: 'OTP sent', otpLength: 6 } }
    mockPost.mockResolvedValueOnce(mockResponse)

    const result = await staffAuthApi.requestOtp({ phoneNumber: '918179020960', tenantCode: 'NL' })

    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/staff/otp', {
      phoneNumber: '918179020960',
      tenantCode: 'NL',
    })
    expect(result).toEqual({ status: 200, message: 'OTP sent', otpLength: 6 })
  })

  it('propagates API errors', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'))
    await expect(
      staffAuthApi.requestOtp({ phoneNumber: '918179020960', tenantCode: 'NL' })
    ).rejects.toThrow('Network error')
  })
})

describe('staffAuthApi.verifyOtp', () => {
  it('calls POST /api/v1/auth/staff/otp/verify and maps token response to LoginResponse', async () => {
    mockPost.mockResolvedValueOnce({ data: { status: 200, data: MOCK_TOKEN_RESPONSE } })

    const result = await staffAuthApi.verifyOtp({
      phoneNumber: '918179020960',
      tenantCode: 'NL',
      otp: '123456',
    })

    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/staff/otp/verify', {
      phoneNumber: '918179020960',
      tenantCode: 'NL',
      otp: '123456',
    })
    expect(result.accessToken).toBe(MOCK_ACCESS_TOKEN)
    expect(result.user.role).toBe('SECTION_OFFICER')
    expect(result.user.tenantCode).toBe('NL')
    expect(result.user.phoneNumber).toBe('918179020960')
  })

  it('throws when access_token is missing in response', async () => {
    mockPost.mockResolvedValueOnce({
      data: { status: 200, data: { ...MOCK_TOKEN_RESPONSE, access_token: '' } },
    })
    await expect(
      staffAuthApi.verifyOtp({ phoneNumber: '918179020960', tenantCode: 'NL', otp: '123456' })
    ).rejects.toThrow('Invalid login response')
  })
})

describe('staffAuthApi.getPublicTenants', () => {
  it('fetches and maps all tenant pages', async () => {
    const page1 = {
      data: {
        status: 200,
        data: {
          content: [{ id: 1, stateCode: 'NL', name: 'Nagaland', status: 'ACTIVE' }],
          totalElements: 2,
          totalPages: 2,
        },
      },
    }
    const page2 = {
      data: {
        status: 200,
        data: {
          content: [{ id: 2, stateCode: 'MH', name: 'Maharashtra', status: 'ACTIVE' }],
          totalElements: 2,
          totalPages: 2,
        },
      },
    }
    mockGet.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2)

    const result = await staffAuthApi.getPublicTenants()

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ id: 1, stateCode: 'NL', name: 'Nagaland', status: 'ACTIVE' })
    expect(result[1]).toEqual({ id: 2, stateCode: 'MH', name: 'Maharashtra', status: 'ACTIVE' })
  })

  it('returns single page when totalPages is 1', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        status: 200,
        data: {
          content: [{ id: 1, stateCode: 'NL', name: 'Nagaland', status: 'ACTIVE' }],
          totalElements: 1,
          totalPages: 1,
        },
      },
    })

    const result = await staffAuthApi.getPublicTenants()
    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(result).toHaveLength(1)
  })
})

export interface OtpRequestPayload {
  phoneNumber: string
  tenantCode: string
}

export interface OtpRequestResponse {
  status: number
  message: string
  otpLength?: number
}

export interface OtpVerifyPayload {
  phoneNumber: string
  tenantCode: string
  otp: string
}

export interface PublicTenant {
  id: number
  stateCode: string
  name: string
  status: string
}

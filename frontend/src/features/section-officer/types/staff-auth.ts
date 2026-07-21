export interface OtpRequestPayload {
  phoneNumber: string
  tenantCode: string
  /** reCAPTCHA v2 token; sent only when captcha is enabled. */
  captchaToken?: string
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

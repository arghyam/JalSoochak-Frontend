export interface YesterdayFinalReadingItem {
  schemeId: number
  schemeName: string
  yesterdayFinalReading: number
  phoneNumber: string
}

export interface YesterdayFinalReadingResponse {
  content: YesterdayFinalReadingItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface UpdateFinalReadingPayload {
  phoneNumber: string
  reading: number
}

export interface IndiaState {
  code: string
  name: string
  lgdCode: number
}

export const INDIA_STATES: IndiaState[] = [
  { code: 'AN', name: 'Andaman and Nicobar Islands', lgdCode: 35 },
  { code: 'AP', name: 'Andhra Pradesh', lgdCode: 28 },
  { code: 'AR', name: 'Arunachal Pradesh', lgdCode: 12 },
  { code: 'AS', name: 'Assam', lgdCode: 18 },
  { code: 'BR', name: 'Bihar', lgdCode: 10 },
  { code: 'CH', name: 'Chandigarh', lgdCode: 4 },
  { code: 'CG', name: 'Chhattisgarh', lgdCode: 22 },
  { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', lgdCode: 38 },
  { code: 'DL', name: 'Delhi', lgdCode: 7 },
  { code: 'GA', name: 'Goa', lgdCode: 30 },
  { code: 'GJ', name: 'Gujarat', lgdCode: 24 },
  { code: 'HR', name: 'Haryana', lgdCode: 6 },
  { code: 'HP', name: 'Himachal Pradesh', lgdCode: 2 },
  { code: 'JK', name: 'Jammu and Kashmir', lgdCode: 1 },
  { code: 'JH', name: 'Jharkhand', lgdCode: 20 },
  { code: 'KA', name: 'Karnataka', lgdCode: 29 },
  { code: 'KL', name: 'Kerala', lgdCode: 32 },
  { code: 'LA', name: 'Ladakh', lgdCode: 37 },
  { code: 'LD', name: 'Lakshadweep', lgdCode: 31 },
  { code: 'MP', name: 'Madhya Pradesh', lgdCode: 23 },
  { code: 'MH', name: 'Maharashtra', lgdCode: 27 },
  { code: 'MN', name: 'Manipur', lgdCode: 14 },
  { code: 'ML', name: 'Meghalaya', lgdCode: 17 },
  { code: 'MZ', name: 'Mizoram', lgdCode: 15 },
  { code: 'NL', name: 'Nagaland', lgdCode: 13 },
  { code: 'OR', name: 'Odisha', lgdCode: 21 },
  { code: 'PY', name: 'Puducherry', lgdCode: 34 },
  { code: 'PB', name: 'Punjab', lgdCode: 3 },
  { code: 'RJ', name: 'Rajasthan', lgdCode: 8 },
  { code: 'SK', name: 'Sikkim', lgdCode: 11 },
  { code: 'TN', name: 'Tamil Nadu', lgdCode: 33 },
  { code: 'TG', name: 'Telangana', lgdCode: 36 },
  { code: 'TR', name: 'Tripura', lgdCode: 16 },
  { code: 'UP', name: 'Uttar Pradesh', lgdCode: 9 },
  { code: 'UK', name: 'Uttarakhand', lgdCode: 5 },
  { code: 'WB', name: 'West Bengal', lgdCode: 19 },
]

const toStateNameSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Convert a full-name slug (e.g. "uttar-pradesh") to a 2-letter code (e.g. "up"). */
export const stateSlugToCode = (slug: string): string | undefined => {
  if (!slug) return undefined
  return INDIA_STATES.find((s) => toStateNameSlug(s.name) === slug)?.code.toLowerCase()
}

/** Convert a 2-letter code (e.g. "up") back to a full-name slug (e.g. "uttar-pradesh"). */
export const stateCodeToSlug = (code: string): string | undefined => {
  if (!code) return undefined
  const state = INDIA_STATES.find((s) => s.code.toLowerCase() === code.toLowerCase())
  return state ? toStateNameSlug(state.name) : undefined
}

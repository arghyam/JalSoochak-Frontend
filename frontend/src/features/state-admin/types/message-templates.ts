export type LanguageCode =
  | 'en'
  | 'hi'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'mr'
  | 'gu'
  | 'bn'
  | 'pa'
  | 'ur'
  | 'or'
  | 'as'

export type ScreenName =
  | 'ISSUE_REPORT'
  | 'INTRO_MESSAGE'
  | 'ITEM_SELECTION'
  | 'CLOSING_MESSAGE'
  | 'CHANNEL_SELECTION'
  | 'LANGUAGE_SELECTION'

export type LocalizedStrings = Record<LanguageCode, string | null>

export interface OrderedItem {
  order: number
  label: LocalizedStrings
}

export interface ScreenContent {
  prompt: LocalizedStrings | null
  options: Record<string, OrderedItem> | null
  reasons: Record<string, OrderedItem> | null
  confirmationTemplate: LocalizedStrings | null
  message: LocalizedStrings | null
}

export interface MessageTemplatesData {
  screens: Partial<Record<ScreenName, ScreenContent>>
  supportedLanguages: { language: string; preference: number }[]
}

export const SCREEN_NAMES: ScreenName[] = [
  'ISSUE_REPORT',
  'INTRO_MESSAGE',
  'ITEM_SELECTION',
  'CLOSING_MESSAGE',
  'CHANNEL_SELECTION',
  'LANGUAGE_SELECTION',
]

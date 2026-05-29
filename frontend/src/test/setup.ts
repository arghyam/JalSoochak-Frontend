/// <reference types="node" />

// Chakra checkbox/switch calls trackFocusVisible, which patches HTMLElement.prototype.focus and
// throws in jsdom ("Cannot set property focus of #<HTMLElement> which has only a getter").
jest.mock('@zag-js/focus-visible', () => ({
  trackFocusVisible: jest.fn(() => () => {}),
}))

import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'node:util'

window.APP_CONFIG = {
  API_BASE_URL: '',
  SINGLE_TENANT_MODE: false,
  SHOW_SUPPLY_OUTAGE_CHARTS: true,
  SHOW_STAFF_OVERVIEW_SUPPLY_OUTAGE_CHARTS: true,
  SHOW_STAFF_OVERVIEW_NON_SUBMISSION_CHARTS: true,
}

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
}

;(
  globalThis as typeof globalThis & { schemeQuantityPeriodicData?: unknown }
).schemeQuantityPeriodicData = undefined

Object.defineProperty(globalThis.URL, 'createObjectURL', {
  writable: true,
  value: () => 'blob:mock-url',
})

Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
  writable: true,
  value: () => {},
})

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Chakra Menu calls scrollTo on menu container; jsdom may omit it.
Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  configurable: true,
  writable: true,
  value: jest.fn(),
})

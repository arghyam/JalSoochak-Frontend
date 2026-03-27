/// <reference types="node" />

import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'node:util'

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
}

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

/**
 * Shared validation utilities for form field validation across state-admin pages.
 */

const HTML_TAG_REGEX = /<[^>]*>/
const SQL_INJECTION_REGEX =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION|CREATE|TRUNCATE)\b|--|;[\s]*$|'[\s]*;|'[\s]*OR\b|'[\s]*AND\b)/i

/**
 * Returns true if the value is empty or contains only whitespace.
 */
export function isEmptyOrWhitespace(value: string): boolean {
  return value.trim().length === 0
}

/**
 * Returns true if the value contains HTML tags.
 */
export function containsHtmlTags(value: string): boolean {
  return HTML_TAG_REGEX.test(value)
}

/**
 * Returns true if the value contains common SQL injection patterns.
 */
export function containsSqlInjection(value: string): boolean {
  return SQL_INJECTION_REGEX.test(value)
}

/**
 * Returns true if the value contains only alphanumeric characters and spaces.
 */
export function isAlphanumericWithSpaces(value: string): boolean {
  return /^[a-zA-Z0-9\s]+$/.test(value)
}

/**
 * Returns true if the value exceeds the given maximum character length.
 */
export function exceedsMaxLength(value: string, max: number): boolean {
  return value.length > max
}

/**
 * Returns true if the value is a valid HTTPS URL.
 */
export function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Returns true if the value starts with https:// exactly once.
 * Prevents double-protocol values like "https://foo/https://bar".
 */
export function hasHttpsOnce(value: string): boolean {
  const prefix = 'https://'
  return value.startsWith(prefix) && !value.slice(prefix.length).includes(prefix)
}

/**
 * Returns true if the array contains duplicate values (case-insensitive).
 */
export function hasDuplicates(values: string[]): boolean {
  const normalized = values.map((v) => v.trim().toLowerCase())
  return new Set(normalized).size !== normalized.length
}

/**
 * Validates a text field for common issues.
 * Returns the first validation error key or null if valid.
 * Does NOT check for empty — call isEmptyOrWhitespace separately.
 */
export function validateTextField(value: string): string | null {
  if (containsHtmlTags(value)) return 'containsHtmlTags'
  if (containsSqlInjection(value)) return 'containsSqlInjection'
  return null
}

/**
 * Validates a descriptive text field (meter reasons, hierarchy names).
 * Checks: empty, HTML, SQL, alphanumeric+spaces.
 * Returns the first validation error key or null if valid.
 */
export function validateDescriptiveField(value: string): string | null {
  if (isEmptyOrWhitespace(value)) return 'emptyOrWhitespace'
  if (containsHtmlTags(value)) return 'containsHtmlTags'
  if (containsSqlInjection(value)) return 'containsSqlInjection'
  if (!isAlphanumericWithSpaces(value)) return 'alphanumericOnly'
  return null
}

/**
 * Returns true if the value contains only alphabetic characters and spaces.
 * Used for name fields (firstName, lastName).
 */
export function isAlphabeticWithSpaces(value: string): boolean {
  return /^[a-zA-Z\s]+$/.test(value)
}

/**
 * Returns true if the value meets password complexity requirements:
 * min 8 chars, at least one uppercase, one lowercase, one digit, one special character.
 */
export function isValidPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

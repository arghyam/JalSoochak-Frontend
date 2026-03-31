export const sanitizeLocationLabel = (value: string): string => {
  const normalized = Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return !(codePoint <= 0x1f || codePoint === 0x7f)
    })
    .join('')
    .trim()
  if (!normalized) {
    return ''
  }

  // Administrative labels should never contain HTML delimiters. Treat them as invalid input.
  if (/[<>]/.test(normalized)) {
    return ''
  }

  return normalized.replace(/\s+/g, ' ')
}

export const toCapitalizedWords = (value: string): string => {
  const normalized = sanitizeLocationLabel(value).toLocaleLowerCase()
  if (!normalized) {
    return ''
  }

  return normalized.replace(/(^|[\s\-/'(])(\p{L})/gu, (_, prefix: string, letter: string) => {
    return `${prefix}${letter.toUpperCase()}`
  })
}

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

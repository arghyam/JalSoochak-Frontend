export const toCapitalizedWords = (value: string): string => {
  const normalized = value.trim().toLocaleLowerCase()
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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const MAX_AXIS_LABEL_LINES = 2
const MAX_AXIS_LABEL_LINE_LENGTH = 14

const truncateAxisLabelLine = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value
  }

  if (maxLength <= 1) {
    return '...'
  }

  return `${value.slice(0, Math.max(1, maxLength - 3)).trimEnd()}...`
}

const appendAxisLabelEllipsis = (value: string, maxLength: number) => {
  const normalizedValue = value.trimEnd()
  if (!normalizedValue) {
    return '...'
  }

  if (normalizedValue.endsWith('...')) {
    return truncateAxisLabelLine(normalizedValue, maxLength)
  }

  return truncateAxisLabelLine(`${normalizedValue}...`, maxLength)
}

export const formatAxisLabel = (
  value: string,
  maxLineLength = MAX_AXIS_LABEL_LINE_LENGTH,
  maxLines = MAX_AXIS_LABEL_LINES
) => {
  const normalizedValue = value.trim()
  if (!normalizedValue) {
    return ''
  }

  const words = normalizedValue.split(/\s+/)
  const lines: string[] = []
  let wordIndex = 0

  while (wordIndex < words.length && lines.length < maxLines) {
    let line = ''

    while (wordIndex < words.length) {
      const word = words[wordIndex]
      const nextLine = line ? `${line} ${word}` : word

      if (nextLine.length <= maxLineLength) {
        line = nextLine
        wordIndex += 1
        continue
      }

      if (!line) {
        if (lines.length === maxLines - 1) {
          lines.push(truncateAxisLabelLine(word, maxLineLength))
          return lines.join('\n')
        }

        lines.push(word.slice(0, maxLineLength))
        words[wordIndex] = word.slice(maxLineLength)
        line = ''
      }

      break
    }

    if (line) {
      lines.push(line)
    }
  }

  if (wordIndex < words.length && lines.length > 0) {
    const lastVisibleLineIndex = lines.length - 1
    lines[lastVisibleLineIndex] = appendAxisLabelEllipsis(
      lines[lastVisibleLineIndex] ?? '',
      maxLineLength
    )
  }

  return lines.join('\n')
}

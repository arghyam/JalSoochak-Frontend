/**
 * Sanitizes a CSV cell value to prevent formula injection attacks.
 * Prefixes values starting with =, +, -, or @ with a single quote.
 * @param value The cell value to sanitize
 * @returns The sanitized value safe for CSV export
 */
export function sanitizeCsvCell(value: string | number | boolean): string {
  const stringValue = String(value)
  const firstChar = stringValue.charAt(0)

  // Check if value starts with formula injection characters
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@') {
    return `'${stringValue}`
  }

  return stringValue
}

/**
 * Sanitizes all cells in a 2D CSV data array.
 * @param csvData 2D array of cell values
 * @returns Sanitized 2D array
 */
export function sanitizeCsvData(csvData: (string | number | boolean)[][]): string[][] {
  return csvData.map((row) => row.map((cell) => sanitizeCsvCell(cell)))
}

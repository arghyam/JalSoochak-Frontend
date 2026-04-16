/**
 * Formats SCREAMING_SNAKE_CASE to Title Case with spaces
 * @example "WATER_LEAKAGE" -> "Water Leakage"
 * @example "PUMP_FAILURE" -> "Pump Failure"
 */
export const formatScreamingSnakeCase = (str: string): string => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

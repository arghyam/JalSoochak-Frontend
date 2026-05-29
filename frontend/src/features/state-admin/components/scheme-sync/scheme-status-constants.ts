export const WORK_STATUS_OPTIONS = ['Not Started', 'Ongoing', 'Completed', 'Handed Over'] as const

export const OPERATING_STATUS_OPTIONS = [
  'Non-Operative',
  'Partially Operative',
  'Operative',
] as const

export const SCHEME_STATUS_COLOR_MAP: Record<string, { bg: string; color: string }> = {
  'Not Started': { bg: 'neutral.100', color: 'neutral.600' },
  Ongoing: { bg: 'warning.50', color: 'warning.600' },
  Completed: { bg: 'success.50', color: 'success.500' },
  'Handed Over': { bg: 'primary.50', color: 'primary.600' },
  'Non-Operative': { bg: 'error.50', color: 'error.500' },
  'Partially Operative': { bg: 'warning.50', color: 'warning.600' },
  Operative: { bg: 'success.50', color: 'success.500' },
}

const DEFAULT_SCHEME_STATUS_COLORS = { bg: 'neutral.100', color: 'neutral.600' }

export function getSchemeStatusColors(status: string) {
  return SCHEME_STATUS_COLOR_MAP[status] ?? DEFAULT_SCHEME_STATUS_COLORS
}

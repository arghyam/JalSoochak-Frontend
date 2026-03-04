import { Badge } from '@chakra-ui/react'

const STATUS_COLOR_MAP: Record<string, { bg: string; color: string }> = {
  active: { bg: 'success.50', color: 'success.500' },
  inactive: { bg: 'error.50', color: 'error.500' },
  successful: { bg: 'success.50', color: 'success.500' },
  success: { bg: 'success.50', color: 'success.500' },
  failed: { bg: 'error.50', color: 'error.500' },
  warning: { bg: 'warning.50', color: 'warning.500' },
  completed: { bg: 'success.50', color: 'success.500' },
  pending: { bg: 'warning.50', color: 'warning.500' },
  good: { bg: 'success.50', color: 'success.500' },
  'needs-attention': { bg: 'warning.50', color: 'warning.600' },
  critical: { bg: 'error.50', color: 'error.600' },
}

const DEFAULT_COLORS = { bg: 'neutral.100', color: 'neutral.600' }

export interface StatusChipProps {
  status: string
  label: string
}

export function StatusChip({ status, label }: StatusChipProps) {
  const { bg, color } = STATUS_COLOR_MAP[status] ?? DEFAULT_COLORS

  return (
    <Badge
      bg={bg}
      color={color}
      px={2}
      py={0.5}
      borderRadius="16px"
      fontSize="12px"
      fontWeight="500"
      textTransform="capitalize"
      h={6}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
    >
      {label}
    </Badge>
  )
}
